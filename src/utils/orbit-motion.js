// Integrate angular motion using elapsed time, not absolute time multiplied by
// a changing speed. The latter teleports the phase whenever input energy changes.
const TAU = 2 * Math.PI;

export function elapsedMotionTime(now, previous) {
  if (!Number.isFinite(now) || !Number.isFinite(previous)) return 0;
  // A hidden tab or temporarily disabled effect must resume smoothly.
  return Math.max(0, Math.min(50, now - previous));
}

export function advanceAngle(angle, elapsedMs, radiansPerMs, speed = 1) {
  const increment = elapsedMs * radiansPerMs * Math.max(0, speed);
  return (angle + increment) % TAU;
}

export function followTarget(value, target, elapsedMs, halfLifeMs = 150) {
  if (elapsedMs <= 0) return value;
  const blend = 1 - Math.exp(-Math.LN2 * elapsedMs / halfLifeMs);
  return value + (target - value) * blend;
}
