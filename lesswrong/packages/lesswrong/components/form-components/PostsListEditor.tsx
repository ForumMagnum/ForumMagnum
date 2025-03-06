import React from 'react';
import PropTypes from 'prop-types';
import { makeSortableListComponent } from './sortableList';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import PostsSearchAutoComplete from "@/components/search/PostsSearchAutoComplete";
import PostsItemWrapper from "@/components/posts/PostsItemWrapper";

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
      <PostsItemWrapper documentId={contents} removeItem={removeItem} />
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
    <PostsSearchAutoComplete
      clickAction={(postId: string) => {
        void updateCurrentValues({ [path]: [...value, postId] });
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

export default PostsListEditorComponent;
