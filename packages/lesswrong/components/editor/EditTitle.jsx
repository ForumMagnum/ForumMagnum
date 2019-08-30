import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.h2,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    width: "100%",
    resize: "none",
    textAlign: "left",
    marginTop: 0,
    borderBottom: "solid 1px rgba(0,0,0,.2)",
    '&:focused': {
      borderBottom: "solid 1px rgba(0,0,0,.2)"
    }
  },
  question: {
    fontSize: theme.typography.h4.fontSize,
    height: 65,
    paddingTop: theme.spacing.unit*1.5,
    lineHeight: '1.2em',
    borderBottom: "none"
  }
})

class EditTitle extends Component {
  UNSAFE_componentWillMount() {
    const { addToSuccessForm } = this.context
    const { clearField } = this.props
    addToSuccessForm(() => clearField())
  }
  render() {
    const { document, value, path, placeholder, classes } = this.props
    const { question } = document;

    return <Input
      className={classNames(classes.root, {[classes.question]: question})}
      placeholder={ question ? "Question Title" : placeholder }
      value={value}
      onChange={(event) => {
        this.context.updateCurrentValues({
          [path]: event.target.value
        })
      }}
      multiline
    />
  }
}

EditTitle.contextTypes = {
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
};

registerComponent("EditTitle", EditTitle, withStyles(styles, { name: "EditTitle" }));
