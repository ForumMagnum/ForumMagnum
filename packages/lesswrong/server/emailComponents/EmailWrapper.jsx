import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  body: {
    "-webkit-text-size-adjust": "none",
    "-ms-text-size-adjust": "none",
    margin: 0,
    padding: "10px 0",
  },
  
  "& table": {borderSpacing:0},
  "& table td": {borderCollapse: "collapse"},


  /* Constrain email width for small screens */
  "@media screen and (max-width: 600px)": {
    "table.container": {
      width: "95% !important",
    },
    ".main-container": {
      fontSize: "14px !important",
    },
  },

  /* Give content more room on mobile */
  "@media screen and (max-width: 480px)": {
    "td.container-padding": {
      paddingLeft: "12px !important",
      paddingRight: "12px !important",
    }
  },
  
  "a": {
    color: "#5f9b65",
  },
  blockquote: {
    borderLeft: "solid 3px #e0e0e0",
    padding: ".75em 2em",
    margin: 0,
    color: "rgba(0,0,0, 0.87)",
  },
});

const EmailWrapper = ({children, accountLink, siteName, footer, classes}) => {
  return (<React.Fragment>
    <html lang="en">
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8"/>
      {/* So that mobile webkit will display zoomed in */}
      <meta name="viewport" content="initial-scale=1.0"/>
      {/* disable auto telephone linking in iOS */}
      <meta name="format-detection" content="telephone=no"/>
   
      <title>{siteName}</title>
      <style type="text/css">
      </style>
    </head>
    <body className={classes.body} bgcolor="white" leftMargin="0" topMargin="0" marginWidth="0" marginHeight="0">
    
    <br/>
    
    {/* 100% wrapper */}
    <table border="0" width="100%" height="100%" cellPadding="0" cellSpacing="0" bgcolor="#ffffff">
      <tr>
        <td className="wrapper" align="center" valign="top" bgcolor="#ffffff" style="background-color: #ffffff;">
    
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
    </html>
  </React.Fragment>);
}

export default withStyles(styles)(EmailWrapper);
