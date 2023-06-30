import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    marginTop: 20
  },
  emptyList: {
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily
  },
  link: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily
  }
});

const UserListsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, UserListListItem, Loading, Typography } = Components;

  const { results: listsOwnedByUser, loading: loadingListsOwnedByUser } = useMulti({
    terms: {
      view: 'userListOwnedByUser'
    },
    collectionName: "UserLists",
    fragmentName: 'UserListFragment',
  })
  const { results: listsContainingUser, loading: loadingListsContainingUser } = useMulti({
    terms: {
      view: 'userListContainsUser'
    },
    collectionName: "UserLists",
    fragmentName: 'UserListFragment',
  })
  const { results: publicLists, loading: loadingPublicLists } = useMulti({
    terms: {
      view: 'publicLists'
    },
    collectionName: "UserLists",
    fragmentName: 'UserListFragment',
  })

  return <SingleColumnSection>
    <Typography variant="title">Lists You Manage</Typography>
    {loadingListsOwnedByUser && <Loading/>}
    {listsOwnedByUser?.map((list: UserListFragment) => <UserListListItem key={list._id} userList={list}/>)}
    <Link to="/userLists/new" className={classes.link}>Create New</Link>

    <Typography variant="title" className={classes.title}>{"Lists You're In"}</Typography>
    {loadingListsContainingUser && <Loading/>}
    {!loadingListsContainingUser && !listsContainingUser?.length && <span className={classes.emptyList}>
      You aren't on any lists
    </span>}
    {listsContainingUser?.map((list: UserListFragment) => <UserListListItem key={list._id} userList={list}/>)}
    
    <Typography variant="title" className={classes.title}>Public Lists</Typography>
    {loadingPublicLists && <Loading/>}
    {!loadingPublicLists && !publicLists?.length && <span className={classes.emptyList}>
      No public lists found
    </span>}
    {publicLists?.map((list: UserListFragment) => <UserListListItem key={list._id} userList={list}/>)}
  </SingleColumnSection>;
}

const UserListsPageComponent = registerComponent("UserListsPage", UserListsPage, {styles});

declare global {
  interface ComponentTypes {
    UserListsPage: typeof UserListsPageComponent,
  }
}
