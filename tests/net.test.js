"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../js/net.js");

test("remaining length: MQTT variable-length encoding", () => {
  assert.deepEqual(N.encodeLength(0), [0]);
  assert.deepEqual(N.encodeLength(127), [127]);
  assert.deepEqual(N.encodeLength(128), [0x80, 1]);
  assert.deepEqual(N.encodeLength(16383), [0xff, 0x7f]);
  assert.deepEqual(N.encodeLength(16384), [0x80, 0x80, 1]);
});

test("CONNECT: protocol MQTT level 4, clean session, client id", () => {
  const bytes = [...N.encode.connect("abc", 30)];
  assert.deepEqual(bytes, [0x10, 15, 0, 4, 77, 81, 84, 84, 4, 2, 0, 30, 0, 3, 97, 98, 99]);
});

test("SUBSCRIBE and PUBLISH round-trip through the parser", () => {
  const sub = [...N.encode.subscribe(1, "a/b")];
  assert.deepEqual(sub, [0x82, 8, 0, 1, 0, 3, 97, 47, 98, 0]);

  const got = [];
  const feed = N.createParser((p) => got.push(p));
  const message = JSON.stringify({ t: "round", text: "Olá, ção" });
  const bytes = N.encode.publish("room/1", message);
  // Deliver in two uneven chunks, as a WebSocket might.
  feed(bytes.slice(0, 5));
  assert.equal(got.length, 0);
  feed(bytes.slice(5));
  assert.equal(got.length, 1);
  assert.equal(got[0].type, 3);
  assert.deepEqual(N.readPublish(got[0].body, got[0].flags), { topic: "room/1", payload: message });
});

test("parser: several packets in one chunk, and a long payload (2-byte length)", () => {
  const got = [];
  const feed = N.createParser((p) => got.push(p));
  const long = "x".repeat(300);
  const a = N.encode.publish("t", long);
  const b = N.encode.ping();
  const both = new Uint8Array(a.length + b.length);
  both.set(a);
  both.set(b, a.length);
  feed(both);
  assert.equal(got.length, 2);
  assert.equal(N.readPublish(got[0].body).payload, long);
  assert.equal(got[1].type, 12);
});

test("deduper: the first copy of a message passes, copies from other brokers are dropped", () => {
  const fresh = N.createDeduper(3);
  assert.equal(fresh({ id: "a-1" }), true);
  assert.equal(fresh({ id: "a-1" }), false);
  assert.equal(fresh({ t: "ping" }), true, "messages without an id always pass");
  for (const id of ["a-2", "a-3", "a-4"]) fresh({ id });
  assert.equal(fresh({ id: "a-1" }), true, "old ids are forgotten after `max` newer ones");
});
