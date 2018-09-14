import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { withStyles } from '@material-ui/core/styles';

const KARMA_COLLAPSE_THRESHOLD = -4;

const styles = theme => ({
  node: {
    // Higher specificity to override child class (variant syntax)
    '&$new': {
      borderLeft: `solid 5px ${theme.palette.secondary.light}`
    },
    '&$newHover': {
      borderLeft: `solid 5px ${theme.palette.secondary.main}`
    },
    '&$deleted': {
      opacity: 0.6
    }
  },
  child: {
    marginLeft: 10,
    marginBottom: 10,
    borderLeft: `solid 1px ${theme.palette.grey[300]}`,
    borderTop: `solid 1px ${theme.palette.grey[300]}`,
    borderBottom: `solid 1px ${theme.palette.grey[300]}`,
  },
  new: {},
  newHover: {},
  deleted: {},
})

class CommentsNode extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      collapsed: props && props.comment && (props.comment.baseScore < KARMA_COLLAPSE_THRESHOLD || props.comment.deleted),
      finishedScroll: false,
    };
  }

  componentDidMount() {
    let commentHash = this.props.router.location.hash;
    const self = this;
    if (commentHash === "#" + this.props.comment._id) {
      setTimeout(function () { //setTimeout make sure we execute this after the element has properly rendered
        self.scrollIntoView()
      }, 0);
    }
  }

  scrollIntoView = (event) => {
    //eslint-disable-next-line react/no-string-refs
    this.refs.comment.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
    this.setState({finishedScroll: true});
  }

  toggleCollapse = () => {
    this.setState({collapsed: !this.state.collapsed});
  }

  toggleHover = () => {
    this.setState({hover: !this.state.hover});
  }

  render() {
    const {
      comment,
      children,
      nestingLevel=1,
      currentUser,
      highlightDate,
      editMutation,
      post,
      muiTheme,
      router,
      postPage,
      classes,
      child,
      showPostTitle
    } = this.props;
    const { hover, collapsed, finishedScroll } = this.state
    const newComment = highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime())
    const nodeClass = classNames(
      "comments-node",
      classes.node,
      {
        "af":comment.af,
        "comments-node-root" : nestingLevel === 1,
        "comments-node-even" : nestingLevel % 2 === 0,
        "comments-node-odd"  : nestingLevel % 2 != 0,
        "comments-node-linked" : router.location.hash === "#" + comment._id && finishedScroll,
        "comments-node-its-getting-nested-here": nestingLevel > 8,
        "comments-node-so-take-off-all-your-margins": nestingLevel > 12,
        "comments-node-im-getting-so-nested": nestingLevel > 16,
        "comments-node-im-gonna-drop-my-margins": nestingLevel > 20,
        "comments-node-what-are-you-even-arguing-about": nestingLevel > 24,
        "comments-node-are-you-sure-this-is-a-good-idea": nestingLevel > 28,
        "comments-node-seriously-what-the-fuck": nestingLevel > 32,
        "comments-node-are-you-curi-and-lumifer-specifically": nestingLevel > 36,
        "comments-node-cuz-i-guess-that-makes-sense-but-like-really-tho": nestingLevel > 40,
        [classes.child]: child,
        [classes.new]: newComment,
        [classes.newHover]: newComment && hover,
        [classes.deleted]: comment.deleted,
      }
    )

    return (
      <div className={newComment ? "comment-new" : "comment-old"}>
        <div className={nodeClass}
          onMouseEnter={this.toggleHover}
          onMouseLeave={this.toggleHover}
          id={comment._id}>
          {/*eslint-disable-next-line react/no-string-refs*/}
          <div ref="comment">
            <Components.CommentsItem
              collapsed={collapsed}
              toggleCollapse={this.toggleCollapse}
              currentUser={currentUser}
              comment={comment}
              key={comment._id}
              editMutation={editMutation}
              scrollIntoView={this.scrollIntoView}
              post={post}
              postPage={postPage}
              nestingLevel={nestingLevel}
              showPostTitle={showPostTitle}
            />
          </div>
          {!collapsed && children && children.length>0 ?
            <div className="comments-children">
              <div className="comments-parent-scroll" onClick={this.scrollIntoView}></div>
              {children.map(child =>
                <Components.CommentsNode child
                  currentUser={currentUser}
                  comment={child.item}
                  nestingLevel={nestingLevel+1}
                  //eslint-disable-next-line react/no-children-prop
                  children={child.children}
                  key={child.item._id}
                  muiTheme={muiTheme}
                  highlightDate={highlightDate}
                  editMutation={editMutation}
                  post={post}
                  postPage={postPage}
                />)}
              </div>
              : null
            }
        </div>
      </div>
    )
  }
}

CommentsNode.propTypes = {
  comment: PropTypes.object.isRequired, // the current comment
  router: PropTypes.object.isRequired
};

registerComponent('CommentsNode', CommentsNode,
  withRouter, muiThemeable(),
  withStyles(styles, { name: "CommentsNode" })
);
