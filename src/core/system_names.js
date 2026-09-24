function getSystemName(x, y) {
  if (x === 0 && y === 0) return 'ÉOS';
  if (x === 1 && y === 0) return 'NYX';
  const r1 = Math.floor(hash2D(x, y, 101) * sysRoots.length);
  const m1 = Math.floor(hash2D(x, y, 102) * sysMods.length);
  return sysRoots[r1] + sysMods[m1];
}

