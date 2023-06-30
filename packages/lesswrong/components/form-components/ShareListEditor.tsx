import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { makeSortableListComponent } from './sortableList';
import { useSingle } from '../../lib/crud/withSingle';
import Chip from '@material-ui/core/Chip';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: theme.palette.background.usersListItem,
  },
})

export interface ShareList {
  userLists: string[],
  plusUsers: string[],
  minusUsers: string[],
}

export const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUserListItem listId={contents} removeItem={removeItem} />
    </li>
  }
});

const ShareListEditor = ({value, path, label, classes}: {
  value: ShareList,
  path: string,
  label: string,
  classes: ClassesType,
}, context: any) => {
  const { updateCurrentValues } = context;
  const { UsersListSearchAutoComplete, UsersListEditor } = Components;

  const setValue = (newValue: ShareList) => {
    updateCurrentValues({[path]: newValue});
  }
  const setPlusUsers = (plusUsers: string[]) => {
    setValue({...value, plusUsers});
  }
  const setMinusUsers = (minusUsers: string[]) => {
    setValue({...value, minusUsers});
  }
  const setUserLists = (userLists: string[]) => {
    setValue({...value, userLists});
  }
  
  const userLists = value?.userLists || [];
  const plusUsers = value?.plusUsers || [];
  const minusUsers = value?.minusUsers || [];
  
  return <div className={classes.root}>
    <Components.ErrorBoundary>
      <div>
        <UsersListSearchAutoComplete
          label="User Lists"
          clickAction={(listId: string) => {
            setUserLists([...userLists, listId]);
          }}
        />
        <SortableList
          axis="xy"
          value={userLists}
          setValue={setUserLists}
          className={classes.list}
          classes={classes}
        />
      </div>
      <div>
        <UsersListEditor label="Plus Users" value={plusUsers} setValue={setPlusUsers}/>
      </div>
      <div>
        <UsersListEditor label="Minus Users" value={minusUsers} setValue={setMinusUsers}/>
      </div>
    </Components.ErrorBoundary>
  </div>
}

const SingleUserListItem = ({listId, removeItem, classes}: {
  listId: string
  removeItem: (id: string)=>void
  classes: ClassesType
}) => {
  const { UserListHover, LWTooltip } = Components;
  const { document, loading } = useSingle({
    documentId: listId,
    collectionName: "UserLists",
    fragmentName: "UserListFragment",
  });

  if (document && !loading) {
    return <span>
      <LWTooltip
        title={<UserListHover list={document}/>}
      >
        <Chip
          onDelete={() => removeItem(document._id)}
          className={classes.chip}
          label={document.name}
        />
      </LWTooltip>
    </span>
  } else {
    return <Components.Loading />
  }
}

const ShareListEditorComponent = registerComponent('ShareListEditor', ShareListEditor, {styles});
const SingleUserListItemComponent = registerComponent('SingleUserListItem', SingleUserListItem, {styles});

declare global {
  interface ComponentTypes {
    ShareListEditor: typeof ShareListEditorComponent
    SingleUserListItem: typeof SingleUserListItemComponent
  }
}

