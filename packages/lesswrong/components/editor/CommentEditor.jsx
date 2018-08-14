import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import { editorStyles, commentBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  commentStyle: editorStyles(theme, commentBodyStyles),
})

class CommentEditor extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <div> Editor.Loading... </div>
    }
  }

  async componentWillMount() {
    const {default: Editor} = await import('../async/AsyncCommentEditor.jsx');
    this.setState({editor: Editor});
  }

  render() {
    const { classes } = this.props
    const AsyncCommentEditor = this.state.editor;
    const currentUser = this.props.currentUser;
    return (
      <div className={classes.commentStyle}>
        { Users.useMarkdownCommentEditor(currentUser) ?
          <Components.MuiInput
            disableUnderline
            {...this.props}
          />
        :
        <AsyncCommentEditor {...this.props}/>
        }
      </div>
    )
  }
}

registerComponent('CommentEditor', CommentEditor, withCurrentUser, withStyles(styles));
