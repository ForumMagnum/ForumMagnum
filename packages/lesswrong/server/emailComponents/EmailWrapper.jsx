import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { Utils } from 'meteor/vulcan:lib';
import { withStyles } from '@material-ui/core/styles';
import { emailBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: emailBodyStyles(theme)
})

// Wrapper for top-level formatting of emails, eg controling width and
// background color. See also the global CSS in renderEmail.js. Derived from
// wrapper.handlebars in Vulcan-Starter.
const EmailWrapper = ({user, unsubscribeAllLink, children, classes}) => {
  const accountLink = `${Utils.getSiteUrl()}account`
  
  return (
    <body bgcolor="white" leftmargin="0" topmargin="0" marginWidth="0" marginHeight="0">
      <br/>

      {/* 100% wrapper */}
      <div className={classes.root}>
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
                  <br/><br/>
    <a href={unsubscribeAllLink}>Unsubscribe</a> (from all emails from LessWrong) {/* TODO; */}
                  or <a href={accountLink}>Change your notifications settings</a><br/><br/>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      <br/><br/>
    </body>
  );
}

registerComponent("EmailWrapper", EmailWrapper,
  withStyles(styles, {name: 'EmailWrapper'})
);
