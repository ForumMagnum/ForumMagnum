import React, {useCallback} from 'react';
import { makeSortableListComponent } from './sortableList';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import SingleUsersItem from "./SingleUsersItem";
import ErrorBoundary from "../common/ErrorBoundary";
import UsersSearchAutoComplete from "../search/UsersSearchAutoComplete";

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
  RenderItem: ({contents, removeItem}) => {
    const classes = useStyles(styles);
    return <li className={classes.item}>
      <SingleUsersItem userId={contents} removeItem={removeItem} />
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
      <ErrorBoundary>
        <UsersSearchAutoComplete
          clickAction={(userId: string) => {
            setValue([...value, userId]);
          }}
          label={label}
        />
      </ErrorBoundary>
      <SortableList
        axis="xy"
        value={value}
        setValue={setValue}
        className={classes.list}
      />
    </div>
  )
}

interface FormUserMultiselectProps {
  field: TypedFieldApi<string[] | null | undefined>;
  label: string;
}

export const FormUserMultiselect = ({ field, label }: FormUserMultiselectProps) => {
  const value = field.state.value ?? [];

  const setValue = useCallback((newValue: string[]) => {
    field.handleChange(newValue);
  }, [field]);

  return <UserMultiselect
    value={value}
    setValue={setValue}
    label={label}
  />
};

export default registerComponent("UserMultiselect", UserMultiselect);


