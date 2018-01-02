import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import DatePicker from 'material-ui/DatePicker';
import { withRouter } from 'react-router'
import { withCurrentUser, Components, registerComponent} from 'meteor/vulcan:core';
import moment from 'moment';

const datePickerTextFieldStyle = {
  display: 'none',
  boxShadow: 'none',
  hr: {
    display: 'none',
  }
}

class CommentsListSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightDate: this.props.lastEvent && this.props.lastEvent.properties && this.props.lastEvent.properties.createdAt && new Date(this.props.lastEvent.properties.createdAt) || this.props.post && this.props.post.lastVisitedAt && new Date(this.props.post.lastVisitedAt) || new Date(),
    }
  }

  renderHighlightDateSelector = () => <div className="highlight-date-selector">
    Highlighting new comments since <a className="highlight-date-selector-date" onTouchTap={(e) => this.refs.dp.openDialog()}>{moment(this.state.highlightDate).calendar()}</a>
    <DatePicker
      autoOk={true}
      className="highlight-date-selector-dialog"
      value={this.state.highlightDate}
      onChange={(dummy, date) => {
        this.setState({highlightDate: new Date(date)})}
      }
      hintText="Select new highlight date"
      textFieldStyle={datePickerTextFieldStyle}
      ref="dp"
      maxDate={new Date()}
      id="datepicker"
    />
  </div>

  renderCommentCount = () => {
    if (this.props.commentCount < this.props.totalComments) {
      return (
        <span className="posts-page-comments-count">
          Rendering {this.props.commentCount}/{this.props.totalComments} comments, {this.renderCommentSort()}
          {this.props.loadingMoreComments ? <Components.Loading /> : <a onTouchTap={() => this.props.loadMoreComments()}>(show more)</a>}
        </span>
      )
    } else {
      return (
        <span className="posts-page-comments-count">
          { this.props.totalComments } comments, {this.renderCommentSort()}
        </span>
      )
    }
  }

  renderCommentSort = () => <span className="posts-page-comments-sort">sorted by <Components.CommentsViews postId={this.props.postId} /></span>

  renderTitleComponent = () => (
    <div className="posts-page-comments-title-component">
      { this.renderCommentCount() }
      { this.renderHighlightDateSelector() }
    </div>
  )

  render() {
    const {currentUser, comments, postId, router} = this.props;
    const currentQuery = (!_.isEmpty(router.location.query) && router.location.query) ||  {view: 'postCommentsTop', limit: 50};
    const currentLocation = router.location;
    return (
      <div className="posts-comments-thread">
        { this.props.totalComments ? this.renderTitleComponent() : null }
        <Components.CommentsList
          currentUser={currentUser}
          comments={comments}
          highlightDate={this.state.highlightDate}
        />
        {!!currentUser ?
          <div className="posts-comments-thread-new">
            <h4><FormattedMessage id="comments.new"/></h4>
            <Components.CommentsNewForm
              postId={postId}
              type="comment"
            />
          </div> :
          <div>
            <Components.ModalTrigger
              component={<a href="#"><FormattedMessage id="comments.please_log_in"/></a>}
            size="small">
              <Components.AccountsLoginForm/>
            </Components.ModalTrigger>
          </div>
        }
      </div>
    );
  }
}

registerComponent("CommentsListSection", CommentsListSection, withCurrentUser, withRouter);
