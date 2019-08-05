import { Components, registerComponent } from 'vulcan:lib';
import React from 'react';

const Layout = ({children}) =>
  <div className="wrapper" id="wrapper">{children}</div>;

Layout.displayName = 'Layout';

registerComponent('Layout', Layout);

export default Layout;