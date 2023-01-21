import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import { useCurrentUser } from '../common/withUser';
import { getUserEmail } from "../../lib/collections/users/helpers";
import Input from '@material-ui/core/Input';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex"
  },
  search: {
    ...theme.typography.body1,
    ...theme.typography.uiStyle,
    border: theme.palette.border.faint,
    borderRadius: 3,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 24,
    marginTop: 16
  }
});

export const AdminPaymentsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle, Loading, UsersNameDisplay, LoadMore } = Components

  const { results, loading, loadMoreProps } = useMulti({
    terms: {view: "usersWithPaymentInfo", limit: 500},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    fetchPolicy: 'cache-and-network',
    enableTotal: true
  });

  const [search, setSearch] = useState<string>("")
  const filteredResults = results?.filter(({displayName, username, slug}) => {
    const searchLower = search.toLowerCase()
    return displayName.toLowerCase().includes(searchLower) || username.toLowerCase().includes(searchLower) || slug.toLowerCase().includes(searchLower)
  })

  const currentUser = useCurrentUser()
  if (!currentUser?.isAdmin) return null

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Payment Admin">
        <Link to={"/payments/account"}>My Account Payments</Link>
      </SectionTitle>
      <Input 
        className={classes.search} 
        onChange={e => setSearch(e.target.value)} 
        placeholder="Search..."
        disableUnderline
      />
      {loading && <Loading/>}
      <Table>
        <TableRow>
          <TableCell><b>Username</b></TableCell>
          <TableCell><b>Account Email</b></TableCell>
          <TableCell><b>Payment Email</b></TableCell>
          <TableCell><b>Payment Info</b></TableCell>
        </TableRow>
        {filteredResults?.map(user => {
          return <TableRow key={user._id}>
              <TableCell><UsersNameDisplay user={user}/></TableCell>
              <TableCell>{getUserEmail(user)}</TableCell>
              <TableCell>{user.paymentEmail}</TableCell>
              <TableCell>{user.paymentInfo}</TableCell>
          </TableRow>
        })}
      </Table>
      <LoadMore {...loadMoreProps}/>
    </SingleColumnSection>
  </div>;
}

const AdminPaymentsPageComponent = registerComponent('AdminPaymentsPage', AdminPaymentsPage, {styles});

declare global {
  interface ComponentTypes {
    AdminPaymentsPage: typeof AdminPaymentsPageComponent
  }
}

