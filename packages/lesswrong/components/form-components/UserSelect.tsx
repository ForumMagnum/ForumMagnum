import React, {useCallback} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import ErrorBoundary from "../common/ErrorBoundary";
import UsersSearchAutoComplete from "../search/UsersSearchAutoComplete";
import SingleUsersItem from "./SingleUsersItem";

const styles = defineStyles('FormUserSelect', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
}));

const UserSelect = ({ value, setValue, label }: {
  value: string | null,
  setValue: (newValue: string | null, result: SearchUser | null) => void,
  label: string,
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <ErrorBoundary>
        <UsersSearchAutoComplete
          clickAction={(userId: string, result: SearchUser) => setValue(userId, result)}
          label={label}
        />
      </ErrorBoundary>
      {value && (
        <div className={classes.item}>
          <SingleUsersItem userId={value} removeItem={() => setValue(null, null)} />
        </div>
      )}
    </div>
  );
};

interface FormUserSelectProps {
  field: TypedFieldApi<string | null | undefined>;
  label: string;
}

export const FormUserSelect = ({ field, label }: FormUserSelectProps) => {
  const value = field.state.value ?? null;
  const setValue = useCallback((newValue: string | null) => {
    field.handleChange(newValue);
  }, [field]);

  return <UserSelect
    value={value}
    setValue={setValue}
    label={label}
  />
};

export default registerComponent("UserSelect", UserSelect);


