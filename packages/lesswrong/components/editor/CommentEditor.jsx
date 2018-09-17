import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { editorStyles, commentBodyStyles } from '../../themes/stylePiping'
import defineComponent from '../../lib/defineComponent';

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

  async UNSAFE_componentWillMount() {
    const { currentUser } = this.props
    const {default: Editor} = await import('../async/AsyncCommentEditor.jsx');
    this.setState({editor: Editor});
    const removeUnusedFields = (data) => {
      let { content, body, ...newData } = data
      if (Users.useMarkdownCommentEditor(currentUser)) {
        return {...newData, body}
      } else {
        return {...newData, content}
      }
    }
    this.context.addToSubmitForm(removeUnusedFields);
  }

  render() {
    const { classes, currentUser, ...otherProps } = this.props
    const AsyncCommentEditor = this.state.editor;
    return (
      <div className={classes.commentStyle}>
        { Users.useMarkdownCommentEditor(currentUser) ?
          <Components.MuiInput
            disableUnderline
            {...otherProps}
          />
        :
        <AsyncCommentEditor {...otherProps}/>
        }
      </div>
    )
  }
}

CommentEditor.contextTypes = {
  addToSubmitForm: PropTypes.func,
};

export default defineComponent({
  name: 'CommentEditor',
  component: CommentEditor,
  styles: styles,
  hocs: [ withCurrentUser ]
});
