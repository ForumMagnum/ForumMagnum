import React, {useCallback, useState} from 'react';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import {useMessages} from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import type { EditablePost, PostCategory } from '../../lib/collections/posts/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';
import { isE2E } from '../../lib/executionEnvironment';
import { LW_POST_TITLE_FONT_SIZE } from '../posts/PostsPage/PostsPageTitle';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('EditTitle', (theme: ThemeType) => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    ...(isFriendlyUI ? {
      fontWeight: 700,
      fontSize: "3rem",
      marginBottom: 12,
      marginTop: 0,
    }: {
      fontSize: LW_POST_TITLE_FONT_SIZE,
      marginTop: 34,
      marginBottom: 64,
    }),
    width: "100%",
    resize: "none",
    textAlign: "left",
    "& textarea": {
      overflowY: "hidden",
    },
  }
}));

const placeholders: Record<PostCategory|"event", string> = {
  "post": "Post title",
  "event": "Event name",
  "question": "Question title",
  "linkpost": "Linkpost title"
}

interface EditTitleProps {
  field: TypedFieldApi<string>;
  document: EditablePost;
}

export const EditTitle = ({ field, document }: EditTitleProps) => {
  const classes = useStyles(styles);
  const { flash } = useMessages()
  const [lastSavedTitle, setLastSavedTitle] = useState<string|undefined>(document.title ?? undefined)

  const value = field.state.value;

  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsMinimumInfo',
  });

  const { isEvent, question, postCategory } = document;

  const effectiveCategory = isEvent ? "event" : question ? "question" as const : postCategory as PostCategory;
  const displayPlaceholder = placeholders[effectiveCategory];

  const handleChangeTitle = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    if (event.target.value !== lastSavedTitle && !!document._id) {
      setLastSavedTitle(event.target.value)
      void updatePost({
        selector: {_id: document._id},
        data: {title: event.target.value}
      }).then(() => flash({messageString: "Title has been changed."}));
    }
  }, [document, updatePost, lastSavedTitle, flash])

  return <Input
    className={classes.root}
    placeholder={displayPlaceholder}
    value={value}
    onChange={(event) => field.handleChange(event.target.value)}
    onBlur={handleChangeTitle}
    disableUnderline
    multiline={
      // For reasons we haven't been able to figure out, in a Playwright context
      // in the multi-post-submit test, this input (if it's multiline) winds up
      // zero-height, which causes `getByPlaceholder` to treat it as hidden,
      // which makes the test fail. Investigations suggest this is a bug inside
      // MaterialUI, rather than an issue with our code.
      !isE2E
    }
  />
};
