// All forces and velocities in the Canvas scene use 60 Hz reference units,
// not units per displayed frame. This keeps physical time stable at 60/120/144 Hz.
export const STEP_MS = 1000 / 60;

export function motionSteps(dt, motion = 1) {
  if (!Number.isFinite(dt) || !Number.isFinite(motion)) return 0;
  return Math.max(0, Math.min(3, (dt / STEP_MS) * Math.max(0, motion)));
}

export function frameBlend(referenceBlend, dt) {
  if (!Number.isFinite(dt)) return 0;
  const blend = Math.max(0, Math.min(1, referenceBlend));
  return 1 - Math.pow(1 - blend, Math.max(0, Math.min(3, dt / STEP_MS)));
}

export function wrapPosition(position, extent, margin = 10) {
  if (!Number.isFinite(position) || !Number.isFinite(extent) || extent <= 0) return 0;
  const span = extent + margin * 2;
  return ((position + margin) % span + span) % span - margin;
}

// Soft-core Lennard-Jones inspired pair impulse: finite at coincident particles,
// continuous at all distances, with a strict upper bound on acceleration.
export function pairImpulse(dx, dy, steps = 1) {
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || !Number.isFinite(steps) || distance === 0) return [0, 0];
  const softened = Math.max(12, distance);
  const r6 = Math.pow(20 / softened, 6);
  const strength = Math.max(-0.03, Math.min(0.16, 0.005 * (2 * r6 * r6 - r6)));
  // A finite core also softens the *direction*: otherwise dx/d has a
  // discontinuity at d=0 even when the force magnitude is bounded.
  const factor = strength * Math.max(0, Math.min(3, steps)) / softened;
  return [dx * factor, dy * factor];
}

// Blend actual Cartesian directions: never interpolate the branch-cut of atan2.
export function flowDirection(baseAngle, dx, dy, radius = 200) {
  let x = Math.cos(baseAngle), y = Math.sin(baseAngle);
  const distance = Math.hypot(dx, dy);
  if (distance > 0 && distance < radius) {
    // Vanish at cursor-particle coincidence; a unit tangent has no defined
    // direction there, so a nonzero weight would still snap across the origin.
    const weight = (1 - distance / radius) * 0.7 * Math.min(1, distance / 16);
    x += (-dy / distance) * weight;
    y += (dx / distance) * weight;
  }
  const magnitude = Math.hypot(x, y);
  return magnitude > 0 && Number.isFinite(magnitude) ? [x / magnitude, y / magnitude] : [1, 0];
}
