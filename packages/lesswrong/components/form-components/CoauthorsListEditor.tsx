import React, { useCallback } from 'react';
import { makeSortableListComponent } from './sortableList';
import type { EditablePost } from '../../lib/collections/posts/helpers';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SingleUsersItem from "./SingleUsersItem";
import ErrorBoundary from "../common/ErrorBoundary";
import UsersSearchAutoComplete from "../search/UsersSearchAutoComplete";
import uniq from 'lodash/uniq';

const coauthorsListEditorStyles = defineStyles('CoauthorsListEditor', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    marginLeft: 8,
    marginTop: -12,
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
}));

const SortableList = makeSortableListComponent({
  RenderItem: ({contents, removeItem}) => {
    const classes = useStyles(coauthorsListEditorStyles);
    return <li className={classes.item}>
      <SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

interface CoauthorsListEditorProps {
  field: TypedFieldApi<string[] | null | undefined>;
  post: EditablePost;
  label: string;
}

export const CoauthorsListEditor = ({ field, post, label }: CoauthorsListEditorProps) => {
  const classes = useStyles(coauthorsListEditorStyles);
  const value = field.state.value ?? [];
  const hasPermission = !!post.hasCoauthorPermission;

  const addUserId = useCallback((userId: string) => {
    const newValue = uniq([...(field.state.value ?? []), userId]);
    field.handleChange(newValue);
  }, [field]);

  const setValue = useCallback((newValue: string[]) => {
    field.handleChange(newValue);
  }, [field]);

  return (
    <>
      <div className={classes.root}>
        <ErrorBoundary>
          <UsersSearchAutoComplete
            clickAction={addUserId}
            label={post.collabEditorDialogue ? "Add participant" : label}
            />
        </ErrorBoundary>
        <SortableList
          axis="xy"
          value={field.state.value ?? []}
          setValue={setValue}
          className={classes.list}
        />
      </div>
    </>
  );
}
