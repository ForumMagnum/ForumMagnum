import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import classNames from 'classnames';

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

const EditCommentTitle = ({value, path, placeholder, updateCurrentValues, classes}: FormComponentProps<string> & {
  placeholder: string,
  classes: ClassesType<typeof styles>
}) => {
  return <Input
    className={classNames(classes.root)}
    placeholder={placeholder}
    value={value}
    onChange={(event) => {
      void updateCurrentValues({
        [path]: event.target.value
      })
    }}
    disableUnderline={true}
    multiline
  />
};

export const EditCommentTitleComponent = registerComponent( "EditCommentTitle", EditCommentTitle, {styles} );

declare global {
  interface ComponentTypes {
    EditCommentTitle: typeof EditCommentTitleComponent
  }
}

