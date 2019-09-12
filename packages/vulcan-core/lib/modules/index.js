
// import and re-export
export * from 'meteor/vulcan:lib';

export * from './default_mutations.js';
export * from './default_resolvers.js';

export * from './components.js';

export * from './components/App.jsx';
export { default as Icon } from './components/Icon.jsx';
export { default as ShowIf } from './components/ShowIf.jsx';
export { default as DynamicLoading } from './components/DynamicLoading.jsx';
export { default as Datatable } from './components/Datatable.jsx';
export { default as RouterHook } from './components/RouterHook.jsx';
export { default as ScrollToTop } from './components/ScrollToTop.jsx';

export { default as withAccess } from './containers/withAccess.js';
export { default as withMessages } from './containers/withMessages.js';
export { default as withMulti, useMulti } from './containers/withMulti.js';
export { default as withSingle, useSingle } from './containers/withSingle.js';
export { default as withCreate } from './containers/withCreate.js';
export { default as withUpdate, useUpdate } from './containers/withUpdate.js';
export { default as withDelete } from './containers/withDelete.js';
export { default as withCurrentUser } from './containers/withCurrentUser.js';
export { default as withMutation } from './containers/withMutation.js';
export { default as withSiteData } from './containers/withSiteData.js';

export { default as MessageContext } from './messages.js';

// OpenCRUD backwards compatibility
export { default as withNew } from './containers/withCreate.js';
export { default as withEdit } from './containers/withUpdate.js';
export { default as withRemove } from './containers/withDelete.js';
export { default as withList } from './containers/withMulti.js';
export { default as withDocument } from './containers/withSingle.js';
