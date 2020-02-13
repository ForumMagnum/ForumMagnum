import { importAllComponents } from '../lib/vulcan-lib/components';

describe("Components", () => {
  it("doesn't crash when importing every component file", () => {
    importAllComponents();
  })
}
