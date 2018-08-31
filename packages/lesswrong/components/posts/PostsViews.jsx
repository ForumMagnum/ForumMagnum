import { Components, registerComponent, withCurrentUser, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'meteor/vulcan:i18n';
import { withRouter, Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import classnames from 'classnames';
import Users from 'meteor/vulcan:users';

const viewDataDict = {
  'frontpage': {
    label:'Frontpage Posts',
    description: "Posts meeting our frontpage guidelines:\n • interesting, insightful, useful\n • aim to explain, not to persuade\n • avoid meta discussion \n • relevant to people whether or not they \nare involved with the EA community.",
    includes: "(includes curated content and frontpage posts)",
    rssView: "frontpage-rss",
    rss:true
  },
  'community': {
    label: 'All Posts',
    description: "Includes personal and meta blogposts\n (as well as curated and frontpage).",
    categoryIcon:"person",
    rssView: "all-posts-rss",
    rss:true
  },
  'meta': {
    label: 'Community',
    description: "Discussion about the EA Community and the EA Forum itself",
    categoryIcon:"details",
    rssView: "community-rss",
    rss:true
  },
  'daily': {
    label: 'Daily',
    description: "Daily - All posts on the EA Forum, sorted by date",
    rss:false
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
// TODO replace list with single value
const defaultViews = ["frontpage"];
const defaultExpandedViews = ["community"];

const ChipStyle = {
  display: "inline-block",
  backgroundColor: "transparent",
  fontSize: "16px",
  fontStyle: "italic",
  color: "rgba(0, 0, 0, .45)",
  paddingLeft: "3px",
  paddingRight: "0px",
  lineHeight: "25px",
  cursor: "pointer",
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

  getCurrentView = () => {
    const props = this.props;
    return _.clone(props.router.location.query).view || props.defaultView || (props.currentUser && props.currentUser.currentFrontpageFilter) || "frontpage";
  }

  renderMenu = (viewData, view) => {
    return (
      <div className="view-chip-menu-wrapper">
        <div className="view-chip-menu">
          <div className="view-chip-menu-item description">
            <FontIcon style={{fontSize: "14px", color: "white", verticalAlign: "middle", bottom: "1px", marginRight:"2px"}} className="material-icons">
              {viewData.categoryIcon}
            </FontIcon>
            {viewData.description}
          </div>
          { viewData.includes && <div className="view-chip-menu-item includes">{viewData.includes}</div>}
          { viewData.learnMoreLink && <div className="view-chip-menu-item learn-more">
            <Link to={viewData.learnMoreLink}>
              <FontIcon className="material-icons" style={{fontSize: "14px", color: "white", top: "2px", marginRight:"1px"}}>help</FontIcon><span style={{color:"white"}}> Learn More</span>
            </Link>
          </div>}
          { viewData.rss && <div className="view-chip-menu-item"><Components.RSSOutLinkbuilder view={viewData.rssView} /></div> }
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
              <Components.SectionSubtitle className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>
                {viewDataDict[view].label}
                { this.renderMenu(viewDataDict[view], view)}
              </Components.SectionSubtitle>
            </span>
          </div>
        ))}
        {(this.state.expanded || this.props.currentUser) ?
          <span>
            {expandedViews.map(view => (
              <div
                key={view}
                className={classnames(
                    "posts-view-button",
                  {"posts-views-button-active": view === currentView, "posts-views-button-inactive": view !== currentView}
                )}
              >
                <span style={ChipStyle} className="view-chip" onClick={() => this.handleChange(view)} >
                  <Components.SectionSubtitle className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>
                    {viewDataDict[view].label}
                    { this.renderMenu(viewDataDict[view])}
                  </Components.SectionSubtitle>
                </span>
              </div>
            ))}
            {!props.hideDaily && <div className="posts-view-button"><span style={ChipStyle} className="view-chip">
              <Components.SectionSubtitle className={"posts-views-chip-inactive"}>
                <Link to="/meta">Meta { this.renderMenu(viewDataDict["meta"])}</Link>
              </Components.SectionSubtitle></span>
            </div>}
            {!props.hideDaily && <span style={ChipStyle} className="view-chip">
              <Components.SectionSubtitle className={"posts-views-chip-inactive"}>
                <Link to="/daily">Daily { this.renderMenu(viewDataDict["daily"])}</Link>
              </Components.SectionSubtitle>
            </span>}
          </span> : <span>
            <a style={ChipStyle} className="view-chip more"
              onClick={() => this.setState({expanded: true})}>
              ...
              { this.renderMenu(viewDataDict["more"])}
            </a>
          </span>
        }
        <br/>
      </div>
    )}
    }

PostsViews.propTypes = {
  currentUser: PropTypes.object,
  defaultView: PropTypes.string
};

PostsViews.contextTypes = {
  currentRoute: PropTypes.object,
  intl: intlShape
};

PostsViews.displayName = "PostsViews";

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('PostsViews', PostsViews, withRouter, withCurrentUser, [withEdit, withEditOptions]);
