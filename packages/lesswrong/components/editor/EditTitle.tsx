import { registerComponent } from '../../lib/vulcan-lib';
import React, {useCallback, useState} from 'react';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types'
import classNames from 'classnames';
import {useMessages} from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import { isEAForum } from '../../lib/instanceSettings';
import { PostCategory } from '../../lib/collections/posts/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    ...(isEAForum && {
      fontWeight: 700,
      fontSize: "3rem",
      marginBottom: 12,
    }),
    width: "100%",
    resize: "none",
    textAlign: "left",
    marginTop: 0,
    borderBottom: !isEAForum && theme.palette.border.normal,
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

const placeholders: Record<PostCategory, string> = {
  "post": "Post title",
  "question": "Question title",
  "linkpost": "Linkpost title",
  "dialogue": "Dialogue title",
}

const EditTitle = ({document, value, path, placeholder, updateCurrentValues, classes}: {
  document: PostsBase,
  value: any,
  path: string,
  placeholder: string,
  updateCurrentValues: Function,
  classes: ClassesType
}) => {
  const { flash } = useMessages()
  const [lastSavedTitle, setLastSavedTitle] = useState<string>(document.title)
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsMinimumInfo',
  });
  const { question, postCategory } = document;

  const effectiveCategory = question ? "question" as const : postCategory as PostCategory;
  const displayPlaceholder = placeholders[effectiveCategory];

  const handleChangeTitle = useCallback((event) => {
    if (event.target.value !== lastSavedTitle && !!document._id) {
      setLastSavedTitle(event.target.value)
      void updatePost({
        selector: {_id: document._id},
        data: {title: event.target.value}
      }).then(() => flash({messageString: "Title has been changed."}))
    }
  }, [document, updatePost, lastSavedTitle, flash])

  return <Input
    className={classNames(classes.root, {[classes.question]: question && !isEAForum})}
    placeholder={displayPlaceholder}
    value={value}
    onChange={(event) => {
      updateCurrentValues({
        [path]: event.target.value
      })
    }}
    onBlur={(event) =>  handleChangeTitle(event)}
    disableUnderline={true}
    multiline
  />
};

(EditTitle as any).contextTypes = {
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
};

export const EditTitleComponent = registerComponent( "EditTitle", EditTitle, {styles} );

declare global {
  interface ComponentTypes {
    EditTitle: typeof EditTitleComponent
  }
}

