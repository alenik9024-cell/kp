'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(require('node:path').join(__dirname, '../kp-widget.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes("BUTTON_EVENT"));
assert.ok(script, 'widget integration script is present');

const listeners = {};
let blocks;
let opened;
let pendingGetDeal = new Promise(() => {});
const sdk = {
  init(value) { blocks = value; },
  getDeal() { return pendingGetDeal; },
  openPage(value) { opened = { method: 'page', value }; return Promise.resolve(); },
  openModal(value) { opened = { method: 'modal', value }; return Promise.resolve(); }
};
const window = {
  EnvyCrmWidget: sdk,
  addEventListener(type, fn) { listeners[type] = fn; },
  open() { throw new Error('unexpected popup fallback'); }
};
const context = {
  window,
  document: {},
  URLSearchParams,
  encodeURIComponent,
  console,
  setTimeout() {}
};
vm.runInNewContext(script, context);
assert.equal(typeof blocks['deal-btn'], 'function');

// The real SDK invokes this callback with event.data.data.params. A deal ID
// there must be retained without guessing the getDeal response schema.
blocks['deal-btn']({ deal: { id: 731 } });
listeners.message({ data: { type: 'kp-btn:click' } });
assert.ok(opened, 'click opens a page immediately');
assert.match(opened.value.content, /deal_id=731/);
assert.equal(opened.method, 'page');

// A click must still open when SDK getDeal never resolves.
opened = undefined;
listeners.message({ data: { type: 'kp-btn:click', deal_id: 914 } });
assert.ok(opened, 'click does not wait for getDeal');
assert.match(opened.value.content, /deal_id=914/);
console.log('PASS: SDK callback context and pending getDeal click regression');
