// If true, `importComponent` imports immediately (rather than deferring until
// first use) and checks that the file registered the components named, with a
// lot of log-spam.
const debugComponentImports = false;

export function importAllComponents() {
  require('@/lib/generated/allComponents');
}

/**
 * Called once on app startup
 *
 * See debugComponentImports for intended use
 */
export const populateComponentsAppDebug = (): void => {
  if (debugComponentImports) {
    importAllComponents();
  }
};
