import compose from 'lodash/flowRight';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { shallowEqual, shallowEqualExcept, debugShouldComponentUpdate } from '../utils/componentUtils';
import { isClient } from '../executionEnvironment';
import * as _ from 'underscore';

type ComparisonFn = (prev: any, next: any)=>boolean
type ComparePropsDict = { [propName: string]: "shallow"|"ignore"|"deep"|ComparisonFn }
type AreEqualOption = ComparisonFn|ComparePropsDict|"auto"

// Options passed to registerComponent
interface ComponentOptions {
  // JSS styles for this component. These will generate class names, which will
  // be passed as an extra prop named "classes".
  styles?: any
  
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
    if (prop == "__isProxy") {
      return true;
    } else if (prop in PreparedComponents) {
      return PreparedComponents[prop];
    } else {
      return prepareComponent(prop);
    }
  }
}

// Acts like a mapping from component-name to component, based on
// registerComponents calls. Lazily loads those components when you dereference,
// using a proxy.
export const Components: ComponentTypes = new Proxy({} as any, componentsProxyHandler);

const PreparedComponents: Record<string,any> = {};

// storage for infos about components
export const ComponentsTable: Record<string, ComponentsTableEntry> = {};

const DeferredComponentsTable: Record<string,()=>void> = {};

type EmailRenderContextType = {
  isEmailRender: boolean
}

export const EmailRenderContext = React.createContext<EmailRenderContextType|null>(null);

const addClassnames = (componentName: string, styles: any) => {
  const classesProxy = new Proxy({}, {
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
  return (WrappedComponent: any) => (props: any) => {
    const emailRenderContext = React.useContext(EmailRenderContext);
    if (emailRenderContext?.isEmailRender) {
      const withStylesHoc = withStyles(styles, {name: componentName})
      const StylesWrappedComponent = withStylesHoc(WrappedComponent)
      return <StylesWrappedComponent {...props}/>
    }
    return <WrappedComponent {...props} classes={classesProxy}/>
  }
}

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
    if (isClient && (window as any).missingMainStylesheet) {
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

export function importComponent(componentName: keyof ComponentTypes|Array<keyof ComponentTypes>, importFn: ()=>void) {
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

function prepareComponent(componentName: string): any
{
  if (componentName in PreparedComponents) {
    return PreparedComponents[componentName];
  } else if (componentName in ComponentsTable) {
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
 * Populate the lookup table for components to be callable
 * ℹ️ Called once on app startup
 **/
export const populateComponentsApp = (): void => {
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
    const Component: any = Components[component];
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

// Given an optional set of override-components, return a Components object
// which wraps the main Components table, preserving Components'
// proxy/deferred-execution tricks.
export const mergeWithComponents = (myComponents: any) => {
  if (!myComponents) return Components;
  
  if (myComponents.__isProxy)
    return myComponents;
  
  const mergedComponentsProxyHandler = {
    get: function(obj: any, prop: string) {
      if (prop === "__isProxy") {
        return true;
      } else if (prop in myComponents) {
        return myComponents[prop];
      } else if (prop in PreparedComponents) {
        return PreparedComponents[prop];
      } else {
        return prepareComponent(prop);
      }
    }
  }
  
  
  return new Proxy({}, mergedComponentsProxyHandler );
}
