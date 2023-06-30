import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  hit: {
    cursor: "pointer",
  },
})

const UsersListSearchAutoComplete = ({clickAction, label, classes}: {
  clickAction: (id: string) => void,
  label?: string,
  classes: ClassesType,
}) => {
  return <Components.SearchAutoComplete
    indexName={getAlgoliaIndexName("UserLists")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <UserListAutoCompleteHit document={hit} classes={classes} />}
    renderInputComponent={(inputProps: AnyBecauseHard) => {
      return <Input
        inputProps={inputProps}
        className={classes.input}
      />
    }}
    placeholder={label || "Search for Users"}
    noSearchPlaceholder='User ID'
  />
}

const UserListAutoCompleteHit = ({document, classes}: {
  document: AlgoliaUserList,
  classes: ClassesType,
}) => {
  if (document) {
    return <div className={classes.hit}>
      {document.name}
    </div>
  } else {
    return <Components.Loading />
  }
}

const UsersListSearchAutoCompleteComponent = registerComponent('UsersListSearchAutoComplete', UsersListSearchAutoComplete, {styles});

declare global {
  interface ComponentTypes {
    UsersListSearchAutoComplete: typeof UsersListSearchAutoCompleteComponent
  }
}

