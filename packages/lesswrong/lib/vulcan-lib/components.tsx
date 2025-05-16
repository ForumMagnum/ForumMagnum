import compose from 'lodash/flowRight';
import React from 'react';
import { shallowEqual, shallowEqualExcept, debugShouldComponentUpdate } from '../utils/componentUtils';
import * as _ from 'underscore';
import { withAddClasses } from '@/components/hooks/useStyles';
import type { StyleOptions } from '@/server/styleGeneration';

type ComparisonFn = (prev: any, next: any) => boolean
type ComparePropsDict = { [propName: string]: "default"|"shallow"|"ignore"|"deep"|ComparisonFn }
type AreEqualOption = ComparisonFn|ComparePropsDict|"auto"

// Options passed to registerComponent
type ComponentOptions = StyleOptions & {
  // JSS styles for this component. These will generate class names, which will
  // be passed as an extra prop named "classes".
  styles?: any

  // Whether this component can take a ref. If set, forwardRef is used to pass
  // the ref across any higher-order components. If not set, and HoCs are
  // present, the ref may not work work.
  allowRef?: boolean

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

type EmailRenderContextType = {
  isEmailRender: boolean
}

export const EmailRenderContext = React.createContext<EmailRenderContextType|null>(null);

/**
 * Takes a props type, and, if it doesn't mention `ref`, set its type to
 * `never`. This is used to enforce that components don't take a ref unless
 * that's specified explicitly in their props list.
 *
 * "Taking a ref" means being used with <MyComponent ref={...}/>. This is
 * useful if that the component either is a class component that can have its
 * methods called by a parent component, or calls a useImperativeHandle.
 * However if a component takes a ref, then any higher-order components need to
 * be careful about forwarding that ref properly, which requires sticking extra
 * HoCs related to that in the component tree. We don't want to do that
 * implicitly because most components don't take refs.
 */
type NoImplicitRef<T> = (T extends {ref?: any} ? T : T & {ref?: never});

/**
 * Register a component. Takes a name, a raw component, and ComponentOptions
 * (see above). Components should be in their own file, imported with
 * `importComponent`, and registered in that file; components that are
 * registered this way can be accessed via the Components object and are lazy-
 * loaded.
 *
 * Returns a dummy value--null, but coerced to a type that you can add to the
 * ComponentTypes interface to type-check usages of the component in other
 * files.
 */
export function registerComponent<PropType>(
  name: string,
  rawComponent: React.ComponentType<PropType>,
  options?: ComponentOptions
): React.ComponentType<Omit<NoImplicitRef<PropType>,"classes">> {
  const { styles=null, hocs=[] } = options || {};
  if (styles) {
    hocs.push(withAddClasses(styles, name, options));
  }
  
  rawComponent.displayName = name;
  
  return composeComponent({ name, rawComponent, hocs, options });
}

// If true, `importComponent` imports immediately (rather than deferring until
// first use) and checks that the file registered the components named, with a
// lot of log-spam.
const debugComponentImports = false;


export function importAllComponents() {
  require('@/lib/generated/allComponents');
}

const composeComponent = (componentMeta: ComponentsTableEntry) => {
  const componentWithMemo = componentMeta.options?.areEqual
    ? memoizeComponent(componentMeta.options.areEqual, componentMeta.rawComponent, componentMeta.name, !!componentMeta.options.debugRerenders)
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
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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
