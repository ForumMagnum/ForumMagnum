import React, {useCallback} from 'react';
import { makeSortableListComponent } from './sortableList';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('UserMultiselect', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center"
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

export const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

const UserMultiselect = ({value, setValue, label}: {
  value: string[],
  setValue: (newValue: string[]) => void
  label: string,
}) => {
  const classes = useStyles(styles);
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
  )
}

interface FormUserMultiselectProps {
  field: TypedFieldApi<string[]>;
  label: string;
}

export const FormUserMultiselect = ({ field, label }: FormUserMultiselectProps) => {
  const value = field.state.value ?? [];

  const setValue = useCallback((newValue: string[]) => {
    field.handleChange(newValue);
  }, [field]);

  return <Components.UserMultiselect
    value={value}
    setValue={setValue}
    label={label}
  />
};

const UserMultiselectComponent = registerComponent("UserMultiselect", UserMultiselect);

declare global {
  interface ComponentTypes {
    UserMultiselect: typeof UserMultiselectComponent
  }
}
