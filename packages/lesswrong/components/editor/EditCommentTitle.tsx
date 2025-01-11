import { registerComponent } from '../../lib/vulcan-lib';
import React, {useCallback, useState} from 'react';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types'
import classNames from 'classnames';
import {useMessages} from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';

const styles = (theme: ThemeType) => ({
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
    fontSize: "2rem",
  },
})

const EditCommentTitle = ({document, value, path, placeholder, updateCurrentValues, classes}: {
  document: PostsBase,
  value: any,
  path: string,
  placeholder: string,
  updateCurrentValues: Function,
  classes: ClassesType<typeof styles>
}) => {
  return <Input
    className={classNames(classes.root)}
    placeholder={placeholder}
    value={value}
    onChange={(event) => {
      updateCurrentValues({
        [path]: event.target.value
      })
    }}
    disableUnderline={true}
    multiline
  />
};

(EditCommentTitle as any).contextTypes = {
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
};

export const EditCommentTitleComponent = registerComponent( "EditCommentTitle", EditCommentTitle, {styles} );

declare global {
  interface ComponentTypes {
    EditCommentTitle: typeof EditCommentTitleComponent
  }
}

