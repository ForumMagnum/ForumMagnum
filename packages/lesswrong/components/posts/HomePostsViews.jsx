import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'meteor/vulcan:i18n';
import { withRouter, Link } from 'react-router'
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Users from 'meteor/vulcan:users';
import postViewSections from '../../lib/sections.js'
import withUser from '../common/withUser';

const defaultViews = ["frontpage"];
const defaultExpandedViews = [];

const styles = theme => ({
  categoryIcon: {
    position: "relative",
    fontSize: "14px",
    color: "white",
    verticalAlign: "middle",
    bottom: 1,
    marginRight: 2
  },

  helpIcon: {
    position: "relative",
    fontSize: "14px",
    color: "white",
    top: 2,
    marginRight: 1,
  },
});


class HomePostsViews extends Component {
  constructor(props) {
    super(props);
    const expandedViews = this.props.expandedViews || defaultExpandedViews;
    const currentView = this.getCurrentView();
    this.state = {
      expanded: !!expandedViews.includes(currentView),
    }
  }

  handleChange = (view, event) => {
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
    const { classes } = this.props;
    return (
      <div className="view-chip-menu-wrapper">
        <div className="view-chip-menu">
          <div className="view-chip-menu-item description">
            {viewData.categoryIcon && <Icon className={classnames("material-icons", classes.categoryIcon)}>
              {viewData.categoryIcon}
            </Icon>}
            {viewData.description}
          </div>
          { viewData.includes && <div className="view-chip-menu-item includes">{viewData.includes}</div>}
          { viewData.learnMoreLink && <div className="view-chip-menu-item learn-more">
            <Link to={viewData.learnMoreLink}>
              <Icon className={classnames("material-icons", classes.helpIcon)}>help</Icon>
              <span style={{color:"white"}}> Learn More</span>
            </Link>
          </div>}
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

            <span className="view-chip" onClick={() => this.handleChange(view)}>
              <Components.SectionSubtitle className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>
                {postViewSections[view].label}
                { this.renderMenu(postViewSections[view], view)}
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
                <span className="view-chip" onClick={() => this.handleChange(view)} >
                  <Components.SectionSubtitle className={view === currentView ? "posts-views-chip-active" : "posts-views-chip-inactive"}>
                    {postViewSections[view].label}
                    { this.renderMenu(postViewSections[view])}
                  </Components.SectionSubtitle>
                </span>
              </div>
            ))}
            {!props.hideDaily && <div className="posts-view-button"><span className="view-chip">
              {/* TODO; Regression */}
              <Components.SectionSubtitle className={"posts-views-chip-inactive"}>
                <Link to="/community">Community</Link> { this.renderMenu(postViewSections["meta"])}
              </Components.SectionSubtitle></span>
            </div>}
            {!props.hideDaily && <span className="view-chip">
              <Components.SectionSubtitle className={"posts-views-chip-inactive"}>
                <Link to="/allPosts">Daily</Link> { this.renderMenu(postViewSections["daily"])}
              </Components.SectionSubtitle>
            </span>}
          </span> : <span>
            <div className="view-chip more"
              onClick={() => this.setState({expanded: true})}>
              ...
              { this.renderMenu(postViewSections["more"])}
            </div>
          </span>
        }
        <br/>
      </div>
    )
  }
}

HomePostsViews.propTypes = {
  currentUser: PropTypes.object,
  defaultView: PropTypes.string
};

HomePostsViews.contextTypes = {
  currentRoute: PropTypes.object,
  intl: intlShape
};

HomePostsViews.displayName = "HomePostsViews";

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('HomePostsViews', HomePostsViews, withRouter, withUser, [withEdit, withEditOptions],
  withStyles(styles, { name: "HomePostsViews" }));
