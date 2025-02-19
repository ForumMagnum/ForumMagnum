export function getClamper(min: number, max: number) {
  return (preferred: number) => Math.min(Math.max(min, preferred), max);
}
