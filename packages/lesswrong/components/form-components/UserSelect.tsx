import React, {useCallback} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
});

const UserSelect = ({ value, setValue, label, classes }: {
  value: string | null,
  setValue: (newValue: string | null) => void,
  label: string,
  classes: ClassesType,
}) => {
  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string) => setValue(userId)}
          label={label}
        />
      </Components.ErrorBoundary>
      {value && (
        <div className={classes.item}>
          <Components.SingleUsersItem userId={value} removeItem={() => setValue(null)} />
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

const UserSelectComponent = registerComponent("UserSelect", UserSelect, {styles});
const FormUserSelectComponent = registerComponent("FormUserSelect", FormUserSelect, {styles});

declare global {
  interface ComponentTypes {
    UserSelect: typeof UserSelectComponent
    FormUserSelect: typeof FormUserSelectComponent
  }
}
