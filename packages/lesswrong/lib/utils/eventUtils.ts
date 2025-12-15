
export function isSpecialClick(ev: React.MouseEvent<HTMLAnchorElement>) {
  return ev.metaKey || ev.altKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0;
}
