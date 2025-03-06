import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import SingleUsersItem from "@/components/form-components/SingleUsersItem";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import UsersSearchAutoComplete from "@/components/search/UsersSearchAutoComplete";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex"
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
});

const SearchSingleUser = ({value, path, label, classes, updateCurrentValues}: FormComponentProps<string> & {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <ErrorBoundary>
        <UsersSearchAutoComplete
          clickAction={(userId: string) => {
            void updateCurrentValues({ [path]: userId });
          }}
          label={label}
        />
      </ErrorBoundary>
      {value && <SingleUsersItem userId={value} removeItem={() => updateCurrentValues({ [path]: undefined}) } />}
    </div>
  )
};

const SearchSingleUserComponent = registerComponent("SearchSingleUser", SearchSingleUser, {styles});

declare global {
  interface ComponentTypes {
    SearchSingleUser: typeof SearchSingleUserComponent
  }
}

export default SearchSingleUserComponent;
