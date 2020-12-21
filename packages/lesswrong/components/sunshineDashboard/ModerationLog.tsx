import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Comments } from '../../lib/collections/comments'
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper'
import { styles } from './AdminHome';
import classNames from 'classnames';

const DateDisplay = ({column, document}) => {
  return <div>{document[column.name] && <Components.FormatDate date={document[column.name]}/>}</div>
}

const PostDisplay = ({column, document}) => {
  const post = document.post || document
  return <Link rel="nofollow" to={postGetPageUrl(post) + "#" + document._id }>{ post.title }</Link>
}

const UserDisplay = ({column, document}) => {
  const user = document.user || document
  return <div>
    <Components.UsersName user={user} nofollow />
  </div>
}

const DeletedByUserDisplay = ({column, document}) => {
  const user = document.deletedByUser || document.user || document
  return <div>
    <Components.UsersName user={user} nofollow />
  </div>
}


const BannedUsersDisplay = ({column, document}) => {
  const bannedUsers = document[column.name]
  return <div>
    { bannedUsers.map((userId) => <div key={userId}>
      <Components.UsersNameWrapper documentId={userId} nofollow />
      </div>)}
  </div>
}


const deletedCommentColumns = [
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

const usersBannedFromPostsColumns = [
  {
    name: 'user',
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

const usersBannedFromUsersColumns = [
  {
    name: '_id',
    component: UserDisplay,
  },
  {
    name:'bannedUserIds',
    label:'Banned Users',
    component: BannedUsersDisplay
  },
]

class ModerationLog extends PureComponent<any> {

  constructor(props) {
    super(props);
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.adminHomeOrModerationLogPage}>
        <h2>Moderation Log</h2>
        <div className={classes.adminLogGroup}>
          <h3>Deleted Comments</h3>
          <Components.Datatable
            collection={Comments}
            columns={deletedCommentColumns}
            options={{
              fragmentName: 'DeletedCommentsModerationLog',
              terms: {view: "allCommentsDeleted"},
              limit: 10,
            }}
            showEdit={false}
          />
        </div>
        <div className={classNames(classes.adminLogGroup, classes.floatLeft)}>
          <h3>Users Banned From Posts</h3>
          <Components.Datatable
            collection={Posts}
            columns={usersBannedFromPostsColumns}
            options={{
              fragmentName: 'UsersBannedFromPostsModerationLog',
              terms: {view: "postsWithBannedUsers"},
              limit: 10,
            }}
            showEdit={false}
            showNew={false}
          />
        </div>
        <div className={classNames(classes.adminLogGroup, classes.floatLeft)}>
          <h3>Users Banned From Users</h3>
          <Components.Datatable
            collection={Users}
            columns={usersBannedFromUsersColumns}
            options={{
              fragmentName: 'UsersBannedFromUsersModerationLog',
              terms: {view: "usersWithBannedUsers"},
              limit: 10,
            }}
            showEdit={false}
            showNew={false}
          />
        </div>
      </div>
    )
  }
}

const ModerationLogComponent = registerComponent('ModerationLog', ModerationLog, {styles});

declare global {
  interface ComponentTypes {
    ModerationLog: typeof ModerationLogComponent
  }
}
