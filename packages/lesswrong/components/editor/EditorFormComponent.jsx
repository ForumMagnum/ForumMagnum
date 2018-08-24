import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent, withCurrentUser } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import { editorStyles, postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  postEditor: {
    minHeight:100,
    ...editorStyles(theme, postBodyStyles)
  },
})

class EditorFormComponent extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <Components.Loading />
    }
  }

  async componentWillMount() {
    const { currentUser } = this.props
    const {default: Editor} = await import('../async/AsyncEditorFormComponent.jsx');
    this.setState({editor: Editor});

    const removeUnusedFields = (data) => {
      let { content, body, ...newData } = data
      if (Users.useMarkdownPostEditor(currentUser)) {
        return {...newData, body}
      } else {
        return {...newData, content}
      }
    }
    this.context.addToSubmitForm(removeUnusedFields);
  }

  render() {
    const AsyncEditor = this.state.editor;
    const { currentUser, enableMarkDownEditor, classes } = this.props
    return (
      <div className={classes.postEditor}>
        { enableMarkDownEditor && Users.useMarkdownPostEditor(currentUser) ?
          <Components.MuiInput
            {...this.props}
            name="body"
          />
          :
          <AsyncEditor {...this.props}/>
        }
      </div>

    )
  }
}

EditorFormComponent.contextTypes = {
  addToSubmitForm: PropTypes.func,
};

registerComponent('EditorFormComponent', EditorFormComponent, withCurrentUser, withStyles(styles, { name: "EditorFormComponent" }));
