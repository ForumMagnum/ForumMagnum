import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Textarea } from 'formsy-react-components';
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    width: "100%",
    resize: "none",
    textAlign: "left",
    height: 100,
    marginTop: 0,
    borderBottom: "solid 1px rgba(0,0,0,.2)",
    '&:focused': {
      borderBottom: "solid 1px rgba(0,0,0,.2)"
    }
  },
  question: {
    fontSize: theme.typography.display1.fontSize,
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
    const {document: { question }, placeholder, inputProperties, classes} = this.props

    return <Textarea
      className={classNames(classes.root, {[classes.question]: question})}
      {...inputProperties}
      placeholder={ question ? "Question Title" : placeholder }
      layout="elementOnly"
          />
  }
} 

EditTitle.contextTypes = {
  addToSuccessForm: PropTypes.func
};

registerComponent("EditTitle", EditTitle, withStyles(styles, { name: "EditTitle" }));
