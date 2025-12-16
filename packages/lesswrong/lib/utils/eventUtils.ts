
export function isSpecialClick<T>(ev: React.MouseEvent<T>|MouseEvent) {
  return ev.metaKey || ev.altKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0;
}
