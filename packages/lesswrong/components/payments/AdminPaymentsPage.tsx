import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Table } from '@/components/widgets/Table';
import { TableRow } from '@/components/widgets/TableRow';
import { TableCell } from '@/components/widgets/TableCell';
import { useCurrentUser } from '../common/withUser';
import { getUserEmail, userGetProfileUrl } from "../../lib/collections/users/helpers";
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import LoadMore from "../common/LoadMore";
import UserTooltip from "../users/UserTooltip";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import ForumIcon from "../common/ForumIcon";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersProfileMultiQuery = gql(`
  query multiUserAdminPaymentsPageQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

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
  const { data, loading, fetchMore } = useQuery(UsersProfileMultiQuery, {
    variables: {
      selector: { usersWithPaymentInfo: {} },
      limit: 500,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.users?.results;

  const loadMoreProps = useLoadMore({
    data: data?.users,
    loading,
    fetchMore,
    initialLimit: 500,
    itemsPerPage: 10,
    enableTotal: true,
    resetTrigger: {view: "usersWithPaymentInfo", limit: 500}
  });

  const [search, setSearch] = useState<string>("")
  const filteredResults = results?.filter(user => {
    const searchLower = search.toLowerCase()
    const { displayName, previousDisplayName, username, slug, paymentEmail, paymentInfo } = user
    const email = getUserEmail(user)

    return displayName.toLowerCase().includes(searchLower) || 
      username?.toLowerCase().includes(searchLower) || 
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

export default registerComponent('AdminPaymentsPage', AdminPaymentsPage, {styles});



