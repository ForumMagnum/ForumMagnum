import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { CookieSignature, CookieType, CookiesTable } from "../../../lib/cookies/utils";
import { Typography } from "@/components/common/Typography";

const styles = (theme: ThemeType) => ({
  root: {},
  heading: {
    padding: 0,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: 600,
    fontSize: "1.2rem",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  tableContainer: {
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
    overflow: 'hidden',
    marginBottom: 8,
  },
  table: {
    ...theme.typography.commentStyle,
    width: "100%",
    borderCollapse: "collapse",
    fontWeight: 400,
  },
  th: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: 8,
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    borderRight: `1px solid ${theme.palette.primary.main}`, // hack to make borders line up
    borderLeft: `1px solid ${theme.palette.primary.main}`, // hack to make borders line up
    fontSize: "1rem",
    textAlign: "left",
  },
  tr: {
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  td: {
    padding: 8,
    fontSize: "1rem",
  },
  tdName: {
    width: "40%",
    wordBreak: "break-all",
  },
  tdDescription: {
    width: "60%",
  },
});

const CookieTable = ({
  type,
  thirdPartyName,
  className,
  classes,
}: {
  type: CookieType;
  thirdPartyName?: string;
  className?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const filteredCookies = Object.values(CookiesTable).filter(
    (cookie: CookieSignature) => cookie.type === type && cookie.thirdPartyName === thirdPartyName
  );

  return (
    <div className={className}>
      <Typography variant="body1" className={classes.heading}>
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
              <tr key={cookie.name} className={classes.tr}>
                <td className={`${classes.td} ${classes.tdName}`}>{cookie.name}</td>
                <td className={`${classes.td} ${classes.tdDescription}`}>{cookie.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CookieTableComponent = registerComponent("CookieTable", CookieTable, { styles });

declare global {
  interface ComponentTypes {
    CookieTable: typeof CookieTableComponent;
  }
}

export default CookieTableComponent;
