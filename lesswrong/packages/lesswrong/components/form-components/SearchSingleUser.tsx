import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

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
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string) => {
            void updateCurrentValues({ [path]: userId });
          }}
          label={label}
        />
      </Components.ErrorBoundary>
      {value && <Components.SingleUsersItem userId={value} removeItem={() => updateCurrentValues({ [path]: undefined}) } />}
    </div>
  )
};

const SearchSingleUserComponent = registerComponent("SearchSingleUser", SearchSingleUser, {styles});

declare global {
  interface ComponentTypes {
    SearchSingleUser: typeof SearchSingleUserComponent
  }
}
