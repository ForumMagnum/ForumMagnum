import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Bans } from 'meteor/lesswrong';
import { Posts, Comments } from "meteor/example-forum";
import moment from 'moment';
import { Link } from 'react-router'

const DateDisplay = ({column, document}) => {
  return <div>{document[column.name] && moment(document[column.name]).fromNow()}</div>
}

const PostDisplay = ({column, document}) => {
  const post = document['post']
  return <Link to={Posts.getPageUrl(post) + "#" + document._id }>{ post.title }</Link>
}

const UserDisplay = ({column, document}) => {
  return <div>
    <Components.UsersName user={document['user'] || document} />
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
    component: UserDisplay,
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

class ModerationLog extends PureComponent {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="moderation-log">
        <h2>Moderation Log</h2>
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
    )
  }
}

registerComponent('ModerationLog', ModerationLog);
