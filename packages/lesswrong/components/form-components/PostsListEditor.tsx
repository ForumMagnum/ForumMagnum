import React from 'react';
import { makeSortableListComponent } from './sortableList';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("PostsListEditor", (theme: ThemeType) => ({
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

const PostsListEditor = ({value, path, updateCurrentValues}: FormComponentProps<string[]>) => {
  const classes = useStyles(styles);
  return <div className={classes.editor}>
    <SortableList
      value={value}
      setValue={(newValue: string[]) => {
        void updateCurrentValues({[path]: newValue});
      }}
    />
    <Components.PostsSearchAutoComplete
      clickAction={(postId: string) => {
        void updateCurrentValues({ [path]: [...value, postId] });
      }}
    />
  </div>
}

// TODO: Does not work in nested contexts because it doesn't use the
// vulcan-forms APIs correctly.
const PostsListEditorComponent = registerComponent("PostsListEditor", PostsListEditor);

declare global {
  interface ComponentTypes {
    PostsListEditor: typeof PostsListEditorComponent
  }
}
