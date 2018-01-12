import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import moment from 'moment';
import { Comments, Posts } from "meteor/example-forum";
import { Link } from 'react-router';

import Paper from 'material-ui/Paper';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';


const paperStyle = {
  padding: '10px',
  backgroundColor: 'transparent',
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

  renderRecentComment() {
    let content = this.props.comment.content;
    const htmlBody = {__html: this.props.comment.htmlBody};
    const plaintext = this.props.comment.body;
    if (!this.state.expanded && plaintext && plaintext.length > 300) {
      // Add ellipsis to last element of commentExcerpt
      let commentExcerpt = plaintext.substring(0,300).split("\n\n");
      const lastElement = commentExcerpt.slice(-1)[0];
      let paragraphCounter = 0;
      commentExcerpt = commentExcerpt.slice(0, commentExcerpt.length - 1).map((text) => <p key={this.props.comment._id + paragraphCounter++}>{text}</p>);
      return <div className="recent-comments-item-text comments-item-text content-body">
        {commentExcerpt}
        <p>{lastElement + "..."}<a className="read-more" onTouchTap={() => this.setState({expanded: true})}>(read more)</a> </p>
      </div>
    } else {
      return (
        <div className="recent-comments-item-text comments-item-text content-body" >
          {htmlBody && <div className="recent-comment-body comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
        </div>
      )
    }
  }

  render() {
    const comment = this.props.comment;

    return (
      <div className="comments-node comments-node-root recent-comments-node">
        <div className="comments-item recent-comments-item">
          <div className="comments-item-body recent-comments-item-body ">
            <object><div className="comments-item-meta recent-comments-item-meta">
              <Components.UsersName user={comment.user}/>
              <div className="comments-item-vote recent-comments-item-vote ">
                <Components.Vote collection={Comments} document={comment} currentUser={this.props.currentUser}/>
              </div>
              <div className="comments-item-date">{moment(new Date(comment.postedAt)).fromNow()}</div>
              { comment.post && (
                <Link to={Posts.getPageUrl(comment.post) + "/" + comment._id}> <div className="comments-item-origin">
                  on <span className="comments-item-origin-post-title">{comment.post.title}</span>
                </div> </Link>
              )}
            </div></object>
            {this.state.showEdit ? this.renderEdit() : this.renderRecentComment()}
          </div>
          {this.state.showReply ? this.renderReply() : null}
          { this.renderMenu() }
        </div>
      </div>
    )
  }
}

registerComponent('RecentCommentsItem', RecentCommentsItem);
