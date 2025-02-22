
export type ABTestGroup = {
  description: string,
  weight: number,
}


// The generic permits type-safe checks for group assignment with `useABTest`
export class ABTest<T extends string = string> {
  name: string;
  active: boolean;
  affectsLoggedOut: boolean;
  description: string;
  groups: Record<T, ABTestGroup>;
  
  constructor({name, active, affectsLoggedOut, description, groups}: {
    name: string,
    active: boolean,
    affectsLoggedOut: boolean,
    description: string,
    groups: Record<T, ABTestGroup>
  }) {
    const totalWeight = _.reduce(
      Object.keys(groups),
      (sum: number, key: T) => sum+groups[key].weight,
      0
    );
    if (totalWeight === 0) {
      throw new Error("A/B test has no groups defined with nonzero weight");
    }
    
    this.name = name;
    this.active = active;
    this.affectsLoggedOut = affectsLoggedOut;
    this.description = description;
    this.groups = groups;
  }
  
  // JSS selector for if the current user is in the named A/B test group. Nest
  // this inside the JSS for a className, similar to how you would make JSS for
  // a breakpoint. For example:
  styleIfInGroup(groupName: string) {
    return `.${this.name}_${groupName} &&`;
  }
}

