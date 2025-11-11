export function getLinkedom() {
  const { parseHTML }: typeof import("linkedom") = require('linkedom');
  return parseHTML;
}
