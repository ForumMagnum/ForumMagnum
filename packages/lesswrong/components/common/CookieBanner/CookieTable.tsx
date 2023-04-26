import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { CookieSignature, CookieType, CookiesTable } from "../../../lib/cookies/utils";

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
  heading: {
    marginBottom: 8,
    marginTop: 8,
    fontWeight: 600,
  },
  tableContainer: {
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
    overflow: 'hidden',
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: theme.typography.fontFamily,
  },
  th: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: 4,
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
  },
  td: {
    padding: 4,
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },
});

const CookieTable = ({
  classes,
  type,
  thirdPartyName,
}: {
  classes: ClassesType;
  type: CookieType;
  thirdPartyName?: string;
}) => {
  const { Typography } = Components;

  const filteredCookies = Object.values(CookiesTable).filter(
    (cookie: CookieSignature) => cookie.type === type && cookie.thirdPartyName === thirdPartyName
  );

  return (
    <>
      <Typography variant="display1" className={classes.heading}>
        Set by {thirdPartyName ?? "us"}
      </Typography>
      <div className={classes.tableContainer}>
        <table className={classes.table}>
          <thead>
            <tr>
              <th className={classes.th}>Name</th>
              <th className={classes.th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredCookies.map((cookie) => (
              <tr key={cookie.name}>
                <td className={classes.td}>{cookie.name}</td>
                <td className={classes.td}>{cookie.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const CookieTableComponent = registerComponent("CookieTable", CookieTable, { styles });

declare global {
  interface ComponentTypes {
    CookieTable: typeof CookieTableComponent;
  }
}
