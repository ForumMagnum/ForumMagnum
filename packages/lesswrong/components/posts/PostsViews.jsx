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
    const currentView = _.clone(props.router.location.query).view || (props.currentUser && props.currentUser.currentFrontpageFilter) || props.defaultView || (this.props.currentUser ? "frontpage" : "curated");
    this.state = {
      view: currentView,
      expanded: !!expandedViews.includes(currentView),
    }
  }

  handleChange = (view) => {
    const { router } = this.props;
    const query = { ...router.location.query, view };
    const location = { pathname: router.location.pathname, query };
    router.replace(location);
    this.setState({ view });
    if (this.props.currentUser) {
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

  render() {
    const views = this.props.views || defaultViews;
    let expandedViews = this.props.expandedViews || defaultExpandedViews;
    // const adminViews = ["pending", "rejected", "scheduled", "all_drafts"];
    //
    // if (Users.canDo(this.props.currentUser, "posts.edit.all")) {
    //   expandedViews = expandedViews.concat(adminViews);
    // }

    return (
      <div className="posts-views">
        {views.map(view => (
          <div key={view} className={classnames("posts-view-button", {"posts-views-button-active": view === this.state.view, "posts-views-button-inactive": view !== this.state.view})}>
            <Components.RSSOutLinkbuilder view={view} />
            <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)}>
              <span className={view === this.state.view ? "posts-views-chip-active" : "posts-views-chip-inactive"}>{viewNames[view]}</span>
            </span>
          </div>
        ))}
        {this.state.expanded ?
          <div>
            {expandedViews.map(view => (
              <div key={view} className={classnames("posts-view-button", {"posts-views-button-active": view === this.state.view, "posts-views-button-inactive": view !== this.state.view})}>
                <span > <Components.RSSOutLinkbuilder view={view} /> </span>
                <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)} >
                  <span className={view === this.state.view ? "posts-views-chip-active" : "posts-views-chip-inactive"}>{viewNames[view]}</span>
                </span>
              </div>
            ))}
            <Link className="view-chip" to="/daily"> <span className={"posts-views-chip-inactive"}>Daily</span> </Link>
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
