import assert from 'node:assert/strict';
import test from 'node:test';
import { loadImage } from '../src/lib/imageLoading.ts';

class TestImage extends EventTarget {
  complete = false;
  naturalWidth = 0;
  attributes = new Map();
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  set src(value) { this.attributes.set('src', value); this.complete = false; }
  set srcset(value) { this.attributes.set('srcset', value); }
  // The gallery must not depend on a second, potentially never-settling decode.
  decode() { throw new Error('decode should not be needed after load'); }
  loaded() { this.complete = true; this.naturalWidth = 800; this.dispatchEvent(new Event('load')); }
}

test('a loaded HTML image is reused without resetting its request', async () => {
  const image = new TestImage();
  image.attributes.set('src', '/painting.webp');
  image.attributes.set('srcset', '');
  image.complete = true;
  image.naturalWidth = 800;
  assert.equal(await loadImage(image, '/painting.webp'), true);
});

test('load displays the image without waiting for decode again', async () => {
  const image = new TestImage();
  const result = loadImage(image, '/painting.webp', '/small.webp 480w', 100);
  image.loaded();
  assert.equal(await result, true);
});

test('request errors settle, allowing the gallery to retain or skip a painting', async () => {
  const image = new TestImage();
  const result = loadImage(image, '/painting.webp', '', 100);
  image.dispatchEvent(new Event('error'));
  assert.equal(await result, false);
});

test('a stalled request cannot keep the gallery awaiting forever', async () => {
  const image = new TestImage();
  assert.equal(await loadImage(image, '/painting.webp', '', 5), false);
  image.loaded();
});

test('an already failed cached image settles immediately', async () => {
  const image = new TestImage();
  image.attributes.set('src', '/painting.webp');
  image.complete = true;
  assert.equal(await loadImage(image, '/painting.webp'), false);
});
