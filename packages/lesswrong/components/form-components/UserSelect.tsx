import React, {useCallback} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('TanStackUserSelect', (theme: ThemeType) => ({
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
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string, result: SearchUser) => setValue(userId, result)}
          label={label}
        />
      </Components.ErrorBoundary>
      {value && (
        <div className={classes.item}>
          <Components.SingleUsersItem userId={value} removeItem={() => setValue(null, null)} />
        </div>
      )}
    </div>
  );
};

interface FormUserSelectProps {
  field: TypedFieldApi<string | null>;
  label: string;
}

export const FormUserSelect = ({ field, label }: FormUserSelectProps) => {
  const value = field.state.value;
  const setValue = useCallback((newValue: string | null) => {
    field.handleChange(newValue);
  }, [field]);

  return <Components.UserSelect
    value={value}
    setValue={setValue}
    label={label}
  />
};

const UserSelectComponent = registerComponent("UserSelect", UserSelect);

declare global {
  interface ComponentTypes {
    UserSelect: typeof UserSelectComponent
  }
}
