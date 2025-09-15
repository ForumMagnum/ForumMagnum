import React, { ReactNode } from 'react';
import { isFriendlyUI } from '@/themes/forumTheme';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("EmailWrapper", (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI ? {...theme.typography.smallText} : {}),
    "& img": {
      maxWidth: "100%",
    }
  },
  unsubscribe: {
    fontWeight: isFriendlyUI ? 400 : undefined,
  },
}))

// Wrapper for top-level formatting of emails, eg controling width and
// background color. See also the global CSS in renderEmail.js. Derived from
// wrapper.handlebars in Vulcan-Starter.
export const EmailWrapper = ({unsubscribeNode, children}: {
  unsubscribeNode: ReactNode,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);

  // Put props for some HTML elements in any-typed objects, because emails use
  // non-HTML5 attributes which the typechecker will complain about
  const bodyProps: any = {
    bgcolor: "white",
    leftmargin: "0",
    topmargin: "0",
    marginWidth: "0",
    marginHeight: "0",
  };
  const outerTableProps: any = {
    border: "0",
    width: "100%",
    height: "100%",
    cellPadding: "0",
    cellSpacing: "0",
    bgcolor: "#ffffff",
  };
  const outerTdProps: any = {
    align: "center",
    valign: "top",
    bgcolor: "#ffffff",
    style: {"backgroundColor": "#ffffff"},
  };
  const innerTableProps: any = {
    border: "0",
    width: "600",
    cellPadding: "0",
    cellSpacing: "0",
    bgcolor: "#ffffff",
  };
  const innerTdProps: any = {
    bgcolor: "#ffffff",
  };
  return (
    <body {...bodyProps}>
      <br/>

      {/* 100% wrapper */}
      <div className={classes.root}>
        <table {...outerTableProps}>
          <tbody>
            <tr>
              <td className="wrapper" {...outerTdProps}>

                {/* 600px container (white background) */}
                <table className="container" {...innerTableProps}>
                  <tbody>
                    <tr>
                      <td className="container-padding" {...innerTdProps}>
                        <br/>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td className={classNames("container-padding", classes.unsubscribe)}>
                        <br/>
                        {unsubscribeNode}
                        <br/>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <br/><br/>
    </body>
  );
}
