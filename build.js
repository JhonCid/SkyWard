#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;

function assemble() {
  const read = name => fs.readFileSync(path.join(root, 'src', name), 'utf8');
  const manifest = JSON.parse(read('manifest.json'));
  if (!Array.isArray(manifest) || !manifest.length || new Set(manifest).size !== manifest.length)
    throw Error('Manifest must contain unique source paths.');
  const chunks = manifest.map(name => {
    if (typeof name !== 'string' || !/^[a-z0-9_/]+\.js$/.test(name) || name.includes('..'))
      throw Error('Invalid source path: ' + name);
    return read(name);
  });
  // Preserve the original shared script scope, declaration hoisting and startup order.
  const code = chunks.join('');
  new vm.Script(code, {filename:'SkyWard-game.js'});
  const match = code.match(/const VERSION='(\d+\.\d+\.\d+)'/);
  if (!match) throw Error('Missing game VERSION.');
  const html = read('shell/head.html') + '<script>' + read('shell/three.min.js') +
    '</script>\n<script>' + code + '</script>' + read('shell/tail.html');
  return {html, version:match[1], manifest};
}
function build() {
  const {html,version} = assemble();
  for (const name of ['SkyWard.html', `SkyWard-v${version}.html`])
    fs.writeFileSync(path.join(root,name),html,'utf8');
  console.log(`SkyWard v${version}: ${Buffer.byteLength(html)} bytes. Both HTML files generated.`);
}
if (require.main === module) build();
module.exports = {assemble,build};
