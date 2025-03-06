import React, {useCallback} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import SingleUsersItem from "@/components/form-components/SingleUsersItem";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import UsersSearchAutoComplete from "@/components/search/UsersSearchAutoComplete";

const styles = (theme: ThemeType) => ({
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
  setValue: (newValue: string | null, result: SearchUser | null) => void,
  label: string,
  classes: ClassesType<typeof styles>,
}) => {
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

const FormUserSelect = ({value, path, label, updateCurrentValues}: {
  value: string | null,
  path: string,
  label: string,
  updateCurrentValues: UpdateCurrentValues,
}) => {
  const setValue = useCallback((newValue: string | null) => {
    void updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);

  return <UserSelect
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

export {
  UserSelectComponent as UserSelect,
  FormUserSelectComponent as FormUserSelect
}
