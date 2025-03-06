import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { getUserEmail, userGetProfileUrl } from "../../lib/collections/users/helpers";
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import { Loading } from "@/components/vulcan-core/Loading";
import LoadMore from "@/components/common/LoadMore";
import UserTooltip from "@/components/users/UserTooltip";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import ForumIcon from "@/components/common/ForumIcon";
import { Table, TableRow, TableCell, Input } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  row: {
    display: "flex"
  },
  search: {
    ...theme.typography.body1,
    border: theme.palette.border.faint,
    borderRadius: 3,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 16,
    marginTop: 16
  },
  myAccountLink: {
    ...theme.typography.body2,
    marginBottom: 24,
    display: "block"
  },
  icon: {
    width: 14,
    color: theme.palette.grey[500],
    marginRight: 12,
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  smallCell: {
    width: 30,
    paddingRight: 0
  }
});

export const AdminPaymentsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading, loadMoreProps } = useMulti({
    terms: {view: "usersWithPaymentInfo", limit: 500},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    fetchPolicy: 'cache-and-network',
    enableTotal: true
  });

  const [search, setSearch] = useState<string>("")
  const filteredResults = results?.filter(user => {
    const searchLower = search.toLowerCase()
    const { displayName, previousDisplayName, username, slug, paymentEmail, paymentInfo } = user
    const email = getUserEmail(user)

    return displayName.toLowerCase().includes(searchLower) || 
      username.toLowerCase().includes(searchLower) || 
      previousDisplayName?.toLowerCase().includes(searchLower) ||
      slug.toLowerCase().includes(searchLower) ||
      paymentEmail?.toLowerCase().includes(searchLower) ||
      paymentInfo?.toLowerCase().includes(searchLower) ||
      email?.toLowerCase().includes(searchLower)
  })

  const currentUser = useCurrentUser()
  if (!currentUser?.isAdmin) return <ErrorAccessDenied />

  return <div>
    <SingleColumnSection>
      <SectionTitle title="Payment Admin"/>
      <div>
        <Input 
          className={classes.search}
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search..."
          disableUnderline
        />
      </div>
      <Link to={"/payments/account"} className={classes.myAccountLink}>
        My Account Payments
      </Link>
      {loading && <Loading/>}
      <Table>
        <TableRow>
          <TableCell className={classes.smallCell}></TableCell>
          <TableCell className={classes.smallCell}></TableCell>
          <TableCell><b>Name</b></TableCell>
          <TableCell><b>Email</b></TableCell>
          <TableCell><b>Payment Info</b></TableCell>
        </TableRow>
        {filteredResults?.map((user, i) => {
          return <TableRow key={user._id}>
            <TableCell className={classes.smallCell}>{i+1}</TableCell>
            <TableCell className={classes.smallCell}>
              <UserTooltip user={user}>
                <Link to={userGetProfileUrl(user)}>
                  <ForumIcon icon="Link" className={classes.icon}/>
                </Link>
              </UserTooltip>
            </TableCell>
            <TableCell>
              {user.fullName ?? user.displayName}
            </TableCell>
            <TableCell>{user.paymentEmail ?? getUserEmail(user)}</TableCell>
            <TableCell>{user.paymentInfo ?? user.paymentEmail}</TableCell>
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

export default AdminPaymentsPageComponent;

