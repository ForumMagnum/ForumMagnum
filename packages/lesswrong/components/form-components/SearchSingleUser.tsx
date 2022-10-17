import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
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

const SearchSingleUser = ({value, path, label, classes, updateCurrentValues}: {
  value?: string,
  path: string,
  label: string,
  classes: ClassesType,
  updateCurrentValues<T extends {}>(values: T): void
}) => {
  
  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string) => {
            updateCurrentValues({ [path]: userId });
          }}
          label={label}
        />
      </Components.ErrorBoundary>
      {value && <Components.SingleUsersItemWrapper documentId={value} removeItem={() => updateCurrentValues({ [path]: undefined}) } />}
    </div>
  )
};

const SearchSingleUserComponent = registerComponent("SearchSingleUser", SearchSingleUser, {styles});

declare global {
  interface ComponentTypes {
    SearchSingleUser: typeof SearchSingleUserComponent
  }
}
