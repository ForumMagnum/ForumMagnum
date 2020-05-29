// Legacy LW breakpoints
// We are migrating away from these, towards material-UI's breakpoints. Also
// defined as a set of SCSS mixin in _breakpoints.scss.
const lwTiny = "400px";
const lwSmall = "715px";

export const legacyBreakpoints = {
  maxTiny: "@media screen and (max-width: "+lwTiny+")",
  maxSmall: "@media screen and (max-width: "+lwSmall+")",
  minSmall: "@media screen and (min-width: "+lwSmall+")",
};
