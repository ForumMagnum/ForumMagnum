import React from 'react';
import { makeSortableListComponent } from '../form-components/sortableList';
import { Components } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('PostsListEditor', (theme: ThemeType) => ({
  editor: {
    "& .ais-InstantSearch__root": {
      margin: "20px 0",
    },
  },
  item: {
    listStyle: "none",
    position: "relative",
    padding: 5,
    cursor: "pointer",
  },
}));

const SortableList = makeSortableListComponent({
  RenderItem: ({contents, removeItem}) => {
    const classes = useStyles(styles);
    return <li className={classes.item}>
      <Components.PostsItemWrapper documentId={contents} removeItem={removeItem} />
    </li>
  }
});

export const PostsListEditor = ({ field }: {
  field: TypedFieldApi<string[]>;
}) => {
  const classes = useStyles(styles);
  const value = field.state.value ?? [];

  return <div className={classes.editor}>
    <SortableList
      value={value}
      setValue={(newValue: string[]) => {
        field.handleChange(newValue);
      }}
    />
    <Components.PostsSearchAutoComplete
      clickAction={(postId: string) => {
        field.handleChange([...value, postId]);
      }}
    />
  </div>
};
