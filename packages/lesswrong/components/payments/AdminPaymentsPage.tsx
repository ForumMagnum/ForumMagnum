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
  const { SingleColumnSection, SectionTitle, Loading, UsersNameDisplay, LoadMore, ErrorBoundary } = Components

  const { results: userResults, loading: usersLoading, loadMoreProps: usersLoadMore } = useMulti({
    terms: {view: "usersWithPaymentInfo", limit: 10},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    fetchPolicy: 'cache-and-network',
    enableTotal: true
  });

  const { results: paymentResults, loading: paymentsLoading, loadMoreProps: paymentsLoadMore } = useMulti({
    terms: {limit: 10},
    collectionName: "Payments",
    fragmentName: 'PaymentBase',
    fetchPolicy: 'cache-and-network',
    enableTotal: true
  });

  const currentUser = useCurrentUser()
  if (!currentUser?.isAdmin) return null

  return <ErrorBoundary>
  <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="User Payment Info"/>
      {usersLoading && <Loading/>}
      <Table>
        <TableRow>
          <TableCell><b>Username</b></TableCell>
          <TableCell><b>Contact Email</b></TableCell>
          <TableCell><b>Payment Email</b></TableCell>
          <TableCell><b>Payment Info</b></TableCell>
        </TableRow>
        {userResults?.map(user => <TableRow key={user._id}>
            <TableCell><UsersNameDisplay user={user}/></TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.paymentEmail}</TableCell>
            <TableCell>{user.paymentInfo}</TableCell>
          </TableRow>
        )}
      </Table>
      <LoadMore {...usersLoadMore}/>
    </SingleColumnSection>
    <SingleColumnSection>
      <SectionTitle title="Payments"/>
      {paymentsLoading && <Loading/>}
      <Table>
        <TableRow>
          <TableCell><b>User</b></TableCell>
          <TableCell><b>Recipient</b></TableCell>
          <TableCell><b>Amount</b></TableCell>
          <TableCell><b>Contact Email</b></TableCell>
          <TableCell><b>Payment Email</b></TableCell>
          <TableCell><b>Payment Info</b></TableCell>
        </TableRow>
        {paymentResults?.map(payment => {
          return <TableRow key={payment._id}>
            <TableCell>{payment.user ? <UsersNameDisplay user={payment.user}/> : "Anonymous" }</TableCell>
            <TableCell><UsersNameDisplay user={payment.recipientUser}/></TableCell>
            <TableCell>{payment.amount}</TableCell>
            <TableCell>{payment.recipientUser?.email}</TableCell>
            <TableCell>{payment.recipientUser?.paymentEmail}</TableCell>
            <TableCell>{payment.recipientUser?.paymentInfo}</TableCell> 
          </TableRow>
        })}
      </Table>
      <LoadMore {...paymentsLoadMore}/>
    </SingleColumnSection>
    </div>;
  </ErrorBoundary>

}

const AdminPaymentsPageComponent = registerComponent('AdminPaymentsPage', AdminPaymentsPage, {styles});

declare global {
  interface ComponentTypes {
    AdminPaymentsPage: typeof AdminPaymentsPageComponent
  }
}

