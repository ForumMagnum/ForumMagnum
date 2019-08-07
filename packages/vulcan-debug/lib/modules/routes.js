import {addRoute, getDynamicComponent} from 'meteor/vulcan:lib';

addRoute([
  // {name: 'cheatsheet', path: '/cheatsheet', component: import('./components/Cheatsheet.jsx')},
  {name: 'groups', path: '/groups', component: () => getDynamicComponent(import('../components/Groups.jsx')), layoutName: 'AdminLayout'},
  {name: 'settings', path: '/settings', componentName: 'Settings', layoutName: 'AdminLayout'},
  {name: 'callbacks', path: '/callbacks', componentName: 'Callbacks', layoutName: 'AdminLayout'},
  {name: 'routes', path: '/routes', componentName: 'Routes', layoutName: 'AdminLayout'},
  {name: 'components', path: '/components', componentName: 'Components', layoutName: 'AdminLayout'},
]);