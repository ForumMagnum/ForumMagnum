import React, {useCallback} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("UserSelect", (theme: ThemeType) => ({
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

const FormUserSelect = ({value, path, label, updateCurrentValues}: {
  value: string | null,
  path: string,
  label: string,
  updateCurrentValues: UpdateCurrentValues,
}) => {
  const setValue = useCallback((newValue: string | null) => {
    void updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);

  return <Components.UserSelect
    value={value}
    setValue={setValue}
    label={label}
  />
};

const UserSelectComponent = registerComponent("UserSelect", UserSelect);
const FormUserSelectComponent = registerComponent("FormUserSelect", FormUserSelect);

declare global {
  interface ComponentTypes {
    UserSelect: typeof UserSelectComponent
    FormUserSelect: typeof FormUserSelectComponent
  }
}
