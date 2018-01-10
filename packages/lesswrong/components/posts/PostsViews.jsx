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
  'curated': {
    label: "Curated Content",
    description: "Curated - Recent, high quality posts selected \nby the LessWrong moderation team.",
    learnMoreLink: "/posts/tKTcrnKn2YSdxkxKG/frontpage-posting-and-commenting-guidelines",
    categoryIcon:"star",
    rss:true
  },
  'frontpage': {
    label:'Frontpage Posts',
    description: "Posts meeting our frontpage guidelines:\n • interesting, insightful, useful\n • aim to explain, not to persuade\n • avoid meta discussion \n • relevant to people whether or not they \nare involved with the LessWrong community.",
    learnMoreLink: "/posts/tKTcrnKn2YSdxkxKG/frontpage-posting-and-commenting-guidelines",
    includes: "(includes curated content and frontpage posts)",
    rss:true
  },
  'community': {
    label: 'Community',
    description: "Community - All personal blogposts by \nLessWrong users (plus curated and frontpage).",
    learnMoreLink: "/posts/tKTcrnKn2YSdxkxKG/frontpage-posting-and-commenting-guidelines",
    categoryIcon:"person",
    rss:true
  },
  'meta': {
    label: 'Meta',
    description: "Meta - Discussion about the LessWrong site.",
    categoryIcon:"details",
    rss:true
  },
  'daily': {
    label: 'Daily',
    description: "Daily - All posts on LessWrong, sorted by date",
    rss:true
  },
  'more': {
    label: '...',
    description: "See more options",
    rss:false
  },
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
  color: "rgba(100, 169, 105, 1)",
  paddingLeft: "3px",
  paddingRight: "0px",
  lineHeight: "25px",
  cursor: "ponter",
  textDecoration: "none"
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

  renderMenu = (view) => {
    return (
      <div className="view-chip-menu-wrapper">
        <div className="view-chip-menu">
          <div className="view-chip-menu-item description">
            <FontIcon style={{fontSize: "14px", color: "white", verticalAlign: "middle", bottom: "1px", marginRight:"2px"}} className="material-icons">
              {view.categoryIcon}
            </FontIcon>
            {view.description}
          </div>
          { view.includes && <div className="view-chip-menu-item includes">{view.includes}</div>}

          { view.learnMoreLink && <div className="view-chip-menu-item learn-more">
            <Link to={view.learnMoreLink}>
              <FontIcon className="material-icons" style={{fontSize: "14px", color: "white", top: "2px", marginRight:"1px"}}>help</FontIcon><span style={{color:"white"}}> Learn More</span>
            </Link>
          </div>}
          { view.rss && <div className="view-chip-menu-item"><Components.RSSOutLinkbuilder view={view} /></div> }
        </div>
      </div>
    )
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

            <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)}>
              <span className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>
                {viewNames[view].label}
                { this.renderMenu(viewNames[view])}
              </span>
            </span>
          </div>
        ))}
        {this.state.expanded ?
          <div>
            {expandedViews.map(view => (
              <div
                key={view}
                className={classnames(
                    "posts-view-button",
                  {"posts-views-button-active": view === currentView, "posts-views-button-inactive": view !== currentView}
                )}
              >
                <span >  </span>
                <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)} >
                  <span className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>
                    {viewNames[view].label}
                    { this.renderMenu(viewNames[view])}
                  </span>
                </span>
              </div>
            ))}
            {!props.hideDaily && <Link style={ChipStyle} className="view-chip" to="/daily">
              <span className={"posts-views-chip-inactive"}>
                Daily { this.renderMenu(viewNames["daily"])}
              </span>
            </Link>}
          </div> : <div>
            <a style={ChipStyle} className="view-chip more"
              onClick={() => this.setState({expanded: true})}>
              ...
              { this.renderMenu(viewNames["more"])}
            </a>
          </div>
        }
        <br/>
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
