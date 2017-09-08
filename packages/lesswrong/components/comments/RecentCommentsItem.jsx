import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import moment from 'moment';
import Comments from "meteor/vulcan:comments";
import Posts from 'meteor/vulcan:posts';
import { Link } from 'react-router';

import Paper from 'material-ui/Paper';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

import Truncate from 'react-truncate-html';



const paperStyle = {
  padding: '10px',
  backgroundColor: 'transparent',
}

const moreActionsMenuStyle = {
  position: 'inherit',
}

const moreActionsMenuButtonStyle = {
  padding: '0px',
  width: 'auto',
  height: 'auto',
}

const moreActionsMenuIconStyle = {
  padding: '0px',
  width: '16px',
  height: '16px',
  color: 'rgba(0,0,0,0.5)',
}


class RecentCommentsItem extends getRawComponent('CommentsItem') {
  constructor(props) {
    super(props);
    this.state = {
      showReply: false,
      showEdit: false,
      expanded: false,
    };
  }

  render() {
    const comment = this.props.comment;

    return (
      <Paper
        className="comments-item recent-comments-item"
        style={paperStyle}
        zDepth={0}
        id={comment._id}
      >
        <div className="comments-item-body recent-comments-item-body ">
          <object><div className="comments-item-meta recent-comments-item-meta">
            <Components.UsersName user={comment.user}/>
            <div className="comments-item-vote recent-comments-item-vote ">
              <Components.Vote collection={Comments} document={comment} currentUser={this.props.currentUser}/>
            </div>
            <div className="comments-item-date">{moment(new Date(comment.postedAt)).fromNow()}</div>
            <Link to={Posts.getPageUrl(comment.post) + "/" + comment._id}> <div className="comments-item-origin">
              on <span className="comments-item-origin-post-title">{comment.post.title}</span>
            </div> </Link>
          </div></object>
        {this.state.showEdit ? this.renderEdit() : this.renderComment()}

        </div>
        {this.state.showReply ? this.renderReply() : null}
        <div className="comments-more-actions-menu">
          <object><IconMenu
            iconButtonElement={<IconButton style={moreActionsMenuButtonStyle}><MoreVertIcon /></IconButton>}
            anchorOrigin={{horizontal: 'right', vertical: 'top'}}
            targetOrigin={{horizontal: 'right', vertical: 'top'}}
            style={moreActionsMenuStyle}
            iconStyle={moreActionsMenuIconStyle}
          >
            <Components.ShowIf check={Comments.options.mutations.edit.check} document={comment}>
              <MenuItem onTouchTap={this.showEdit} primaryText="Edit" />
            </Components.ShowIf>
            <MenuItem><Components.SubscribeTo className="comments-subscribe" document={comment} /></MenuItem>
          </IconMenu></object>
        </div>
      </Paper>
    )
  }

  renderComment() {
    let content = this.props.comment.content;
    const htmlBody = {__html: this.props.comment.htmlBody};
    const plaintext = this.props.comment.body;
    if (!this.state.expanded && plaintext && plaintext.length > 300) {
      // Add ellipsis to last element of commentExcerpt
      let commentExcerpt = plaintext.substring(0,300).split("\n\n");
      const lastElement = commentExcerpt.slice(-1)[0];
      commentExcerpt = commentExcerpt.slice(0, commentExcerpt.length - 1).map((text) => <p>{text}</p>);
      return <div className="recent-comments-item-text comments-item-text content-body">
          {commentExcerpt}
          <p>{lastElement + "..."}<a className="read-more" onTouchTap={() => this.setState({expanded: true})}>(read more)</a> </p>
        </div>
    } else {
      return (
        <div className="recent-comments-item-text comments-item-text content-body" >
          {content ? <object><Components.ContentRenderer state={content} /></object> : null}
          {htmlBody && !content ? <div className="recent-comment-body comment-body" dangerouslySetInnerHTML={htmlBody}></div> : null}
        </div>
      )
    }
  }
}

registerComponent('RecentCommentsItem', RecentCommentsItem);
