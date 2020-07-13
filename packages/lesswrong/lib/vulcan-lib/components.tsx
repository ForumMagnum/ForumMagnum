import compose from 'lodash/flowRight';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const componentsProxyHandler = {
  get: function(obj, prop) {
    if (prop in PreparedComponents) {
      return PreparedComponents[prop];
    } else {
      return prepareComponent(prop);
    }
  }
}

// will be populated on startup (see vulcan:routing)
export const Components: ComponentTypes = new Proxy({}, componentsProxyHandler);

const PreparedComponents = {};

// storage for infos about components
export const ComponentsTable: Record<string, any> = {};

const DeferredComponentsTable = {};

const coreComponents = [
  'Alert',
  'Button',
  'Modal',
  'ModalTrigger',
  'FormComponentCheckbox',
  'FormComponentCheckboxGroup',
  'FormComponentDate',
  'FormComponentDateTime',
  'FormComponentDefault',
  'FormComponentEmail',
  'FormComponentNumber',
  'FormComponentSelect',
  'FormComponentTextarea',
  'FormComponentUrl',
  'FormComponentInner',
  'FormControl',
  'FormElement',
  'FormItem',
];

type C<T=any> = React.ComponentType<T>
type HoC<O,T> = (component: C<O>) => C<T>

const addClassnames = (componentName: string) => {
  const classesProxy = new Proxy({}, {
    get: function(obj: any, prop: any) {
      return `${componentName}-${prop}`;
    }
  });
  return (WrappedComponent) => (props) => {
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
export function registerComponent<PropType>(name: keyof ComponentTypes, rawComponent: React.ComponentType<PropType>,
  options?: {styles?: any, hocs?: Array<any>}): React.ComponentType<Omit<PropType,"classes">>
{
  const { styles=null, hocs=[] } = options || {};
  if (styles) {
    if (Meteor.isClient && (window as any).missingMainStylesheet) {
      hocs.push(withStyles(styles, {name: name}));
    } else {
      hocs.push(addClassnames(name));
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
    styles,
  };
  
  return (null as any as React.ComponentType<Omit<PropType,"classes">>);
}

// If true, `importComponent` imports immediately (rather than deferring until
// first use) and checks that the file registered the components named, with a
// lot of log-spam.
const debugComponentImports = false;

export function importComponent(componentName, importFn) {
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

function prepareComponent(componentName)
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

/**
 * Get a component registered with registerComponent(name, component, ...hocs).
 *
 * @param {String} name The name of the component to get.
 * @returns {Function|React Component} A (wrapped) React component
 */
const getComponent = name => {
  const component = ComponentsTable[name];
  if (!component) {
    throw new Error(`Component ${name} not registered.`);
  }
  if (component.hocs && component.hocs.length) {
    const hocs = component.hocs.map(hoc => {
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
    return compose(...hocs)(component.rawComponent);
  } else {
    return component.rawComponent;
  }
};

/**
 * Populate the lookup table for components to be callable
 * ℹ️ Called once on app startup
 **/
export const populateComponentsApp = () => {
  const missingComponents: Array<string> = [];
  for (let coreComponent of coreComponents) {
    if (!(coreComponent in ComponentsTable) && !(coreComponent in DeferredComponentsTable)) {
      missingComponents.push(coreComponent);
    }
  }

  if (missingComponents.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `Found the following missing core components: ${missingComponents.join(
        ', '
      )}. Include a UI package such as vulcan:ui-bootstrap to add them.`
    );
  }
  
  if (debugComponentImports) {
    importAllComponents();
  }
};

/**
 * Returns an instance of the given component name of function
 * @param {string|function} component  A component or registered component name
 * @param {Object} [props]  Optional properties to pass to the component
 */
//eslint-disable-next-line react/display-name
export const instantiateComponent = (component, props) => {
  if (!component) {
    return null;
  } else if (typeof component === 'string') {
    const Component = Components[component];
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
export const mergeWithComponents = myComponents => {
  if (!myComponents) return Components;
  
  const mergedComponentsProxyHandler = {
    get: function(obj, prop) {
      if (prop in myComponents) {
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
