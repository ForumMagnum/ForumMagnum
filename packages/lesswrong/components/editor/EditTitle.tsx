import { registerComponent } from '../../lib/vulcan-lib';
import React, {useCallback, useState} from 'react';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types'
import {useMessages} from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import { PostCategory } from '../../lib/collections/posts/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    ...(isFriendlyUI && {
      fontWeight: 700,
      fontSize: "3rem",
      marginBottom: 12,
    }),
    width: "100%",
    resize: "none",
    textAlign: "left",
    marginTop: 0,
    "& textarea": {
      overflowY: "hidden",
    },
  }
})

const placeholders: Record<PostCategory, string> = {
  "post": "Post title",
  "question": "Question title",
  "linkpost": "Linkpost title"
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
    className={classes.root}
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
