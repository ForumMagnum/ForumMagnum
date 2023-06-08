import classNames from 'classnames';
import uniqBy from 'lodash/uniqBy';
import qs from 'qs';
import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { TupleSet, UnionOf } from '../../lib/utils/typeGuardUtils';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import type { CommentWithModeratorActions } from './CommentsReviewInfoCard';

const styles = (theme: ThemeType): JssStyles => ({
  page: {
    width: '90%',
    maxWidth: 1800,
    margin: 'auto',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    }
  },
  topBar: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.eventCard,
    marginBottom: 16,
    padding: 12,
    ...theme.typography.body2,
    zIndex: theme.zIndexes.modTopBar
  },
  tabButton: {
    marginRight: 25,
    color: theme.palette.grey[600],
    cursor: "pointer"
  },
  tabButtonSelected: {
    color: theme.palette.grey[900]
  },
  row: {
    display: "flex"
  },
  toc: {
    width: 220,
    ...theme.typography.body2,
    position: "sticky",
    top: 64,
    paddingTop: 12,
    [theme.breakpoints.down('md')]: {
      display: "none"
    }
  },
  commentToc: {
    width: 340
  },
  tocListing: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 12
  },
  commentTocListing: {
    paddingTop: 7,
    paddingBottom: 7
  },
  hidden: {
    display: "none"
  }, 
  postTitle: {
    fontSize: "1rem",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    color: theme.palette.grey[600],
    width: 220
  },
  loadMore: {
    paddingLeft: 12,
    paddingTop: 12
  },
  flagged: {
    color: theme.palette.error.main
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
});

const reduceCommentModeratorActions = (commentModeratorActions: CommentModeratorActionDisplay[]): CommentWithModeratorActions[] => {
  const allComments = commentModeratorActions.map(action => action.comment);
  const uniqueComments = uniqBy(allComments, comment => comment._id);
  const commentsWithActions = uniqueComments.map(comment => {
    const actionsWithoutComment = commentModeratorActions.filter(result => result.comment._id === comment._id).map(({ comment, ...remainingAction }) => remainingAction);
    return { comment, actions: actionsWithoutComment };
  });

  return commentsWithActions;
};

const tabs = new TupleSet(['sunshineNewUsers', 'allUsers', 'recentlyActive', 'moderatedComments'] as const);
type DashboardTabs = UnionOf<typeof tabs>;

const getCurrentView = (query: Record<string, string>): DashboardTabs => {
  const currentViewParam = query.view;

  // Can't use `.includes` or `.indexOf` since it's a readonly tuple with known values, so `string` isn't a type you can pass in to those!
  if (!currentViewParam || !tabs.has(currentViewParam)) return 'sunshineNewUsers';

  return currentViewParam;
};


const ModerationDashboard = ({ classes }: {
  classes: ClassesType
}) => {
  const { UsersReviewInfoCard, CommentsReviewTab, LoadMore, Loading, FirstContentIcons } = Components;
    
  const currentUser = useCurrentUser();

  const { history } = useNavigation();
  const { query, location } = useLocation();
  const currentView = getCurrentView(query);

  const changeView = (newView: DashboardTabs) => {
    history.push({
      ...location,
      search: qs.stringify({
        view: newView
      }),
      hash: ''
    });
  };
  
  const { results: usersToReview = [], totalCount: totalUsersToReviewCount, loadMoreProps, refetch, loading } = useMulti({
    terms: {view: "sunshineNewUsers", limit: 10},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    itemsPerPage: 50
  });

  const { results: allUsers = [], loadMoreProps: allUsersLoadMoreProps, refetch: refetchAllUsers } = useMulti({
    terms: {view: "allUsers", limit: 10},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    itemsPerPage: 50,
  });

  const { results: recentlyActiveUsers = [], loadMoreProps: recentlyActiveLoadMoreProps, refetch: refetchRecentlyActiveUsers } = useMulti({
    terms: {view: "recentlyActive", limit: 10},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    itemsPerPage: 50,
  });

  const { results: commentModeratorActions = [], loading: loadingCommentActions, totalCount: totalCommentActionCount, loadMoreProps: loadMoreCommentActionsProps } = useMulti({
    collectionName: 'CommentModeratorActions',
    fragmentName: 'CommentModeratorActionDisplay',
    terms: { view: 'activeCommentModeratorActions', limit: 10 },
    enableTotal: true
  });

  const commentsWithActions = reduceCommentModeratorActions(commentModeratorActions);

  if (!userIsAdminOrMod(currentUser)) {
    return null;
  }

  return (
    <div className={classes.page}>
      <div className={classes.row}>
        <div className={classNames({ [classes.hidden]: currentView !== 'sunshineNewUsers' })}>
          <div className={classes.toc}>
            {usersToReview.map(user => {
              return <div key={user._id} className={classNames(classes.tocListing, {[classes.flagged]: user.sunshineFlagged})}>
                <a href={`${location.pathname}${location.search ?? ''}#${user._id}`}>
                  {user.displayName} 
                  <FirstContentIcons user={user}/>
                </a>
              </div>
            })}
            <div className={classes.loadMore}>
              <LoadMore {...loadMoreProps}/>
            </div>
          </div>
        </div>
        <div className={classNames({ [classes.hidden]: currentView !== 'allUsers' })}>
          <div className={classes.toc}>
            {allUsers.map(user => {
              return <div key={user._id} className={classes.tocListing}>
                {user.displayName}
              </div>
            })}
            <div className={classes.loadMore}>
              <LoadMore {...allUsersLoadMoreProps}/>
            </div>
          </div>
        </div>
        <div className={classNames({ [classes.hidden]: currentView !== 'recentlyActive' })}>
          <div className={classes.toc}>
            {recentlyActiveUsers.map(user => {
              return <div key={user._id} className={classes.tocListing}>
                {user.displayName}
              </div>
            })}
            <div className={classes.loadMore}>
              <LoadMore {...recentlyActiveLoadMoreProps}/>
            </div>
          </div>
        </div>
        <div className={classNames({ [classes.hidden]: currentView !== 'moderatedComments' })}>
          <div className={classNames(classes.toc, classes.commentToc)}>
            {commentsWithActions.map(({ comment }) => {
              return <div key={comment._id} className={classNames(classes.tocListing, classes.commentTocListing)}>
                <a href={`${location.pathname}${location.search ?? ''}#${comment._id}`}>
                  <div className={classes.postTitle}>{comment.post?.title}</div>
                  <div>{comment.user?.displayName}</div>
                </a>
              </div>;
            })}
            <div className={classes.loadMore}>
              <LoadMore {...loadMoreCommentActionsProps}/>
            </div>
          </div>
        </div>
        <div className={classes.main}>
          <div className={classes.topBar}>
            <div 
              onClick={() => changeView("sunshineNewUsers")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: currentView === 'sunshineNewUsers' })} 
            >
              Unreviewed Users {loading ? <Loading/> : <>({totalUsersToReviewCount})</>}
            </div>
            <div 
              onClick={() => changeView("allUsers")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: currentView === 'allUsers' })} 
            >
              Reviewed Users
            </div>
            <div 
              onClick={() => changeView("recentlyActive")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: currentView === 'allUsers' })} 
            >
              Recently Active Users
            </div>
            <div
              onClick={() => changeView("moderatedComments")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: currentView === 'moderatedComments' })} 
            >
              Moderated Comments {loadingCommentActions ? <Loading/> : <>({totalCommentActionCount})</>}
            </div>
          </div>
          <div className={classNames({ [classes.hidden]: currentView !== 'sunshineNewUsers' })}>
            {usersToReview.map(user =>
              <div key={user._id} id={user._id}>
                <UsersReviewInfoCard user={user} refetch={refetch} currentUser={currentUser}/>
              </div>
            )}
          </div>
          <div className={classNames({ [classes.hidden]: currentView !== 'allUsers' })}>
            {allUsers.map(user =>
              // TODO: we probably want to display something different for already-reviewed users, since a bunch of the actions we can take only make sense for unreviewed users
              <div key={user._id}>
                <UsersReviewInfoCard user={user} refetch={refetchAllUsers} currentUser={currentUser}/>
              </div>
            )}
          </div>
          <div className={classNames({ [classes.hidden]: currentView !== 'recentlyActive' })}>
            {recentlyActiveUsers.map(user =>
              // TODO: we probably want to display something different for already-reviewed users, since a bunch of the actions we can take only make sense for unreviewed users
              <div key={user._id}>
                <UsersReviewInfoCard user={user} refetch={refetchRecentlyActiveUsers} currentUser={currentUser}/>
              </div>
            )}
          </div>
          <div className={classNames({ [classes.hidden]: currentView !== 'moderatedComments' })}>
            <CommentsReviewTab commentsWithActions={commentsWithActions} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ModerationDashboardComponent = registerComponent('ModerationDashboard', ModerationDashboard, { styles });

declare global {
  interface ComponentTypes {
    ModerationDashboard: typeof ModerationDashboardComponent
  }
}
