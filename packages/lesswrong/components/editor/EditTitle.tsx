import { registerComponent } from '../../lib/vulcan-lib';
import React, { Component } from 'react';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types'
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    width: "100%",
    resize: "none",
    textAlign: "left",
    marginTop: 0,
    borderBottom: theme.palette.border.normal,
    '&:focused': {
      borderBottom: theme.palette.border.normal
    },
    "& textarea": {
      overflowY: "hidden",
    },
  },
  question: {
    fontSize: theme.typography.display1.fontSize,
    minHeight: 65,
    paddingTop: theme.spacing.unit*1.5,
    lineHeight: '1.2em',
  },
})

interface EditTitleProps extends WithStylesProps {
  clearField: any,
  document: any,
  value: any,
  path: string,
  placeholder: string,
}

class EditTitle extends Component<EditTitleProps,{}> {
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
      disableUnderline={true}
    />
  }
};

(EditTitle as any).contextTypes = {
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
};

export const EditTitleComponent = registerComponent(
  "EditTitle", EditTitle, {styles}
);

declare global {
  interface ComponentTypes {
    EditTitle: typeof EditTitleComponent
  }
}

