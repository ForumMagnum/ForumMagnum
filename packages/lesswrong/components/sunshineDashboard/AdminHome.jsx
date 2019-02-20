import React, { PureComponent } from 'react';
import { Components, AdminColumns, registerComponent } from 'meteor/vulcan:core';
import { Bans } from '../../lib/collections/bans';
import { LWEvents } from '../../lib/collections/lwevents';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import Users from 'meteor/vulcan:users';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import withUser from '../common/withUser';

// import '../modules/columns.js';

import { addAdminColumn } from 'meteor/vulcan:core';

const UserIPsDisplay = ({column, document}) => {
  return <div>
    {document.IPs && document.IPs.map(ip => <div key={ip}>{ip}</div>)}
  </div>
}

const DateDisplay = ({column, document}) => {
  return <div>{document[column.name] && <Components.FormatDate date={document[column.name]}/>}</div>
}

const EventPropertiesDisplay = ({column, document}) => {
  return <div>
    {document[column.name] && document[column.name].ip},
    {document[column.name] && document[column.name].type}
  </div>
}

const UserDisplay = ({column, document}) => {
  return <div>
    <Components.UsersName user={document['user'] || document} />
  </div>
}

addAdminColumn([
  {
    name: 'username',
    component: UserDisplay,
    order:0,
  },
  {
    name: 'email',
    order:1,
  },
  {
    name: 'ips',
    component: UserIPsDisplay,
  },
  {
    name: 'createdAt',
    label: 'Create Date',
    component: DateDisplay,
    order:2,
  },
  {
    name: 'karma',
    order:3,
  },
  {
    name: 'groups',
    order:4,
  },
])
// Remove the ID and posts field from the users, so that the users fit in page reasonably
delete AdminColumns[0]
delete AdminColumns[1]

const eventColumns = [
  {
    name: 'createdAt',
    component: DateDisplay,
  },
  {
    name: 'properties',
    component: EventPropertiesDisplay,
  },
  'userId',
  {
    name: 'user',
    component: UserDisplay,
  }
]

const banColumns = [
  '_id',
  {
    name: 'createdAt',
    component: DateDisplay,
  },
  'ip',
  'reason',
  'comment',
  {
    name: 'expirationDate',
    component: DateDisplay,
  },
]

const adminViewsOfAllUsers = [
  {
    label: "Created At (Descending)",
    view: "LWUsersAdmin",
    sort: {createdAt:-1},
  },
  {
    label: "Created At (Ascending)",
    view: "LWUsersAdmin",
    sort: {createdAt:1},
  },
  {
    label: "Karm (Descending)",
    view: "LWUsersAdmin",
    sort: {karma:-1},
  },
  {
    label: "Karma (Ascending)",
    view: "LWUsersAdmin",
    sort: {karma:1},
  },
  {
    label: "Sunshines",
    view: "LWSunshinesList",
    sort: {karma:1},
  },
  {
    label: "TrustLevel1",
    view: "LWTrustLevel1List",
    sort: {karma:1},
  },
];

// columns={['_id', 'createdAt', 'expirationDate', 'type', 'user.username', 'ip']}
class AdminHome extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      allUsersValue: 0,
    };
  }

  render() {
    const { currentUser } = this.props;
    
    if (!Users.isAdmin(currentUser)) {
      return (
        <div className="admin-home page">
          <p className="admin-home-message"><FormattedMessage id="app.noPermission" /></p>
        </div>
      );
    }
    
    return (
      <div className="admin-home page">
        <div className="admin-home-layout">
          <h2>Admin Console</h2>
          <div>
            <div>
              <h3>Server Information</h3>
              <Components.AdminMetadata/>
            </div>
            <div className="admin-recent-logins">
              <h3>Recent Logins</h3>
              <Components.Datatable
                collection={LWEvents}
                columns={eventColumns}
                options={{
                  fragmentName: 'lwEventsAdminPageFragment',
                  terms: {view: 'adminView', name: 'login'},
                  limit: 10,
                }}
              />
            </div>
            <div className="admin-all-users">
              <h3>All Users</h3>
              <Select
                value={this.state.allUsersValue}
                onChange={(event) => {
                  this.setState({allUsersValue: event.target.value});
                }}
              >
                {adminViewsOfAllUsers.map((userView, i) =>
                  <MenuItem key={i} value={i}>
                    {userView.label}
                  </MenuItem>
                )}
              </Select>
              <Components.Datatable
                collection={Users}
                columns={AdminColumns}
                options={{
                  fragmentName: 'UsersAdmin',
                  terms: {
                    view: adminViewsOfAllUsers[this.state.allUsersValue].view,
                    sort: adminViewsOfAllUsers[this.state.allUsersValue].sort,
                  },
                  limit: 20
                }}
                showEdit={true}
                showNew={false}
              />
            </div>
            <div className="admin-new-ip-bans">
              <h3>New IP Bans</h3>
              <Components.WrappedSmartForm
                collection={Bans}
              />
            </div>
            <div className="admin-current-ip-bans">
              <h3>Current IP Bans</h3>
              <Components.Datatable
                collection={Bans}
                columns={banColumns}
                options={{
                  fragmentName: 'BansAdminPageFragment',
                  terms: {},
                  limit: 10,
                }}
                showEdit={true}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

registerComponent('AdminHome', AdminHome, withUser);
