import React, { PureComponent } from 'react';
import { Components, withCurrentUser, AdminColumns, registerComponent } from 'meteor/vulcan:core';
import { Bans, LWEvents } from 'meteor/lesswrong';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import Users from 'meteor/vulcan:users';
import moment from 'moment';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

// import '../modules/columns.js';

import { addAdminColumn } from 'meteor/vulcan:core';

const UserIPsDisplay = ({column, document}) => {
  return <div>
    {document.IPs && document.IPs.map(ip => <div key={ip}>{ip}</div>)}
  </div>
}

const DateDisplay = ({column, document}) => {
  return <div>{document[column.name] && moment(document[column.name]).fromNow()}</div>
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

// columns={['_id', 'createdAt', 'expirationDate', 'type', 'user.username', 'ip']}
class AdminHome extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      sortUsersBy: {createdAt: -1},
      view: 'LWUsersAdmin',
      allUsersValue: 1,
    };
  }

  render() {
    return (
      <div className="admin-home page">
        <Components.ShowIf
          check={Users.isAdmin}
          document={this.props.currentUser}
          failureComponent={
            <p className="admin-home-message"><FormattedMessage id="app.noPermission" /></p>
          }
        >
          <div className="admin-home-layout">
            <h2>Admin Console</h2>
            <div>
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
                <DropDownMenu
                  value={this.state.allUsersValue}
                  onChange={this.handleChange}
                  openImmediately={true}
                >
                  <MenuItem value={1} primaryText="Created At (Descending)"
                    onTouchTap={(e) => {this.setState({allUsersValue:1, view:'LWUsersAdmin', sortUsersBy:{createdAt:-1}})}}/>
                  <MenuItem value={2} primaryText="Created At (Ascending)"
                    onTouchTap={(e) => {this.setState({allUsersValue:2, view:'LWUsersAdmin', sortUsersBy:{createdAt:1}})}}/>
                  <MenuItem value={3} primaryText="Karma (Descending)"
                    onTouchTap={(e) => {this.setState({allUsersValue:3, view:'LWUsersAdmin', sortUsersBy:{karma:-1}})}}/>
                  <MenuItem value={4} primaryText="Karma (Ascending)"
                    onTouchTap={(e) => {this.setState({allUsersValue:4, view:'LWUsersAdmin', sortUsersBy:{karma:1}})}}/>
                  <MenuItem value={5} primaryText="Sunshines"
                    onTouchTap={(e) => {this.setState({allUsersValue:5, view:'LWSunshinesList', sortUsersBy:{karma:1}})}} />
                  <MenuItem value={6} primaryText="TrustLevel1"
                    onTouchTap={(e) => {this.setState({allUsersValue:6, view:'LWTrustLevel1List', sortUsersBy:{karma:1}})}} />
                </DropDownMenu>
                <Components.Datatable
                  collection={Users}
                  columns={AdminColumns}
                  options={{
                    fragmentName: 'UsersAdmin',
                    terms: {view: this.state.view, sort:this.state.sortUsersBy},
                    limit: 20
                  }}
                  showEdit={true}
                  showNew={false}
                />
              </div>
              <div className="admin-new-ip-bans">
                <h3>New IP Bans</h3>
                <Components.SmartForm
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
        </Components.ShowIf>
      </div>
    )
  }
}

registerComponent('AdminHome', AdminHome, withCurrentUser);
