import React from 'react';
import PropTypes from 'prop-types';
import { makeSortableListComponent } from './sortableList';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
  },
  item: {
    listStyle: "none",
    position: "relative",
    padding: 5,
  },
});

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SequencesListEditorItem documentId={contents} removeItem={removeItem} />
    </li>
  }
});

const SequencesListEditor = ({value, path, updateCurrentValues, classes}: FormComponentProps<string[]> & {
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.root}>
    <SortableList
      value={value}
      setValue={(newValue: string[]) => {
        void updateCurrentValues({[path]: newValue});
      }}
      classes={classes}
    />
    <Components.SequencesSearchAutoComplete
      clickAction={(sequenceId: string) => {
        void updateCurrentValues({ [path]: [...value, sequenceId] });
      }}
    />
  </div>
}

(SequencesListEditor as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

// TODO: Does not work in nested contexts because it doesn't use the
// vulcan-forms APIs correctly.
const SequencesListEditorComponent = registerComponent("SequencesListEditor", SequencesListEditor, {styles});

declare global {
  interface ComponentTypes {
    SequencesListEditor: typeof SequencesListEditorComponent
  }
}
