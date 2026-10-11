// Shared by the trails and their nodes so illumination stays on the moving path.
// Mutates a reusable output vector; no objects are allocated during a frame.
export function deformLightPoint(out, x, y, z, lane, time, pointerX, pointerY, strength) {
  const taper = Math.max(0, 1 - (Math.abs(x) / 3.1) ** 4);
  const phase = x * .9 + lane * .37;
  const detail = x * 1.55 + lane * .7;
  const depth = x * .75 + lane * .4;
  const dx = x - pointerX;
  const dy = y - pointerY;
  const distanceSquared = dx * dx + dy * dy;
  const influence = Math.exp(-distanceSquared / 1.22) * strength;
  const ripple = Math.sin(Math.sqrt(distanceSquared) * 4 - time * .8 + lane * .2);
  out.x = x + taper * .028 * (Math.sin(time * .28 + y * .5) - Math.sin(y * .5)) + dx * influence * .17;
  out.y = y + taper * (.115 * (Math.sin(phase + time * .58) - Math.sin(phase)) + .035 * (Math.cos(detail - time * .35) - Math.cos(detail))) + influence * (dy * .22 + ripple * .12);
  out.z = z + taper * .04 * (Math.sin(depth + time * .36) - Math.sin(depth));
  return out;
}
