import React from 'react';
import PropTypes from 'prop-types';
import { makeSortableListComponent } from './sortableList';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
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

const PostsListEditor = ({value, path, label, classes}: {
  value: string[],
  path: string,
  label: string,
  classes: ClassesType,
}, context) => {
  const { updateCurrentValues } = context;
  return <div className={classes.editor}>
    <SortableList
      value={value}
      setValue={(newValue: string[]) => {
        updateCurrentValues({[path]: newValue});
      }}
      classes={classes}
    />
    <Components.PostsSearchAutoComplete
      clickAction={(postId: string) => {
        updateCurrentValues({ [path]: [...value, postId] });
      }}
    />
  </div>
}

(PostsListEditor as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

// TODO: Does not work in nested contexts because it doesn't use the
// vulcan-forms APIs correctly.
const PostsListEditorComponent = registerComponent("PostsListEditor", PostsListEditor, {styles});

declare global {
  interface ComponentTypes {
    PostsListEditor: typeof PostsListEditorComponent
  }
}
