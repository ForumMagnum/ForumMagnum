import React, { useCallback } from 'react';
import { makeSortableListComponent } from '../form-components/sortableList';
import { Components } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TypedFieldApi } from './BaseAppForm';

const styles = defineStyles('TanStackUserMultiselect', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  item: {
    listStyle: 'none',
    fontFamily: theme.typography.fontFamily,
  },
}));

export const SortableList = makeSortableListComponent({
  renderItem: ({ contents, removeItem, classes }) => (
    <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  ),
});

interface TanStackUserMultiselectProps {
  field: TypedFieldApi<string[]>;
  label: string;
}

export function TanStackUserMultiselect({
  field,
  label,
}: TanStackUserMultiselectProps) {
  const classes = useStyles(styles);
  const value = field.state.value ?? [];

  const setValue = useCallback((newValue: string[]) => {
    field.handleChange(newValue);
  }, [field]);

  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string) => {
            setValue([...value, userId]);
          }}
          label={label}
        />
      </Components.ErrorBoundary>
      <SortableList
        axis="xy"
        value={value}
        setValue={setValue}
        className={classes.list}
        classes={classes}
      />
    </div>
  );
}
