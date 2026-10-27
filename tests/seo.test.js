"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://iwiper.github.io/awscloudquest/";
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const meta = (attr, name) => {
  const match = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`));
  return match && match[1];
};

/** Local file for a site URL or a relative path. */
const local = (urlOrPath) => path.join(ROOT, urlOrPath.replace(SITE, ""));

test("index.html: title, description and canonical URL", () => {
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  const description = meta("name", "description");
  assert.ok(title.length >= 30 && title.length <= 70, `title has ${title.length} chars`);
  assert.ok(description.length >= 110 && description.length <= 160, `description has ${description.length} chars`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE}">`));
  assert.equal(meta("property", "og:url"), SITE);
});

test("index.html: JSON-LD is valid schema.org data pointing to the site", () => {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  const data = JSON.parse(block);
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data.url, SITE);
  assert.ok(fs.existsSync(local(data.image)), "structured data image exists");
});

test("link preview image and icons referenced by the page exist", () => {
  assert.ok(fs.existsSync(local(meta("property", "og:image"))), "og:image exists");
  assert.ok(fs.existsSync(local(meta("name", "twitter:image"))), "twitter:image exists");
  for (const [, href] of html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g)) {
    assert.ok(fs.existsSync(local(href)), `${href} exists`);
  }
});

test("manifest.webmanifest: valid JSON and every icon exists", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.lang, "pt-BR");
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
  for (const icon of manifest.icons) assert.ok(fs.existsSync(local(icon.src)), `${icon.src} exists`);
});

test("sitemap.xml lists the canonical URL", () => {
  const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  assert.match(sitemap, new RegExp(`<loc>${SITE}</loc>`));
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});

test("IndexNow key file: name matches its content", () => {
  const keys = fs.readdirSync(ROOT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  assert.equal(keys.length, 1, "exactly one IndexNow key file at the root");
  assert.equal(fs.readFileSync(path.join(ROOT, keys[0]), "utf8").trim(), keys[0].replace(".txt", ""));
});

test("duelo.html: invitation links get a duel preview and lead into the room", () => {
  const invite = fs.readFileSync(path.join(ROOT, "duelo.html"), "utf8");
  const tag = (attr, name) => (invite.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)) || [])[1];
  assert.equal(tag("property", "og:image"), `${SITE}assets/og-duel.png`);
  assert.ok(fs.existsSync(local(tag("property", "og:image"))), "the duel preview image exists");
  assert.match(tag("property", "og:title"), /duelo/i);
  assert.equal(tag("name", "robots"), "noindex");
  assert.match(invite, /var target = "index\.html" \+ .*#duelo=/);
  assert.match(invite, /location\.replace\(target\)/);
  const deploy = fs.readFileSync(path.join(ROOT, ".github/workflows/pages.yml"), "utf8");
  assert.match(deploy, /cp -r index\.html duelo\.html/, "the deploy publishes duelo.html");
});
