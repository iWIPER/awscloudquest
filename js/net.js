/**
 * AWS Cloud Quest — room messaging for the duel.
 *
 * GitHub Pages has no server, so the two players talk through a public MQTT
 * broker over a secure WebSocket. This is a minimal MQTT 3.1.1 client: just
 * CONNECT, SUBSCRIBE, PUBLISH (QoS 0), PINGREQ and DISCONNECT, enough to share
 * one topic per room. Messages are JSON objects.
 *
 * A second transport, "local", uses BroadcastChannel between pages of the same
 * browser. The smoke test uses it to play a duel without the internet.
 *
 * The packet encoders and the stream parser are pure and exported for tests.
 */
(function (root) {
  "use strict";

  const KEEPALIVE_S = 30;
  const CONNECT_TIMEOUT_MS = 8000;

  const utf8 = (text) => new TextEncoder().encode(text);

  /** MQTT "remaining length": 7 bits per byte, high bit = more bytes follow. */
  function encodeLength(length) {
    const out = [];
    do {
      let byte = length % 128;
      length = Math.floor(length / 128);
      if (length > 0) byte |= 0x80;
      out.push(byte);
    } while (length > 0);
    return out;
  }

  /** Length-prefixed UTF-8 string. */
  function str(text) {
    const bytes = utf8(text);
    return [bytes.length >> 8, bytes.length & 0xff, ...bytes];
  }

  const packet = (type, body) => Uint8Array.from([type, ...encodeLength(body.length), ...body]);

  const encode = Object.freeze({
    connect(clientId, keepalive = KEEPALIVE_S) {
      // Protocol "MQTT", level 4 (3.1.1), clean session, keep-alive in seconds.
      return packet(0x10, [...str("MQTT"), 4, 0x02, keepalive >> 8, keepalive & 0xff, ...str(clientId)]);
    },
    subscribe(packetId, topic) {
      return packet(0x82, [packetId >> 8, packetId & 0xff, ...str(topic), 0]);
    },
    publish(topic, payload) {
      return packet(0x30, [...str(topic), ...utf8(payload)]);
    },
    ping: () => Uint8Array.from([0xc0, 0]),
    disconnect: () => Uint8Array.from([0xe0, 0]),
  });

  /**
   * Splits a byte stream into MQTT packets. WebSocket frames may carry part of
   * a packet or several packets, so bytes are buffered until complete.
   * `onPacket({ type, body })` gets the packet type (high nibble) and its body.
   */
  function createParser(onPacket) {
    let buffer = new Uint8Array(0);
    return function feed(chunk) {
      const merged = new Uint8Array(buffer.length + chunk.length);
      merged.set(buffer);
      merged.set(chunk, buffer.length);
      buffer = merged;
      for (;;) {
        if (buffer.length < 2) return;
        let length = 0;
        let multiplier = 1;
        let i = 1;
        let byte;
        do {
          if (i >= buffer.length) return; // length bytes not complete yet
          byte = buffer[i++];
          length += (byte & 0x7f) * multiplier;
          multiplier *= 128;
        } while (byte & 0x80);
        if (buffer.length < i + length) return; // body not complete yet
        onPacket({ type: buffer[0] >> 4, flags: buffer[0] & 0x0f, body: buffer.slice(i, i + length) });
        buffer = buffer.slice(i + length);
      }
    };
  }

  /** Topic and payload text of a PUBLISH body (QoS 0: no packet id). */
  function readPublish(body, flags = 0) {
    const topicLength = (body[0] << 8) | body[1];
    const topic = new TextDecoder().decode(body.slice(2, 2 + topicLength));
    const qos = (flags >> 1) & 3;
    const start = 2 + topicLength + (qos > 0 ? 2 : 0);
    return { topic, payload: new TextDecoder().decode(body.slice(start)) };
  }

  const parseJson = (text) => {
    try {
      const value = JSON.parse(text);
      return value && typeof value === "object" ? value : null;
    } catch {
      return null;
    }
  };

  /** Connects to one broker; resolves once subscribed to `topic`. */
  function connectBroker(url, { topic, clientId, onMessage, onClose }) {
    return new Promise((resolve, reject) => {
      let ws;
      try {
        ws = new WebSocket(url, "mqtt");
      } catch (error) {
        reject(error);
        return;
      }
      ws.binaryType = "arraybuffer";
      let ready = false;
      let pinger = 0;
      const fail = (reason) => {
        clearTimeout(timer);
        clearInterval(pinger);
        if (!ready) reject(new Error(reason));
        else onClose(reason);
        try {
          ws.close();
        } catch {
          /* already closed */
        }
      };
      const timer = setTimeout(() => fail("timeout"), CONNECT_TIMEOUT_MS);
      const send = (bytes) => ws.readyState === 1 && ws.send(bytes);

      const feed = createParser(({ type, flags, body }) => {
        if (type === 2) {
          // CONNACK: body[1] is the return code (0 = accepted).
          if (body[1] !== 0) return fail(`refused ${body[1]}`);
          send(encode.subscribe(1, topic));
        } else if (type === 9) {
          // SUBACK: 0x80 means the subscription failed.
          if (body[2] === 0x80) return fail("subscribe refused");
          ready = true;
          clearTimeout(timer);
          pinger = setInterval(() => send(encode.ping()), (KEEPALIVE_S * 1000) / 2);
          resolve({
            url,
            send: (message) => send(encode.publish(topic, JSON.stringify(message))),
            close() {
              clearInterval(pinger);
              send(encode.disconnect());
              ws.onclose = null;
              ws.close();
            },
          });
        } else if (type === 3) {
          const { topic: from, payload } = readPublish(body, flags);
          const message = from === topic ? parseJson(payload) : null;
          if (message) onMessage(message);
        }
      });

      ws.onopen = () => send(encode.connect(clientId));
      ws.onmessage = (event) => feed(new Uint8Array(event.data));
      ws.onerror = () => fail("error");
      ws.onclose = () => fail("closed");
    });
  }

  /**
   * Joins a room. Tries each broker in order and resolves with
   * `{ send(message), close(), url }`. `onMessage(message)` gets every message
   * published to the room, including this client's own (filter by sender).
   * `onClose(reason)` fires if an established connection drops.
   */
  async function join({ room, brokers, onMessage, onClose = () => {}, transport = "mqtt" }) {
    const topic = `awscloudquest/duel/v1/${room}`;
    if (transport === "local") return joinLocal(topic, onMessage);
    const clientId = `acq-${Math.random().toString(36).slice(2, 12)}`;
    let lastError = null;
    for (const url of brokers) {
      try {
        return await connectBroker(url, { topic, clientId, onMessage, onClose });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("no broker");
  }

  /** Same API over BroadcastChannel (pages of one browser; used by tests). */
  function joinLocal(topic, onMessage) {
    const channel = new BroadcastChannel(topic);
    channel.onmessage = (event) => onMessage(event.data);
    return Promise.resolve({
      url: "local",
      send(message) {
        channel.postMessage(message);
        onMessage(message); // MQTT echoes our own messages; keep the same behavior
      },
      close: () => channel.close(),
    });
  }

  const api = Object.freeze({ encode, encodeLength, createParser, readPublish, join });
  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.net = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
