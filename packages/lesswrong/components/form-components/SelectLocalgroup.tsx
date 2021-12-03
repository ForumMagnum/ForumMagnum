import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';

const SelectLocalgroup = (props: any) => {
  console.log(props)
  console.log(props.value)
  
  const { results: userGroups } = useMulti({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsBase',
    terms: {
      view: 'userActiveGroups',
      userId: props.currentUser?._id
    },
    skip: !props.currentUser
  });
  console.log(userGroups)
  
  const selectOptions = userGroups?.map(group => {
    return <MenuItem key={group._id} value={group._id}>
      {group.name}
    </MenuItem>
  })

  return <Components.MuiTextField select {...props}>
    {selectOptions}
  </Components.MuiTextField>
}

const SelectLocalgroupComponent = registerComponent("SelectLocalgroup", SelectLocalgroup);

declare global {
  interface ComponentTypes {
    SelectLocalgroup: typeof SelectLocalgroupComponent
  }
}
