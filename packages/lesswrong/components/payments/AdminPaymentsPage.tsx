import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex"
  }
});

export const AdminPaymentsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle, Loading, UsersNameDisplay, LoadMore } = Components

  const { results, loading, loadMoreProps } = useMulti({
    terms: {view: "usersWithPaymentInfo", limit: 100},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    fetchPolicy: 'cache-and-network',
    enableTotal: true
  });

  const currentUser = useCurrentUser()
  if (!currentUser?.isAdmin) return null

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Payment Admin"/>
      {loading && <Loading/>}
      <Table>
        <TableRow>
          <TableCell><b>Username</b></TableCell>
          <TableCell><b>Contact Email</b></TableCell>
          <TableCell><b>Payment Email</b></TableCell>
          <TableCell><b>Payment Info</b></TableCell>
        </TableRow>
        {results?.map(user => {
          return <TableRow key={user._id}>
              <TableCell><UsersNameDisplay user={user}/></TableCell>
              <TableCell>{user.email}</TableCell>
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

