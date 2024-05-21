import { importAllComponents, styleDefinitions } from '../lib/vulcan-lib/components';

describe('defineStyles', () => {
  it('has distinct names for every JSS stylesheet', () => {
    importAllComponents();
    const stylesheetNamesUsed = new Set<string>();
    for (const styleDefinition of styleDefinitions) {
      if (stylesheetNamesUsed.has(styleDefinition.name)) {
        throw new Error(`Duplicate stylesheet name ${styleDefinition.name}`);
      }
      stylesheetNamesUsed.add(styleDefinition.name);
    }
  });
});
