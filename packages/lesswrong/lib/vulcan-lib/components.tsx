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
const ComponentsTable = {};

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

/**
 * Register a Vulcan component with a name, a raw component than can be extended
 * and one or more optional higher order components.
 *
 * @param {String} name The name of the component to register.
 * @param {React Component} rawComponent Interchangeable/extendable component.
 * @param {...Function} hocs The HOCs to compose with the raw component.
 *
 * Note: when a component is registered without higher order component, `hocs` will be
 * an empty array, and it's ok!
 * See https://github.com/reactjs/redux/blob/master/src/compose.js#L13-L15
 *
 * @returns Structure of a component in the list:
 *
 * ComponentsTable.Foo = {
 *    name: 'Foo',
 *    hocs: [fn1, fn2],
 *    rawComponent: React.Component,
 *    call: () => compose(...hocs)(rawComponent),
 * }
 *
 */
/*export function registerComponent<PropType>(name, rawComponent, ...hocs): React.ComponentType<Omit<PropType,"classes">> {
  var styles = null;
  
  // support single-argument syntax
  if (typeof arguments[0] === 'object') {
    // note: cannot use `const` because name, components, hocs are already defined
    // as arguments so destructuring cannot work
    // eslint-disable-next-line no-redeclare
    var { name, component, hocs = [], styles } = arguments[0];
    rawComponent = component;
  } else if (typeof arguments[2] === 'object' && (arguments[2].hocs || arguments[2].styles)) {
    styles = arguments[2].styles;
    hocs = arguments[2].hocs || [];
  }
  
  if (styles) {
    hocs.push(withStyles(styles, {name: name}));
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
  };
}*/

export function registerComponent<PropType>(name: string, rawComponent: React.ComponentType<PropType>,
  options?: {styles?: any, hocs?: Array<any>}): React.ComponentType<Omit<PropType,"classes">>
{
  const { styles=null, hocs=[] } = options || {};
  if (styles) {
    hocs.push(withStyles(styles, {name: name}));
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
