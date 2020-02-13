import { importAllComponents } from '../lib/vulcan-lib/components';

describe("Components", function () {
  this.timeout(20000)
  it("doesn't crash when importing every component file", () => {
    importAllComponents();
  })
});
