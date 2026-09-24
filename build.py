#!/usr/bin/env python3
"""Standalone build using only Python's standard library. Same bytes as build.js."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def assemble():
    def read(name):
        return (ROOT / 'src' / name).read_bytes().decode('utf-8')
    manifest = json.loads(read('manifest.json'))
    if not isinstance(manifest, list) or not manifest:
        raise ValueError('Manifest must contain source paths.')
    if any(not isinstance(name, str) or not re.fullmatch(r'[a-z0-9_/]+\.js', name) or '..' in name for name in manifest):
        raise ValueError('Invalid source path.')
    if len(set(manifest)) != len(manifest):
        raise ValueError('Duplicate source path.')
    code = ''.join(read(name) for name in manifest)
    match = re.search(r"const VERSION='(\d+\.\d+\.\d+)'", code)
    if not match:
        raise ValueError('Missing game VERSION.')
    html = read('shell/head.html') + '<script>' + read('shell/three.min.js') + '</script>\n<script>' + code + '</script>' + read('shell/tail.html')
    return html.encode('utf-8'), match.group(1)

def build():
    html, version = assemble()
    for name in ('SkyWard.html', f'SkyWard-v{version}.html'):
        (ROOT / name).write_bytes(html)
    print(f'SkyWard v{version}: {len(html)} bytes. Both HTML files generated.')

if __name__ == '__main__':
    build()
