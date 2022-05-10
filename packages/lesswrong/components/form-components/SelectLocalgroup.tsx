import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { useMulti } from '../../lib/crud/withMulti';

/**
 * A form input for selecting a localgroup -
 * the options are a list of groups for which the current user is an organizer,
 * or all groups if the user is an admin.
 */
const SelectLocalgroup = (props: any) => {

  const { results: groups } = useMulti({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsBase',
    terms: {
      view: props.currentUser.isAdmin ? 'all' : 'userActiveGroups',
      userId: props.currentUser?._id,
      limit: 300
    },
    skip: !props.currentUser
  });
  
  const selectOptions = groups?.map(group => {
    return <MenuItem key={group._id} value={group._id}>
      {group.name}
    </MenuItem>
  })

  return <Components.MuiTextField select {...props}>
    {selectOptions || []}
  </Components.MuiTextField>
}

const SelectLocalgroupComponent = registerComponent("SelectLocalgroup", SelectLocalgroup);

declare global {
  interface ComponentTypes {
    SelectLocalgroup: typeof SelectLocalgroupComponent
  }
}
