import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { Utils } from 'meteor/vulcan:lib';

// Wrapper for top-level formatting of emails, eg controling width and
// background color. See also the global CSS in renderEmail.js. Derived from
// wrapper.handlebars in Vulcan-Starter.
const EmailWrapper = ({children}) => {
  const accountLink = `${Utils.getSiteUrl()}account`
  return (
    <body bgcolor="white" leftmargin="0" topmargin="0" marginWidth="0" marginHeight="0">
      <br/>
      
      {/* 100% wrapper */}
      <table border="0" width="100%" height="100%" cellPadding="0" cellSpacing="0" bgcolor="#ffffff">
        <tr>
          <td className="wrapper" align="center" valign="top" bgcolor="#ffffff" style={{"backgroundColor": "#ffffff"}}>
      
            {/* 600px container (white background) */}
            <table border="0" width="600" cellPadding="0" cellSpacing="0" className="container" bgcolor="#ffffff">
              <tr>
                <td className="main-container container-padding" bgcolor="#ffffff">
                  <br/>
                  {children}
                </td>
              </tr>
              <tr><td>
                <a href={accountLink}>Change your notifications settings</a><br/><br/>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
      <br/><br/>
    </body>
  );
}

registerComponent("EmailWrapper", EmailWrapper);
