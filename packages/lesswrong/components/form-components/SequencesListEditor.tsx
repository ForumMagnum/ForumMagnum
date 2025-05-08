import React from 'react';
import { makeSortableListComponent } from '../form-components/sortableList';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { SequencesListEditorItem } from "./SequencesListEditorItem";
import { SequencesSearchAutoComplete } from "../search/SequencesSearchAutoComplete";

const styles = defineStyles('SequencesListEditor', (theme: ThemeType) => ({
  root: {
  },
  item: {
    listStyle: "none",
    position: "relative",
    padding: 5,
  },
}));

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <SequencesListEditorItem documentId={contents} removeItem={removeItem} />
    </li>
  }
});

export const SequencesListEditor = ({ field }: {
  field: TypedFieldApi<string[]>;
}) => {
  const classes = useStyles(styles);
  const value = field.state.value ?? [];

  return <div className={classes.root}>
    <SortableList
      value={value}
      setValue={(newValue: string[]) => {
        field.handleChange(newValue);
      }}
      classes={classes}
    />
    <SequencesSearchAutoComplete
      clickAction={(sequenceId: string) => {
        field.handleChange([...value, sequenceId]);
      }}
    />
  </div>
};
