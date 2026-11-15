export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** 0 at e0, 1 at e1 (e0 may be larger than e1) */
export function smooth(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}
