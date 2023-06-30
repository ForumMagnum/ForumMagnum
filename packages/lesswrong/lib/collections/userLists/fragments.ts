import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment UserListFragment on UserList {
    _id
    name
    isPublic
    userId
    description {
      ...RevisionDisplay
    }
    members {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment UserListEditFragment on UserList {
    ...UserListFragment
    description {
      ...RevisionEdit
    }
  }
`);
