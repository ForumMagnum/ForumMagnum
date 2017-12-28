import { Components, replaceComponent } from 'meteor/vulcan:core';
import { registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { PropTypes, Component } from 'react';
import { intlShape } from 'meteor/vulcan:i18n';
import { withRouter } from 'react-router'
import Chip from 'material-ui/Chip';
import FontIcon from 'material-ui/FontIcon';
import classNames from 'classnames';




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
const views = ["curated", "frontpage"];
const expandedViews = ["community","meta"];

const ChipLabelStyle = {
  fontSize: "16px",
  fontStyle: "normal",
  color: "rgba(0,0,0,0.5)",
  paddingLeft: "3px",
  paddingRight: "0px",
  lineHeight: "25px",
};

const ChipStyle = {
  display: "inline-block",
  backgroundColor: "transparent",
}

const RSSIconStyle = {
  fontSize: "14px",
  color: "rgba(0,0,0,0.6)",
  top: "1px",
}

class PostsViews extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: _.clone(props.router.location.query).view || (this.props.currentUser ? "frontpage" : "curated"),
      expanded: !!expandedViews.includes(props.router.location.query.view),
    }
  }

  handleChange = (view) => {
    const { router } = this.props;
    const query = { ...router.location.query, view };
    const location = { pathname: router.location.pathname, query };
    router.replace(location);
    this.setState({ view });
  }

  showComments = () => {
    const { router } = this.props;
    const query = { ...router.location.query, comments: true };
    const location = { pathname: router.location.pathname, query};
    router.push(location);
    this.setState({view: "comments"});
  }

  render() {
    // const adminViews = ["pending", "rejected", "scheduled", "all_drafts"];

    // if (Users.canDo(props.currentUser, "posts.edit.own")
    // || Users.canDo(props.currentUser, "posts.edit.all")) {
    //   views = views.concat(["drafts"]);
    // }

    // if (Users.canDo(props.currentUser, "posts.edit.all")) {
    //   views = views.concat(adminViews);
    // }

    return (
      <div className="posts-views">
        {views.map(view => (
          <div>
            <span className={classNames("rss-subscribe",{visible: view === this.state.view, invisible: !(view === this.state.view)})}> <FontIcon className="material-icons" style={RSSIconStyle}>rss_feed</FontIcon> </span>
            <Chip style={ChipStyle} labelStyle={ChipLabelStyle} className="view-chip" onClick={() => this.handleChange(view)} key={view}>
              <span className={view === this.state.view ? "posts-views-chip-active" : "posts-views-chip-inactive"}>{viewNames[view]}</span>
            </Chip>
          </div>
        ))}
        {this.state.expanded ?
          <div>
            {expandedViews.map(view => (
              <div>
                {view === this.state.view && <FontIcon style={RSSIconStyle} className="material-icons">rss_feed</FontIcon>}
                <Chip style={ChipStyle} labelStyle={ChipLabelStyle} className="view-chip" onClick={() => this.handleChange(view)} key={view}>
                  <span className={view === this.state.view ? "posts-views-chip-active" : "posts-views-chip-inactive"}>{viewNames[view]}</span>
                </Chip>
              </div>
            ))}
            <Chip className="view-chip" style={ChipStyle} labelStyle={ChipLabelStyle} onClick={() => this.props.router.push("/daily")}> <span className={"posts-views-chip-inactive"}>Daily</span> </Chip>
          </div> : <div><a style={{textDecoration: "none"}} onClick={() => this.setState({expanded: true})}>...</a></div>
        }
      </div>
  )}
}

PostsViews.propTypes = {
  currentUser: React.PropTypes.object,
  defaultView: React.PropTypes.string
};

PostsViews.defaultProps = {
  defaultView: "top"
};

PostsViews.contextTypes = {
  currentRoute: React.PropTypes.object,
  intl: intlShape
};

PostsViews.displayName = "PostsViews";

replaceComponent('PostsViews', PostsViews, withRouter, withCurrentUser);
