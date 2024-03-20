import compose from 'lodash/flowRight';
import React, { forwardRef } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { shallowEqual, shallowEqualExcept, debugShouldComponentUpdate } from '../utils/componentUtils';
import { isClient } from '../executionEnvironment';
import * as _ from 'underscore';
import cloneDeep from 'lodash/cloneDeep';

type ComparisonFn = (prev: any, next: any) => boolean
type ComparePropsDict = { [propName: string]: "default"|"shallow"|"ignore"|"deep"|ComparisonFn }
type AreEqualOption = ComparisonFn|ComparePropsDict|"auto"

// Options passed to registerComponent
interface ComponentOptions {
  // JSS styles for this component. These will generate class names, which will
  // be passed as an extra prop named "classes".
  styles?: any
  
  // Whether to ignore the presence of colors that don't come from the theme in
  // the component's stylesheet. Use for things that don't change color with
  // dark mode.
  allowNonThemeColors?: boolean,
  
  // Default is 0. If classes with overlapping attributes from two different
  // components' styles wind up applied to the same node, the one with higher
  // priority wins.
  stylePriority?: number,
  
  // Array of higher-order components that this component should be wrapped
  // with.
  hocs?: Array<any>
  
  // Determines what changes to props are considered relevant, for rerendering.
  // Takes either "auto" (meaning a shallow comparison of all props), a function
  // that takes before-and-after props, or an object where keys are names of
  // props, values are how those props are handled, and props that are not
  // mentioned are equality-compared. The options for handling a prop are a
  // function or one of:
  //   * ignore: Don't rerender this component on changes to this prop
  //   * shallow: Shallow-compare this prop (this is one level deeper than the
  //     shallow comparison of all props)
  //   * deep: Perform a deep comparison of before and after values of this
  //     prop. (Don't use on prop types that are or contain React components)
  areEqual?: AreEqualOption
  
  // If set, output console log messages reporting when this component is
  // rerendered, and which props changed to trigger it.
  debugRerenders?: boolean,
}

interface ComponentsTableEntry {
  name: string
  rawComponent: any
  hocs: Array<any>
  options?: ComponentOptions,
}

const componentsProxyHandler = {
  get: function(obj: {}, prop: string) {
    if (prop === "__isProxy") {
      return true;
    } else if (prop in PreparedComponents) {
      return PreparedComponents[prop];
    } else {
      return prepareComponent(prop);
    }
  }
}

/**
 * Acts like a mapping from component-name to component, based on
 * registerComponents calls. Lazily loads those components when you dereference,
 * using a proxy.
 */
export const Components: ComponentTypes = new Proxy({} as any, componentsProxyHandler);

const PreparedComponents: Record<string,any> = {};

// storage for infos about components
export const ComponentsTable: Record<string, ComponentsTableEntry> = {};

export const DeferredComponentsTable: Record<string,() => void> = {};

type EmailRenderContextType = {
  isEmailRender: boolean
}

interface QueryInfo {
  type: 'query';
  name: string;
}

interface MutationInfo {
  type: 'mutation';
  name: string;
}

type ComponentContextNode = {
  name: string;
  queriesAndMutations: (QueryInfo | MutationInfo)[]
};

interface TreeNode {
  name: string;
  children: { [key: string]: TreeNode };
  queriesAndMutations: (QueryInfo | MutationInfo)[];
}

export type TreeContextType = {
  ancestors: ComponentContextNode[];
};

// export function extractAndSortBranches(root: TreeNode): string[] {
//   const branches: { path: string; weight: number }[] = [];

//   function traverse(node: TreeNode, path: string[], weight: number) {
//     // Increment weight if the node has queries or mutations
//     const currentWeight = node.queriesAndMutations.length > 0 ? weight + 1 : weight;

//     // If the node is a leaf or has queries/mutations, consider it an endpoint for a branch
//     if (Object.keys(node.children).length === 0 || node.queriesAndMutations.length > 0) {
//       branches.push({ path: path.join(' -> '), weight: currentWeight });
//     }

//     // Traverse children
//     Object.values(node.children).forEach((child) => {
//       traverse(child, [...path, child.name + (child.queriesAndMutations.length > 0 ? ` (${child.queriesAndMutations.length} Q/M)` : '')], currentWeight);
//     });
//   }

//   // Start traversal from root
//   traverse(root, [root.name], 0);

//   // Sort branches by weight in descending order
//   branches.sort((a, b) => b.weight - a.weight);

//   // Return sorted branches as strings for visualization
//   return branches.map((branch) => `${branch.path} - Weight: ${branch.weight}`);
// }

function constructShortPath(path: string[]) {
  const stringBuilder: string[] = [];
  path.forEach((pathPart, idx) => {
    stringBuilder.push(pathPart);
    const next = path[idx + 1];
    if (next) {
      if (pathPart.endsWith(')') || next.endsWith(')')) {
        stringBuilder.push(' -> ');
      } else {
        stringBuilder.push('/');
      }
    }
  });

  return stringBuilder.join('');
}

export function extractAndSortBranchesWithTruncation(root: TreeNode): string[] {
  // const branches = new Map<string, number>();

  // function traverse(node: TreeNode, path: string[], weight: number) {
  //   const newPath = [...path];
  //   if (node.queriesAndMutations.length > 0) {
  //     // Update the path to include this node as the new potential truncation point
  //     newPath.push(node.name + ` (${node.queriesAndMutations.length} Q/M)`);
  //   }

  //   // If the node is a leaf, update the branches map
  //   if (Object.keys(node.children).length === 0) {
  //     const pathStr = newPath.join(' -> ');
  //     // Store or update the weight in the map
  //     if (!branches.has(pathStr) || branches.get(pathStr)! < weight) {
  //       branches.set(pathStr, weight);
  //     }
  //   } else {
  //     // Only increment weight if this node has queries or mutations
  //     const currentWeight = node.queriesAndMutations.length > 0 ? weight + 1 : weight;

  //     // Traverse children
  //     Object.values(node.children).forEach((child) => {
  //       traverse(child, newPath, currentWeight);
  //     });
  //   }
  // }

  // // Start traversal from root
  // traverse(root, [], 0);

  // // Convert the map to an array of strings for visualization, sorted by weight
  // const sortedBranches = Array.from(branches)
  //   .sort((a, b) => b[1] - a[1]) // Sort by weight in descending order
  //   .map(([path, weight]) => `${path} - Weight: ${weight}`);

  // return sortedBranches;

  const branches = new Map<string, number>();

  function traverse(node: TreeNode, path: string[], lastQMIndex: number, weight: number) {
    // Extend the path with the current node, indicating queries/mutations if present
    const newPath = [...path, node.name + (node.queriesAndMutations.length > 0 ? ` (${node.queriesAndMutations.length})` : '')];
    // Update the last index where a Q/M was found
    const newLastQMIndex = node.queriesAndMutations.length > 0 ? newPath.length - 1 : lastQMIndex;
    // Update weight if this node has queries or mutations
    const newWeight = node.queriesAndMutations.length > 0 ? weight + 1 : weight;

    if (Object.keys(node.children).length === 0) {
      // If this is a leaf node, finalize the branch up to the last Q/M node
      // const truncatedPath = newPath.slice(0, newLastQMIndex + 1).join(' -> ');
      const truncatedPath = constructShortPath(newPath.slice(0, newLastQMIndex + 1));
      branches.set(truncatedPath, newWeight);
    } else {
      // Continue traversal for non-leaf nodes
      Object.values(node.children).forEach((child) => {
        traverse(child, newPath, newLastQMIndex, newWeight);
      });
    }
  }

  // Start traversal from the root, with an initial weight of 0 and no Q/M nodes found yet
  traverse(root, [], -1, 0);

  // Convert the map to an array of strings for visualization, sorted by weight
  const sortedBranches = Array.from(branches)
    .sort((a, b) => b[1] - a[1]) // Sort by total weight in descending order
    .map(([path, weight]) => `${path} - Total Q/M: ${weight}`);

  return sortedBranches;
}

export function constructComponentTreeDistinct(paths: TreeContextType[]): TreeNode {
  const root: TreeNode = { name: generateNodeIdentifier(paths[0].ancestors[0]), children: {}, queriesAndMutations: paths[0].ancestors[0].queriesAndMutations };

  paths.forEach((path) => {
    path.ancestors.shift();
    let currentNode = root;

    path.ancestors.forEach((ancestor, index) => {
      // Generate a unique identifier for the ancestor
      const identifier = generateNodeIdentifier(ancestor);

      // Check if a child with the unique identifier already exists
      if (!currentNode.children[identifier]) {
        currentNode.children[identifier] = {
          name: ancestor.name,
          children: {},
          queriesAndMutations: [...ancestor.queriesAndMutations],
        };
      }

      // Even if the node already exists, we don't merge queries/mutations because we want to treat each instance as distinct
      currentNode = currentNode.children[identifier];
    });
  });

  return root;
}

function generateNodeIdentifier(node: ComponentContextNode): string {
  // Create a string that uniquely identifies a node by its name and the details of its queries and mutations
  const queriesAndMutationsString = node.queriesAndMutations
    .map((qm) => `${qm.type}:${qm.name}`)
    .sort()
    .join('|');
  return `${node.name}-${queriesAndMutationsString}`;
}

export const EmailRenderContext = React.createContext<EmailRenderContextType|null>(null);
export const TreeContext = React.createContext<TreeContextType|null>(null);

const classNameProxy = (componentName: string) => {
  return new Proxy({}, {
    get: function(obj: any, prop: any) {
      // Check that the prop is really a string. This isn't an error that comes
      // up normally, but apparently React devtools will try to query for non-
      // string properties sometimes when using the component debugger.
      if (typeof prop === "string")
        return `${componentName}-${prop}`;
      else
        return `${componentName}-invalid`;
    }
  });
}

const addClassnames = (componentName: string, styles: any) => {
  const classesProxy = classNameProxy(componentName);
  return (WrappedComponent: any) => forwardRef((props, ref) => {
    const emailRenderContext = React.useContext(EmailRenderContext);
    if (emailRenderContext?.isEmailRender) {
      const withStylesHoc = withStyles(styles, {name: componentName})
      const StylesWrappedComponent = withStylesHoc(WrappedComponent)
      return <StylesWrappedComponent {...props}/>
    }
    return <WrappedComponent ref={ref} {...props} classes={classesProxy}/>
  })
}

export const useStyles = (styles: (theme: ThemeType) => JssStyles, componentName: keyof ComponentTypes) => {
  return classNameProxy(componentName);
};

// Register a component. Takes a name, a raw component, and ComponentOptions
// (see above). Components should be in their own file, imported with
// `importComponent`, and registered in that file; components that are
// registered this way can be accessed via the Components object and are lazy-
// loaded.
//
// Returns a dummy value--null, but coerced to a type that you can add to the
// ComponentTypes interface to type-check usages of the component in other
// files.
export function registerComponent<PropType>(name: string, rawComponent: React.ComponentType<PropType>,
  options?: ComponentOptions): React.ComponentType<Omit<PropType,"classes">>
{
  const { styles=null, hocs=[] } = options || {};
  if (styles) {
    if (isClient && window?.missingMainStylesheet) {
      hocs.push(withStyles(styles, {name: name}));
    } else {
      hocs.push(addClassnames(name, styles));
    }
  }
  
  rawComponent.displayName = name;
  
  if (name in ComponentsTable && ComponentsTable[name].rawComponent !== rawComponent) {
    throw new Error(`Two components with the same name: ${name}`);
  }
  
  // store the component in the table
  ComponentsTable[name] = {
    name,
    rawComponent,
    hocs,
    options,
  };
  
  // The Omit is a hacky way of ensuring that hocs props are omitted from the
  // ones required to be passed in by parent components. It doesn't work for
  // hocs that share prop names that overlap with actually passed-in props, like
  // `location`.
  return (null as any as React.ComponentType<Omit<PropType,"classes">>);
}

// If true, `importComponent` imports immediately (rather than deferring until
// first use) and checks that the file registered the components named, with a
// lot of log-spam.
const debugComponentImports = false;

export function importComponent(componentName: keyof ComponentTypes|Array<keyof ComponentTypes>, importFn: () => void) {
  if (Array.isArray(componentName)) {
    for (let name of componentName) {
      DeferredComponentsTable[name] = importFn;
    }
  } else {
    DeferredComponentsTable[componentName] = importFn;
  }
}

export function importAllComponents() {
  for (let componentName of Object.keys(DeferredComponentsTable)) {
    prepareComponent(componentName);
  }
}

export function hocAllComponents(onChildRender: (treeContext: TreeContextType) => void) {
  for (let componentName of Object.keys(ComponentsTable)) {
    const hoc = createTreeContextHoC(componentName);
    if (ComponentsTable[componentName].hocs[0]?.name !== 'treeContextHoc') {
      ComponentsTable[componentName].hocs.push(hoc);
    }
  }

  function createTreeContextHoC(componentName: string) {
    return function treeContextHoc(WrappedComponent: any) {
      return forwardRef((props, ref) => {
        const componentNode: ComponentContextNode = {
          name: componentName,
          queriesAndMutations: []
        };

        const previousContext = React.useContext(TreeContext);
        const nextContext = cloneDeep(previousContext ?? { ancestors: [] });
        nextContext.ancestors.push(componentNode);

        onChildRender(nextContext);

        return <TreeContext.Provider value={nextContext}>
          <WrappedComponent ref={ref} {...props} />
        </TreeContext.Provider>;
      });
    }
  }
}

function prepareComponent(componentName: string): any
{
  // if (componentName in PreparedComponents) {
  //   return PreparedComponents[componentName];
  // } else
  if (componentName in ComponentsTable) {
    PreparedComponents[componentName] = getComponent(componentName);
    return PreparedComponents[componentName];
  } else if (componentName in DeferredComponentsTable) {
    DeferredComponentsTable[componentName]();
    if (!(componentName in ComponentsTable)) {
      throw new Error(`Import did not provide component ${componentName}`);
    }
    return prepareComponent(componentName);
  } else {
    // eslint-disable-next-line no-console
    console.error(`Missing component: ${componentName}`);
    return null;
  }
}

// Get a component registered with registerComponent, applying HoCs and other
// wrappings.
const getComponent = (name: string): any => {
  const componentMeta = ComponentsTable[name];
  if (!componentMeta) {
    throw new Error(`Component ${name} not registered.`);
  }
  
  const componentWithMemo = componentMeta.options?.areEqual
    ? memoizeComponent(componentMeta.options.areEqual, componentMeta.rawComponent, name, !!componentMeta.options.debugRerenders)
    : componentMeta.rawComponent;
  
  if (componentMeta.hocs && componentMeta.hocs.length) {
    const hocs = componentMeta.hocs.map(hoc => {
      if (!Array.isArray(hoc)) {
        if (typeof hoc !== 'function') {
          throw new Error(`In registered component ${name}, an hoc is of type ${typeof hoc}`);
        }
        return hoc;
      }
      const [actualHoc, ...args] = hoc;
      if (typeof actualHoc !== 'function') {
        throw new Error(`In registered component ${name}, an hoc is of type ${typeof actualHoc}`);
      }
      return actualHoc(...args);
    });
    // @ts-ignore
    return compose(...hocs)(componentWithMemo);
  } else {
    return componentWithMemo;
  }
};

const memoizeComponent = (areEqual: AreEqualOption, component: any, name: string, debugRerenders: boolean): any => {
  if (areEqual === "auto") {
    if (debugRerenders) {
      return React.memo(component, (oldProps, newProps) => {
        // eslint-disable-next-line no-console
        return debugShouldComponentUpdate(name, console.log, oldProps, {}, newProps, {});
      });
    } else {
      return React.memo(component);
    }
  } else if (typeof areEqual==='function') {
    return React.memo(component, areEqual);
  } else {
    return React.memo(component, (oldProps, newProps) => {
      const speciallyHandledKeys = Object.keys(areEqual);
      if (!shallowEqualExcept(oldProps, newProps, speciallyHandledKeys)) {
        if (debugRerenders) {
          // eslint-disable-next-line no-console
          debugShouldComponentUpdate(name, console.log, oldProps, {}, newProps, {});
        }
        return false;
      }
      for (let key of speciallyHandledKeys) {
        if (typeof areEqual[key]==="function") {
          if (!(areEqual[key] as ComparisonFn)(oldProps[key], newProps[key])) {
            if (debugRerenders) {
              // eslint-disable-next-line no-console
              console.log(`Updating ${name} because props.${key} changed`);
            }
            return false;
          }
        } else switch(areEqual[key]) {
          case "ignore":
            break;
          case "default":
            if (oldProps[key] !== newProps[key]) {
              if (debugRerenders) {
                // eslint-disable-next-line no-console
                console.log(`Updating ${name} because props.${key} changed`);
              }
              return false;
            }
            break;
          case "shallow":
            if (!shallowEqual(oldProps[key], newProps[key])) {
              if (debugRerenders) {
                // eslint-disable-next-line no-console
                console.log(`Updating ${name} because props.${key} changed`);
              }
              return false;
            }
            break;
          case "deep":
            if (!_.isEqual(oldProps[key], newProps[key])) {
              if (debugRerenders) {
                // eslint-disable-next-line no-console
                console.log(`Updating ${name} because props.${key} changed`);
              }
              return false;
            }
            break;
        }
      }
      return true;
    });
  }
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

// Returns an instance of the given component name of function
//
// @param {string|function} component  A component or registered component name
// @param {Object} [props]  Optional properties to pass to the component
export const instantiateComponent = (component: any, props: any) => {
  if (!component) {
    return null;
  } else if (typeof component === 'string') {
    const Component: any = Components[component as keyof ComponentTypes];
    return <Component {...props} />;
  } else if (
    typeof component === 'function' &&
    component.prototype &&
    component.prototype.isReactComponent
  ) {
    const Component = component;
    return <Component {...props} />;
  } else if (typeof component === 'function') {
    return component(props);
  } else {
    return component;
  }
};

/**
 * Given an optional set of override-components, return a Components object
 * which wraps the main Components table, preserving Components'
 * proxy/deferred-execution tricks.
 */
export const mergeWithComponents = (myComponents: Partial<ComponentTypes>|null|undefined): ComponentTypes => {
  if (!myComponents) return Components;
  
  if ((myComponents as any).__isProxy)
    return (myComponents as any);
  
  const mergedComponentsProxyHandler = {
    get: function(obj: any, prop: string) {
      if (prop === "__isProxy") {
        return true;
      } else if (prop in myComponents) {
        return (myComponents as any)[prop];
      } else if (prop in PreparedComponents) {
        return PreparedComponents[prop];
      } else {
        return prepareComponent(prop);
      }
    }
  }
  
  
  return new Proxy({}, mergedComponentsProxyHandler );
}
