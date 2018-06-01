import React, { Component } from 'react';
import { Components, registerComponent, withCurrentUser , withEdit} from 'meteor/vulcan:core';
import Reports from '../../lib/collections/reports/collection.js'
import FlatButton from 'material-ui/FlatButton';
import Users from 'meteor/vulcan:users';
import { Error404 } from 'meteor/vulcan:core';

const UserRenderer = (props) => <Components.UsersName user={props.document.user} />

const ClaimedUserRenderer = (props) => {
  if (props.document.claimedUser) {
    return <Components.UsersName user={props.document.claimedUser} />
  } else {
    return <div>None</div>
  }
}

const LinkRenderer = (props) => {
  return (
    <a href={props.document.link}>Link</a>
  )
}

const SunshineDashboard = (props, context) => {
    const editMutation = props.editMutation;
    const currentUser = props.currentUser;
    const claimButton = (props) => {
      const handleTouchTap = () => {
        editMutation({
          documentId: props.document._id,
          set: {claimedUserId: currentUser._id},
          unset: {}
        })
      }
      return <FlatButton label="Claim" onTouchTap={handleTouchTap} />
    }
    const columns = [
      { name: 'user',
        component: UserRenderer
      },
      { name: 'link',
        component: LinkRenderer
      },
      'description',
      { name: 'claimedUser',
        component: ClaimedUserRenderer,
      },
      { name: 'claimButton',
        component: claimButton,
      }
    ]
    if (Users.canDo(props.currentUser, "posts.moderate.all")) {
      return (
        <div className="sunshine-dashboard">
          <h1>Sunshine Dashboard</h1>
          <h3>Unclaimed Reports</h3>
          <Components.Datatable
            showEdit={true}
            collection={Reports}
            columns={columns}
            options={{
              fragmentName: 'unclaimedReportsList',
              terms: {view: 'unclaimedReports'},
              limit: 20
            }}
          />
        </div>
      )
    } else {
      return <Error404/>
    }
  }

const withEditOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
}

registerComponent('SunshineDashboard', SunshineDashboard, [withEdit, withEditOptions], withCurrentUser);
