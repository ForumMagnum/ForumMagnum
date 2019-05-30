import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'meteor/vulcan:i18n';
import { withRouter, Link } from '../../lib/reactRouterWrapper.js'
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Users from 'meteor/vulcan:users';
import postViewSections from '../../lib/sections.js'
import withUser from '../common/withUser';
import classNames from 'classnames';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

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

  postsViewButton: {
    [theme.breakpoints.down('sm')]: {
      "&::after": {
        content: "|",
        marginLeft: 5,
        marginRight: 5,
        fontStyle: "normal",
      },
      float: "left",
    }
  },

  viewChip: {
    display: "inline-block",
    backgroundColor: "transparent",
    fontSize: 16,
    fontStyle: "normal",
    color: "rgba(0,0,0,0.5)",
    paddingLeft: 3,
    paddingRight: 0,
    lineHeight: "25px",
    cursor: "pointer",
    textDecoration: "none !important",
    position: "relative",

    [theme.breakpoints.down('sm')]: {
      paddingLeft: "0px !important",
    },

    "&:hover $viewChipMenuWrapper": {
      display: "block",
    },
  },
  viewChipActive: {
    color: "rgba(0, 0, 0, .8) !important",
    textDecoration: "underline !important",
  },
  viewChipInactive: {
    "&:hover": {
      color: "rgba(0, 0, 0, .3)",
    }
  },
  viewChipMenuWrapper: {
    position: "absolute",
    borderRadius: 2,
    right: -266,
    top: -12,
    display: "none",
    textAlign: "left",
    zIndex: 1,
    paddingLeft: 5,

    [legacyBreakpoints.maxSmall]: {
      left: -25,
      top: 20,
    },

    "&:hover": {
      display: "block",
    },
  },
  viewChipMenu: {
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,.8)",
    boxShadow: "1px 1px 4px rgba(0,0,0,.2)",
    color: "rgba(255,255,255,.75)",
    width: 260,
    fontWeight: 300,
    lineHeight: "18px",
    fontSize: 12,
    padding: "10px 0",
    zIndex: 1,
  },
  viewChipMenuItem: {
    fontStyle: "normal",
    zIndex: 2,
    color: "rgba(255,255,255,.75)",
    textDecoration: "none",
    borderTop: "solid 1px rgba(255,255,255,.2)",
    padding: "5px 10px",
    "&:hover": {
      background: "rgba(255,255,255,.2)",
    }
  },
  viewDescription: {
    borderTop: "none",
    "&:hover": {
      background: "none"
    }
  },
  learnMore: {
    borderTop: "none",
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
      <div className={classes.viewChipMenuWrapper}>
        <div className={classes.viewChipMenu}>
          <div className={classNames(classes.viewChipMenuItem, classes.viewDescription)}>
            {viewData.categoryIcon && <Icon className={classnames("material-icons", classes.categoryIcon)}>
              {viewData.categoryIcon}
            </Icon>}
            {viewData.description}
          </div>
          { viewData.includes && <div className={classNames(classes.viewChipMenuItem, classes.viewDescription)}>{viewData.includes}</div>}
          { viewData.learnMoreLink && <div className={classNames(classes.viewChipMenuItem, classes.learnMore)}>
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
    const { classes } = this.props;
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
          <div key={view} className={classnames(classes.postsViewButton, {"posts-views-button-active": view === currentView, "posts-views-button-inactive": view !== currentView})}>

            <span className={classes.viewChip} onClick={() => this.handleChange(view)}>
              <Components.SectionSubtitle className={view === currentView ? classes.viewChipActive : classes.viewChipInactive}>
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
                    classes.postsViewButton,
                  {"posts-views-button-active": view === currentView, "posts-views-button-inactive": view !== currentView}
                )}
              >
                <span className={classes.viewChip} onClick={() => this.handleChange(view)} >
                  <Components.SectionSubtitle className={view === currentView ? classes.viewChipActive : classes.viewChipInactive}>
                    {postViewSections[view].label}
                    { this.renderMenu(postViewSections[view])}
                  </Components.SectionSubtitle>
                </span>
              </div>
            ))}
            {!props.hideDaily && <div className={classes.postsViewButton}><span className={classes.viewChip}>
              {/* TODO; Regression */}
              <Components.SectionSubtitle className={classes.viewChipInactive}>
                <Link to="/community">Community</Link> { this.renderMenu(postViewSections["meta"])}
              </Components.SectionSubtitle></span>
            </div>}
            {!props.hideDaily && <span className={classes.viewChip}>
              <Components.SectionSubtitle className={classes.viewChipInactive}>
                <Link to="/allPosts">All Posts</Link> { this.renderMenu(postViewSections["daily"])}
              </Components.SectionSubtitle>
            </span>}
          </span> : <span>
            <div className={classes.viewChip}
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
