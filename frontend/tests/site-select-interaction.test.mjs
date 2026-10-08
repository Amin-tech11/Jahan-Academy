import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');
const React = createRequire(import.meta.url)('react');
const source = readFileSync(new URL('../components/site-select.tsx', import.meta.url), 'utf8');
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
function setup({ disabled = false, rtl = false, noEnabled = false } = {}) {
  const values = [], refs = [], effects = [], changes = [], listeners = new Map();
  let stateIndex = 0, refIndex = 0, tree, focused = 0;
  const select = {
    value: '', options: [
      { value: '', text: 'Choose', disabled: true },
      { value: 'fall', text: 'Autumn', disabled: noEnabled },
      { value: 'winter', text: 'Winter', disabled: noEnabled },
    ],
    closest: () => null,
    form: { addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener() {} },
    dispatchEvent: () => find('select').props.onChange({ target: select, currentTarget: select }),
  };
  const button = { closest: () => null, focus: () => focused++, contains: () => false, getBoundingClientRect: () => ({ left: 20, top: 400, bottom: 448, width: 250 }) };
  const menu = { contains: () => false, querySelector: () => ({ scrollIntoView() {} }) };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, Event, Date, setTimeout: cb => cb(), CSS: { escape: value => value },
    getComputedStyle: () => ({ direction: rtl ? 'rtl' : 'ltr' }),
    document: { body: {}, querySelectorAll: () => [], getElementById: () => null, addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener() {} },
    window: { innerHeight: 600, innerWidth: 384, addEventListener() {}, removeEventListener() {} },
    require(name) {
      if (name === 'react') return {
        Children: React.Children, isValidElement: React.isValidElement,
        useId: () => 'test',
        useRef: initial => { const i = refIndex++; return refs[i] ??= { current: [button, select, menu][i] ?? initial }; },
        useState: initial => { const i = stateIndex++; if (!(i in values)) values[i] = initial; return [values[i], next => { values[i] = typeof next === 'function' ? next(values[i]) : next; }]; },
        useEffect: cb => effects.push(cb),
      };
      if (name === 'react-dom') return { createPortal: node => node };
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name.endsWith('.module.css')) return { default: {} };
      throw new Error(name);
    },
  });
  function render() {
    stateIndex = refIndex = 0; effects.length = 0;
    tree = module.exports.default({ name: 'intake', required: true, defaultValue: '', disabled, 'aria-label': 'Intake', children: select.options.map(o => React.createElement('option', { value: o.value, disabled: o.disabled }, o.text)), onChange: e => changes.push(e.currentTarget.value) });
    return tree;
  }
  function find(type) { return nodes(tree).find(node => node.type === type); }
  const fallback = render(); effects[0](); render();
  return { select, changes, listeners, fallback, render, find, get focused() { return focused; },
    key(key) { find('button').props.onKeyDown({ key, preventDefault() {} }); render(); },
    click() { find('button').props.onClick(); render(); effects[1](); render(); },
  };
}

test('native control retains named required values alongside the accessible trigger', () => {
  const app = setup();
  const native = nodes(app.fallback).find(node => node.type === 'select');
  assert.equal(native.props.name, 'intake');
  assert.equal(native.props.required, true);
  assert.equal(native.props['aria-hidden'], 'true');
  assert.equal(app.find('select').props['aria-hidden'], 'true');
  assert.equal(app.find('button').props.type, 'button');
  assert.equal(app.find('button').props['aria-label'], 'Intake');
});
test('keyboard skips disabled placeholders and updates the native form value and onChange', () => {
  const app = setup();
  app.key('ArrowDown');
  assert.equal(app.find('button').props['aria-expanded'], true);
  app.key('Enter');
  assert.equal(app.select.value, 'fall');
  assert.deepEqual(app.changes, ['fall']);
  app.key('ArrowDown'); app.key('End'); app.key('Enter');
  assert.equal(app.select.value, 'winter');
  assert.equal(app.find('button').props['aria-expanded'], false);
  assert.equal(app.focused, 2);
});
test('Escape, Tab, outside clicks and reset close the menu; typeahead selects options', () => {
  const app = setup();
  app.click(); app.key('Escape');
  assert.equal(app.find('button').props['aria-expanded'], false);
  app.click(); app.key('Tab');
  assert.equal(app.find('button').props['aria-expanded'], false);
  app.click(); app.listeners.get('pointerdown')({ target: {} }); app.render();
  assert.equal(app.find('button').props['aria-expanded'], false);
  app.key('W'); app.key('Enter');
  assert.equal(app.select.value, 'winter');
  app.select.value = ''; app.listeners.get('reset')(); app.render();
  assert.equal(app.find('button').props['aria-expanded'], false);
  assert.equal(app.find('button').props.children[0].props.children, 'Choose');
});
test('required validation focuses the accessible trigger and retains RTL and disabled state', () => {
  const app = setup({ rtl: true });
  let prevented = false;
  app.find('select').props.onInvalid({ preventDefault() { prevented = true; } }); app.render();
  assert.equal(prevented, true);
  assert.equal(app.find('button').props['aria-invalid'], true);
  assert.ok(nodes(app.render()).some(n => n.props.role === 'alert' && n.props.children === 'لطفاً یک گزینه انتخاب کنید.'));
  assert.equal(app.focused, 1);
  assert.equal(setup({ disabled: true }).find('button').props.disabled, true);
});
test('English required-field errors use English even before opening the menu', () => {
  const app = setup();
  app.find('select').props.onInvalid({ preventDefault() {} });
  assert.ok(nodes(app.render()).some(n => n.props.role === 'alert' && n.props.children === 'Please select an option.'));
});
test('menus with only disabled options never select a value', () => {
  const app = setup({ noEnabled: true });
  app.key('ArrowDown'); app.key('ArrowDown'); app.key('Enter');
  assert.deepEqual(app.changes, []);
  assert.equal(app.select.value, '');
});
