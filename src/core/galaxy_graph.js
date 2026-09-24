function hash2D(x, y, seed = 0) {
  let h = (x * 374761393) ^ (y * 668265263) ^ (seed * 1274126177) ^ 0x9E3779B9;
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hasVertEdge(x, y) {
  if (x === 0 && y === 0) return true;
  if (x === 1 && y === 0) return true;
  return hash2D(x, y, 77) < 0.5;
}

function getSystemNeighbors(x, y) {
  const neighbors = [];
  neighbors.push({ x: x + 1, y: y, dir: 'Leste' });
  neighbors.push({ x: x - 1, y: y, dir: 'Oeste' });
  if (hasVertEdge(x, y)) {
    neighbors.push({ x: x, y: y + 1, dir: 'Norte' });
  }
  if (hasVertEdge(x, y - 1)) {
    neighbors.push({ x: x, y: y - 1, dir: 'Sul' });
  }
  return neighbors;
}

function getTargetGateIndex(source, dest) {
  const destNbrs = getSystemNeighbors(dest.x, dest.y);
  const idx = destNbrs.findIndex(n => n.x === source.x && n.y === source.y);
  return idx >= 0 ? idx : 0;
}

