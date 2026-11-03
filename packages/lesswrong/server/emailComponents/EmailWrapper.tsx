import React from 'react';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { EmailContextType, emailUseStyles } from './emailContext';
import { defineStyles } from '@/components/hooks/defineStyles';

const styles = defineStyles("EmailWrapper", (theme: ThemeType) => ({
  root: {
    "& img": {
      maxWidth: "100%",
    }
  },
}))

// Wrapper for top-level formatting of emails, eg controling width and
// background color. See also the global CSS in renderEmail.js. Derived from
// wrapper.handlebars in Vulcan-Starter.
export const EmailWrapper = ({unsubscribeAllLink, emailContext, backgroundColor = "#ffffff", includeUnsubscribeFooter = true, children}: {
  unsubscribeAllLink: string | null,
  emailContext: EmailContextType,
  backgroundColor?: string,
  includeUnsubscribeFooter?: boolean,
  children: React.ReactNode,
}) => {
  const classes = emailUseStyles(styles, emailContext);
  const accountLink = `${getSiteUrl(emailContext.resolverContext.forumType)}account`
  const siteNameWithArticle = siteNameWithArticleSetting.get(emailContext.resolverContext)
  
  // Put props for some HTML elements in any-typed objects, because emails use
  // non-HTML5 attributes which the typechecker will complain about
  const bodyProps: any = {
    bgcolor: backgroundColor,
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
    bgcolor: backgroundColor,
  };
  const outerTdProps: any = {
    align: "center",
    valign: "top",
    bgcolor: backgroundColor,
    style: {"backgroundColor": backgroundColor},
  };
  const innerTableProps: any = {
    border: "0",
    width: "600",
    cellPadding: "0",
    cellSpacing: "0",
    bgcolor: backgroundColor,
  };
  const innerTdProps: any = {
    bgcolor: backgroundColor,
  };
  
  return (
    <body {...bodyProps}>
      {/* 100% wrapper */}
      <div className={classes.root}>
        <table {...outerTableProps}>
          <tbody>
            <tr>
              <td className="wrapper" {...outerTdProps}>
                <br/>

                {/* 600px container */}
                <table className="container" {...innerTableProps}>
                  <tbody>
                    <tr>
                      <td className="container-padding" {...innerTdProps}>
                        <br/>
                        {children}
                      </td>
                    </tr>
                    {includeUnsubscribeFooter && <tr><td className="container-padding">
                      <br/>
                      {unsubscribeAllLink && <>
                        <a href={unsubscribeAllLink}>Unsubscribe</a>{' '}
                        (from all emails from {siteNameWithArticle})
                        or <a href={accountLink}>Change your notifications settings</a>
                      </>}
                      <br/>
                    </td></tr>}
                  </tbody>
                </table>
                <br/><br/>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
  );
}

