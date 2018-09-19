import { Components, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'meteor/vulcan:i18n';
import { withRouter, Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import classnames from 'classnames';
import Users from 'meteor/vulcan:users';
import postViewSections from '../../lib/sections.js'
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';

const defaultViews = ["curated", "frontpage"];
const defaultExpandedViews = ["community"];


class PostsViews extends Component {
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
    return _.clone(props.router.location.query).view || props.defaultView || (props.currentUser && props.currentUser.currentFrontpageFilter) || (this.props.currentUser ? "frontpage" : "curated");
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
              <Components.SectionSubtitle className={"posts-views-chip-inactive"}>
                <Link to="/meta">Meta</Link> { this.renderMenu(postViewSections["meta"])}
              </Components.SectionSubtitle></span>
            </div>}
            {!props.hideDaily && <span className="view-chip">
              <Components.SectionSubtitle className={"posts-views-chip-inactive"}>
                <Link to="/daily">Daily</Link> { this.renderMenu(postViewSections["daily"])}
              </Components.SectionSubtitle>
            </span>}
          </span> : <span>
            <a className="view-chip more"
              onClick={() => this.setState({expanded: true})}>
              ...
              { this.renderMenu(postViewSections["more"])}
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

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

export default defineComponent({
  name: 'PostsViews',
  component: PostsViews,
  hocs: [ withRouter, withUser, [withEdit, withEditOptions] ]
});
