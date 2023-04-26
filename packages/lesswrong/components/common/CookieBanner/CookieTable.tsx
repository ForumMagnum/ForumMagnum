import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { CookieSignature, CookieType, CookiesTable } from '../../../lib/cookies/utils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: theme.typography.fontFamily,
  },
  th: {
    backgroundColor: theme.palette.grey[300],
    padding: 4,
    borderBottom: '1px solid black',
  },
  td: {
    padding: 4,
    borderBottom: '1px solid lightgrey',
  },
});

const CookieTable = ({ classes, type, thirdPartyName }: {
  classes: ClassesType,
  type: CookieType,
  thirdPartyName?: string,
}) => {
  const filteredCookies = Object.values(CookiesTable).filter(
    (cookie: CookieSignature) =>
      cookie.type === type && (thirdPartyName ? cookie.thirdPartyName === thirdPartyName : true)
  );

  return (
    <table className={classes.table}>
      <thead>
        <tr>
          <th className={classes.th}>Name</th>
          <th className={classes.th}>Duration</th>
          <th className={classes.th}>Description</th>
        </tr>
      </thead>
      <tbody>
        {filteredCookies.map((cookie) => (
          <tr key={cookie.name}>
            <td className={classes.td}>{cookie.name}</td>
            <td className={classes.td}>{cookie.maxExpires}</td>
            <td className={classes.td}>{cookie.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const CookieTableComponent = registerComponent('CookieTable', CookieTable, { styles });

declare global {
  interface ComponentTypes {
    CookieTable: typeof CookieTableComponent;
  }
}
