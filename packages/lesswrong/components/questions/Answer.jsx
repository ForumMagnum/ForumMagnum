import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import { postBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography'
import withErrorBoundary from '../common/withErrorBoundary'
import { withRouter } from 'react-router';
import classNames from 'classnames';

const styles = theme => ({
  postContent: postBodyStyles(theme),
  answer: {
    width: 640,
    margin:10,
  },
  author: {
    ...postBodyStyles(theme)
  },
  footer: {
    marginTop: theme.spacing.unit*4,
    textAlign: "right"
  },
  separator: {
    borderColor: theme.palette.grey[200],
    width: "25%",
    marginTop: theme.spacing.unit*4,
    marginBottom: theme.spacing.unit*8
  },
  menu: {
    float: "right",
    marginLeft: theme.spacing.unit,
  },
  finishedScroll: {
    animation: "lw-green-fade 5s ease-in-out 0s",
  }
})

class Answer extends Component {
  state = { showEdit: false, finishedScroll: false}

  showEdit = () => this.setState({showEdit: true})
  hideEdit = () => this.setState({showEdit: false})

  scrollIntoView = (event) => {
    // TODO: This is a legacy React API; migrate to the new type of refs.
    // https://reactjs.org/docs/refs-and-the-dom.html#legacy-api-string-refs
    //eslint-disable-next-line react/no-string-refs
    if (this.refs && this.refs.answer) {
      //eslint-disable-next-line react/no-string-refs
      this.refs.answer.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
      this.setState({finishedScroll: true});
    }
  }

  componentDidMount() {
    const { router, comment, post } = this.props
    let commentHash = router.location.hash;
    const self = this;
    if (comment && commentHash === ("#" + comment._id) && post) {
      setTimeout(function () { //setTimeout make sure we execute this after the element has properly rendered
        self.scrollIntoView()
      }, 0);
    }
  }

  render () {
    const { comment, post, classes } = this.props
    const { showEdit, finishedScroll } = this.state
    const { ContentItemBody, AnswerMeta, SimpleDate } = Components

    return (
      <div className={classNames({[classes.finishedScroll]: finishedScroll})}>
        <Components.Section titleComponent={
            <AnswerMeta
              comment={comment}
              post={post}
              scrollIntoView={this.scrollIntoView}
              showEdit={this.showEdit}/>
          }>
          {/*eslint-disable-next-line react/no-string-refs*/}
          <div className={classes.answer} id={comment._id} ref="answer">
            { showEdit ?
              <Components.CommentsEditForm
                 comment={comment}
                 successCallback={this.hideEdit}
                 cancelCallback={this.hideEdit}
               />
            :
              <ContentItemBody
                className={classes.postContent}
                dangerouslySetInnerHTML={{__html:comment.htmlBody}}/>
            }
            <div className={classes.footer}>
              {comment && comment.user && <Typography variant="headline">by { comment.user.displayName}</Typography>}
              <Typography variant="subheading"><SimpleDate date={comment.postedAt}/></Typography>
            </div>
            <hr className={classes.separator}/>
          </div>
        </Components.Section>
      </div>
    )
  }
}

Answer.propTypes = {
  comment: PropTypes.object.isRequired,
};

registerComponent('Answer', Answer, withStyles(styles, {name:'Answer'}), withErrorBoundary, withRouter);
