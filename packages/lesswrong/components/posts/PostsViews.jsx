import { Components, replaceComponent } from 'meteor/vulcan:core';
import { registerComponent, withCurrentUser, withEdit } from 'meteor/vulcan:core';
import React, { PropTypes, Component } from 'react';
import { intlShape } from 'meteor/vulcan:i18n';
import { withRouter, Link } from 'react-router'
import Chip from 'material-ui/Chip';
import FontIcon from 'material-ui/FontIcon';
import classnames from 'classnames';
import Users from 'meteor/vulcan:users';




const viewNames = {
  'frontpage': 'Frontpage',
  'curated': 'Curated Content',
  'community': 'Community',
  'meta': 'Meta',
  'pending': 'pending posts',
  'rejected': 'rejected posts',
  'scheduled': 'scheduled posts',
  'all_drafts': 'all drafts',
}
const defaultViews = ["curated", "frontpage"];
const defaultExpandedViews = ["community","meta"];

const ChipStyle = {
  display: "inline-block",
  backgroundColor: "transparent",
  fontSize: "16px",
  fontStyle: "normal",
  color: "rgba(0,0,0,0.5)",
  paddingLeft: "3px",
  paddingRight: "0px",
  lineHeight: "25px",
  cursor: "ponter"
}


class PostsViews extends Component {
  constructor(props) {
    super(props);
    const expandedViews = this.props.expandedViews || defaultExpandedViews;
    const currentView = this.getCurrentView();
    this.state = {
      expanded: !!expandedViews.includes(currentView),
    }
  }

  handleChange = (view) => {
    const { router } = this.props;
    const query = { ...router.location.query, view };
    const location = { pathname: router.location.pathname, query };
    router.replace(location);
    this.setState({ view });
    if (this.props.currentUser && router.location.pathname === "/") {
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {currentFrontpageFilter: view},
        unset: {}
      })
    }
  }

  showComments = () => {
    const { router } = this.props;
    const query = { ...router.location.query, comments: true };
    const location = { pathname: router.location.pathname, query};
    router.push(location);
    this.setState({view: "comments"});
  }

  getCurrentView = () => {
    const props = this.props;
    return _.clone(props.router.location.query).view || props.defaultView || (props.currentUser && props.currentUser.currentFrontpageFilter) || (this.props.currentUser ? "frontpage" : "curated");
  }

  render() {
    const props = this.props;
    const views = props.views || defaultViews;
    let expandedViews = props.expandedViews || defaultExpandedViews;
    const currentView = this.getCurrentView();
    // const adminViews = ["pending", "rejected", "scheduled", "all_drafts"];
    //
    // if (Users.canDo(this.props.currentUser, "posts.edit.all")) {
    //   expandedViews = expandedViews.concat(adminViews);
    // }

    return (
      <div className="posts-views">
        {views.map(view => (
          <div key={view} className={classnames("posts-view-button", {"posts-views-button-active": view === currentView, "posts-views-button-inactive": view !== currentView})}>
            <Components.RSSOutLinkbuilder view={view} />
            <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)}>
              <span className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>{viewNames[view]}</span>
            </span>
          </div>
        ))}
        {this.state.expanded ?
          <div>
            {expandedViews.map(view => (
              <div key={view} className={classnames("posts-view-button", {"posts-views-button-active": view === currentView, "posts-views-button-inactive": view !== currentView})}>
                <span > <Components.RSSOutLinkbuilder view={view} /> </span>
                <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)} >
                  <span className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>{viewNames[view]}</span>
                </span>
              </div>
            ))}
            {!props.hideDaily && <Link className="view-chip" to="/daily"> <span className={"posts-views-chip-inactive"}>Daily</span> </Link>}
          </div> : <div><a style={{textDecoration: "none"}} onClick={() => this.setState({expanded: true})}>...</a></div>
        }
      </div>
  )}
}

PostsViews.propTypes = {
  currentUser: React.PropTypes.object,
  defaultView: React.PropTypes.string
};

PostsViews.contextTypes = {
  currentRoute: React.PropTypes.object,
  intl: intlShape
};

PostsViews.displayName = "PostsViews";

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

replaceComponent('PostsViews', PostsViews, withRouter, withCurrentUser, [withEdit, withEditOptions]);
