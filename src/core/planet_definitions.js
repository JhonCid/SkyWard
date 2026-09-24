function getPlanetDefs(sx, sy) {
  if (sx === 0 && sy === 0) return defs.slice(0, 3);
  if (sx === 1 && sy === 0) return defs.slice(3, 6);
  const count = 3;
  const list = [];
  for (let i = 0; i < count; i++) {
    const nameIdx = Math.floor(hash2D(sx, sy, 310 + i * 17) * planetNameList.length);
    const bIdx = Math.floor(hash2D(sx, sy, 520 + i * 19) * biomePool.length);
    const b = biomePool[bIdx];
    const r = 620 + Math.floor(hash2D(sx, sy, 730 + i * 23) * 160);
    list.push([planetNameList[nameIdx], b.b1, b.b2, b.c1, b.c2, b.acc, b.fauna, r, b.theme, b.wet]);
  }
  return list;
}

