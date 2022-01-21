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
  const { SingleColumnSection, SectionTitle, Loading, UsersNameDisplay } = Components

  const currentUser = useCurrentUser()

  if (!currentUser?.isAdmin) return null

  const { results, loading } = useMulti({
    terms: {view: "usersWithPaymentInfo"},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    fetchPolicy: 'cache-and-network',
  });
    
  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Payment Admin"/>
      {loading && <Loading/>}
      <Table>
        {results?.map(user => <TableRow key={user._id}>
            <TableCell><UsersNameDisplay user={user}/></TableCell>
            <TableCell>{user.paymentEmail}</TableCell>
            <TableCell>{user.paymentInfo}</TableCell>
          </TableRow>
        )}
      </Table>
    </SingleColumnSection>
  </div>;
}

const AdminPaymentsPageComponent = registerComponent('AdminPaymentsPage', AdminPaymentsPage, {styles});

declare global {
  interface ComponentTypes {
    AdminPaymentsPage: typeof AdminPaymentsPageComponent
  }
}

