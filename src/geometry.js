// Helpers puros de geometría. Sin estado: reciben colecciones por argumento.

// Distancia de un punto al borde más cercano del rect de la estación.
export function distToStation(p, s) {
  const dx = Math.max(s.x - s.w/2 - p.x, 0, p.x - (s.x + s.w/2));
  const dy = Math.max(s.y - s.h/2 - p.y, 0, p.y - (s.y + s.h/2));
  return Math.sqrt(dx*dx + dy*dy);
}

export function nearestStation(p, stations, maxDist = 24) {
  let best = null, bestD = Infinity;
  for (const s of stations) {
    const d = distToStation(p, s);
    if (d < bestD && d <= maxDist) { best = s; bestD = d; }
  }
  return best;
}

export function playerNearStation(player, s) {
  return distToStation(player, s) <= 28;
}

export function anyPlayerNearStation(s, players) {
  return players.some(p => playerNearStation(p, s));
}
