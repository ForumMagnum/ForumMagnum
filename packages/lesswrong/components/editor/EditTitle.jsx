import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Textarea } from 'formsy-react-components';
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

const EditTitle = ({document, placeholder, inputProperties, classes}) => {
  const isQuestion = document.question

  return <Textarea
    className={classNames(classes.root, {[classes.question]: isQuestion})}
    {...inputProperties}
    placeholder={ isQuestion ? "Question Title" : placeholder }
    layout="elementOnly"
         />
}

registerComponent("EditTitle", EditTitle, withStyles(styles, { name: "EditTitle" }));
