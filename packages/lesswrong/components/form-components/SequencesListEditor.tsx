import React from 'react';
import { makeSortableListComponent } from './sortableList';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("SequencesListEditor", (theme: ThemeType) => ({
  root: {
  },
  item: {
    listStyle: "none",
    position: "relative",
    padding: 5,
  },
}));

const SortableList = makeSortableListComponent({
  RenderItem: ({contents, removeItem}) => {
    const classes = useStyles(styles);
    return <li className={classes.item}>
      <Components.SequencesListEditorItem documentId={contents} removeItem={removeItem} />
    </li>
  }
});

const SequencesListEditor = ({value, path, updateCurrentValues}: FormComponentProps<string[]>) => {
  const classes = useStyles(styles);
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

// TODO: Does not work in nested contexts because it doesn't use the
// vulcan-forms APIs correctly.
const SequencesListEditorComponent = registerComponent("SequencesListEditor", SequencesListEditor);

declare global {
  interface ComponentTypes {
    SequencesListEditor: typeof SequencesListEditorComponent
  }
}
