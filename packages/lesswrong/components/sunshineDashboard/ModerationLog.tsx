import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Comments } from '../../lib/collections/comments'
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper'
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { isMod } from '../../lib/collections/users/helpers';
import { forumSelect } from '../../lib/forumTypeUtils';
import type { Column } from '../vulcan-core/Datatable';
import { ModeratorActions } from '../../lib/collections/moderatorActions'

const shouldShowEndUserModerationToNonMods = forumSelect({
  EAForum: false,
  LessWrong: true,
  AlignmentForum: true,
  default: true,
})

const styles = (theme: JssStyles) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
  
    "& h1": {
      ...theme.typography.display3,
    },
  
    "& h2": {
      ...theme.typography.display2,
    },
  
    "& h3": {
      ...theme.typography.display1,
      marginTop: 0,
      marginBottom: "0.5em",
    },
  },
  section: {
    border: theme.palette.border.normal,
    padding: 10,
    marginBottom: 16,
    borderRadius: 2,
    background: theme.palette.background.pageActiveAreaBackground
  }
})


const DateDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  return <div>{document[column.name] && <Components.FormatDate date={document[column.name]}/>}</div>
}

const PostDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const post = document.post || document
  return <Link rel="nofollow" to={postGetPageUrl(post) + "#" + document._id }>{ post.title }</Link>
}

const UserDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const user = document.user || document
  return <div>
    <Components.UsersName user={user} nofollow />
  </div>
}

const DeletedByUserDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const user = document.deletedByUser || document.user || document
  return <span>
    <Components.UsersName user={user} nofollow />
  </span>
}


const BannedUsersDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const bannedUsers = document[column.name] ?? []
  return <div>
    { bannedUsers.map((userId: string) => <div key={userId}>
      <Components.UsersNameWrapper documentId={userId} nofollow />
      </div>)}
  </div>
}

const ModeratorTypeDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  return <div>{document[column.name]}</div>
}


const deletedCommentColumns: Column[] = [
  {
    name: 'user',
    component: UserDisplay,
  },
  {
    name: 'post',
    component: PostDisplay,
  },
  {
    name: 'deletedByUser',
    component: DeletedByUserDisplay,
  },
  {
    name: 'deletedDate',
    label: 'Deleted Date',
    component: DateDisplay,
  },
  {
    name:'deletedPublic',
    label:'Deleted Public'
  },
  {
    name:'deletedReason',
    label:'Reason'
  },
]

const moderatorActionColumns: Column[] = [
  {
    name: 'user',
    component: UserDisplay
  },
  {
    name: 'endedAt',
    component: DateDisplay,
  },
  {
    name: 'type',
    component: ModeratorTypeDisplay
  }
]

const usersBannedFromPostsColumns: Column[] = [
  {
    name: 'user',
    label: "Author",
    component: UserDisplay,
  },
  {
    name: '_id',
    label: 'Post',
    component: PostDisplay,
  },
  {
    name:'bannedUserIds',
    label:'Banned Users',
    component: BannedUsersDisplay
  },
]

const usersBannedFromUsersColumns: Column[] = [
  {
    name: '_id',
    component: UserDisplay,
  },
  {
    name:'bannedUserIds',
    label:'Banned From Frontpage',
    component: BannedUsersDisplay
  },
  {
    name:'bannedPersonalUserIds',
    label:'Banned from Personal Posts',
    component: BannedUsersDisplay
  },
]

const ModerationLog = ({classes}: {
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser()
  const shouldShowEndUserModeration = (currentUser && isMod(currentUser)) ||
    shouldShowEndUserModerationToNonMods
  const { SingleColumnSection } = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <h2>Moderation Log</h2>
      <div className={classes.section}>
        <h3>Deleted Comments</h3>
        <Components.Datatable
          collection={Comments}
          columns={deletedCommentColumns}
          options={{
            fragmentName: 'DeletedCommentsModerationLog',
            terms: {view: "allCommentsDeleted"},
            limit: 10,
            enableTotal: true
          }}
          showEdit={false}
        />
      </div>
      {shouldShowEndUserModeration && <>
        <div className={classNames(classes.section, classes.floatLeft)}>
          <h3>Users Banned From Posts</h3>
          <Components.Datatable
            collection={Posts}
            columns={usersBannedFromPostsColumns}
            options={{
              fragmentName: 'UsersBannedFromPostsModerationLog',
              terms: {view: "postsWithBannedUsers"},
              limit: 20,
              enableTotal: true
            }}
            showEdit={false}
            showNew={false}
          />
        </div>
        <div className={classNames(classes.section, classes.floatLeft)}>
          <h3>Users Banned From Users</h3>
          <Components.Datatable
            collection={Users}
            columns={usersBannedFromUsersColumns}
            options={{
              fragmentName: 'UsersBannedFromUsersModerationLog',
              terms: {view: "usersWithBannedUsers"},
              limit: 20,
              enableTotal: true
            }}
            showEdit={false}
            showNew={false}
          />
        </div>
        <div className={classes.section}>
          <h3>Moderated Users</h3>
          <Components.Datatable
            collection={ModeratorActions}
            columns={moderatorActionColumns}
            options={{
              terms: {view: "restrictionModerationActions"},
              fragmentName: 'ModeratorActionDisplay',
              limit: 20,
              enableTotal: true
            }}
            showEdit={false}
            showNew={false}
          />
        </div>
      </>}
    </SingleColumnSection>
  )
}

const ModerationLogComponent = registerComponent('ModerationLog', ModerationLog, {styles});

declare global {
  interface ComponentTypes {
    ModerationLog: typeof ModerationLogComponent
  }
}
