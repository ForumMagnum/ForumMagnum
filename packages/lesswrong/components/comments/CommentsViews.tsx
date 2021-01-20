import { registerComponent } from '../../lib/vulcan-lib';
import React, { Component } from 'react';
import { withLocation, withNavigation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import withUser from '../common/withUser';
import qs from 'qs'
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';

export const viewNames: Partial<Record<string,string>> = {
  'postCommentsTop': 'top scoring',
  'afPostCommentsTop': 'top scoring',
  'postCommentsNew': 'newest',
  'postCommentsOld': 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postCommentsSpam': 'spam',
  'postCommentsReported': 'reported',
  'postLWComments': 'top scoring (include LW)',
}

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'inline'
  },
  link: {
    color: theme.palette.lwTertiary.main,
  }
})

interface ExternalProps {
  post?: PostsDetails,
}
interface CommentsViewsProps extends ExternalProps, WithUserProps, WithStylesProps, WithLocationProps, WithNavigationProps {
}
interface CommentsViewsState {
  anchorEl: any,
}

class CommentsViews extends Component<CommentsViewsProps,CommentsViewsState> {
  constructor(props: CommentsViewsProps) {
    super(props);
    this.state = {
      anchorEl: null,
    }
  }

  handleClick = (event: React.MouseEvent) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleViewClick = (view: string) => {
    const { post } = this.props;
    const { history, location } = this.props; // From withNavigation, withLocation
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? {view: 'postCommentsTop'} : query
    this.setState({ anchorEl: null })
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  handleClose = () => {
    this.setState({ anchorEl: null })
  }

  render() {
    const { currentUser, classes, post } = this.props
    const { query } = this.props.location;
    const { anchorEl } = this.state
    const commentsTopView = forumTypeSetting.get() === 'AlignmentForum' ? "afPostCommentsTop" : "postCommentsTop"
    let views = [commentsTopView, "postCommentsNew", "postCommentsOld"]
    const adminViews = ["postCommentsDeleted", "postCommentsSpam", "postCommentsReported"]
    const afViews = ["postLWComments"]
    const currentView: string = query?.view || commentGetDefaultView(post||null, currentUser)

    if (userCanDo(currentUser, "comments.softRemove.all")) {
      views = views.concat(adminViews);
    }

    const af = forumTypeSetting.get() === 'AlignmentForum'
    if (af) {
      views = views.concat(afViews);
    }

    return (
      <div className={classes.root}>
        <a className={classes.link} onClick={this.handleClick}>
          {viewNames[currentView]}
        </a>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {views.map((view: string) => {
            return(
              <MenuItem
                key={view}
                onClick={() => this.handleViewClick(view)}
              >
                {viewNames[view]}
              </MenuItem>)})}
        </Menu>
      </div>
  )}
};

const CommentsViewsComponent = registerComponent<ExternalProps>('CommentsViews', CommentsViews, {
  styles,
  hocs: [withLocation, withNavigation, withUser],
});

declare global {
  interface ComponentTypes {
    CommentsViews: typeof CommentsViewsComponent,
  }
}

