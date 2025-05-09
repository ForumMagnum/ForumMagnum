/**
 * As part of our static CSS generation, we need to get the styles for all of
 * the MaterialUI components that we use.
 *
 * When adding a new component below, be sure to prepend it's name with 'Mui',
 * and import the _file_ where the component is defined, not just the directory
 * (ie; "@/lib/vendor/@material-ui/core/src/Badge/Badge" instead of "@/lib/vendor/@material-ui/core/src/Badge").
 *
 * Some components also have a 'Base' variant that must be included here too
 * even if they're only used indirectly (eg; InputBase, ButtonBase). Failing to
 * do this will result in the wrong theme being used during SSR - it will be
 * fixed during JS hydration, but you'll get an ugly flash of the wrong theme.
 *
 * TODO: There's probably some way to do this automatically?
 */
const getUsedMuiStyles = () => {
  const components = {
  };

  // Filter out components that don't have any styles
  return Object.fromEntries(Object.entries(components).filter(([_, styles]) => !!styles));
}

export const usedMuiStyles = getUsedMuiStyles();
