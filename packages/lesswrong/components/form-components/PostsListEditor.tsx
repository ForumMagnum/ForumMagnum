import React from 'react';
import { makeSortableListComponent } from './sortableList';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
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
});

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.PostsItemWrapper documentId={contents} removeItem={removeItem} />
    </li>
  }
});

const PostsListEditor = ({value, path, updateCurrentValues, classes}: FormComponentProps<string[]> & {
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.editor}>
    <SortableList
      value={value}
      setValue={(newValue: string[]) => {
        void updateCurrentValues({[path]: newValue});
      }}
      classes={classes}
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
const PostsListEditorComponent = registerComponent("PostsListEditor", PostsListEditor, {styles});

declare global {
  interface ComponentTypes {
    PostsListEditor: typeof PostsListEditorComponent
  }
}
