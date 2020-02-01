
declare module 'meteor/vulcan:accounts';
declare module 'meteor/vulcan:i18n';
declare module 'meteor/vulcan:lib';
declare module 'meteor/vulcan:users';
declare module 'meteor/random';
declare module 'meteor/meteor';
declare module 'meteor/accounts-base';
declare module 'meteor/practicalmeteor:chai';

type C<T=any> = React.ComponentType<T>
type HoC<O,T> = (component: C<O>) => C<T>

declare module 'meteor/vulcan:core' {
  export const Components: ComponentTypes;
  
  // Type for registering components without any HoCs
  export function registerComponent<PropType>(name: string, rawComponent: React.ComponentType<PropType>): React.ComponentType<PropType>
  
  //export function registerComponent<ModifiedType,PropType>(name: string, rawComponent: React.ComponentType<PropType>, ...hocs: any): React.ComponentType<ModifiedType>
  
  export function registerComponent<PropType>(name: string, rawComponent: React.ComponentType<PropType>, {styles, hocs}: {styles?: any, hocs?: Array<any>}): React.ComponentType<Omit<PropType,"classes">>
  
  // STUB type for registering components with HoCs. This makes the component
  // type `any`. There are commented-out type signatures for registerComponent
  // with different numbers of HoCs below, but they only work if the HoCs
  // themselves are properly typed, on pain of very large numbers of spurious
  // type errors. This means most prop usages on components aren't being
  // checked yet.
  //export function registerComponent<PropType, T1>(name: string, rawComponent: React.ComponentType<PropType>, ...hocs: any): any
  
  /*export function registerComponent<PropType, T1>(name: string, rawComponent: React.ComponentType<PropType>, HoC1: HoC<PropType,T1>): C<T1>
  export function registerComponent<PropType, T1, T2>(name: string, rawComponent: React.ComponentType<PropType>, HoC1: HoC<T1, T2>, HoC2: HoC<PropType, T1>):C<T2>
  export function registerComponent<PropType, T1, T2, T3>(name: string, rawComponent: C<PropType>, HoC1: HoC<T2, T3>, HoC2: HoC<T1, T2>, HoC3: HoC<PropType, T1>): C<T3>
  export function registerComponent<PropType, T1, T2, T3, T4>(name: string, rawComponent: C<PropType>, HoC1: HoC<T3, T4>, HoC2: HoC<T2, T3>, HoC3: HoC<T1, T2>, HoC4: HoC<PropType, T1>): C<T4>
  export function registerComponent<PropType, T1, T2, T3, T4, T5>(name: string, rawComponent: C<PropType>, HoC1: HoC<T4, T5>, HoC2: HoC<T3, T4>, HoC3: HoC<T2, T3>, HoC4: HoC<T1, T2>, HoC5: HoC<PropType, T1>): C<T5>
  export function registerComponent<PropType, T1, T2, T3, T4, T5, T6>(name: string, rawComponent: C<PropType>, HoC1: HoC<T5, T6>, HoC2: HoC<T4, T5>, HoC3: HoC<T3, T4>, HoC4: HoC<T2, T3>, HoC5: HoC<T1, T2>, HoC6: HoC<PropType, T1>): C<T6>
  export function registerComponent<PropType, T1, T2, T3, T4, T5, T6, T7>(name: string, rawComponent: C<PropType>, HoC1:HoC<T6, T7>, HoC2: HoC<T5, T6>, HoC3: HoC<T4, T5>, HoC4: HoC<T3, T4>, HoC5: HoC<T2, T3>, HoC6: HoC<T1, T2>, ...hocs: HoC<PropType, T1>[]): C<T7>*/
  
  export const Utils: any;
  export const getSetting: any;
  export const registerSetting: any;
  export const getCollection: any;
  export const getFragment: any;
  export const registerFragment: any;
  export const getFragmentName: any;
  export const getAllFragmentNames: any;
  export const getCollectionName: any;
  export const addCallback: any;
  export const runCallbacks: any;
  export const runCallbacksAsync: any;
  export const newMutation: any;
  export const editMutation: any;
  export const removeMutation: any;
  export const addGraphQLMutation: any;
  export const addGraphQLResolvers: any;
  export const runQuery: any;
  export const Head: any;
  export const Vulcan: any;
  export const createClientTemplate: any;
  export const deleteClientTemplate: any;
  export const getAdminColumns: any;
  export const addAdminColumn: any;
  export const Connectors: any;
  export const addStrings: any,
  export const addRoute: any,
  export const addGraphQLSchema: any,
  export const Strings: any,
  export const detectLocale: any,
  export const getErrors: any,
  export const mergeWithComponents: any,
}
