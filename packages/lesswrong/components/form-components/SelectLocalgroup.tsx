import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';

type SelectLocalgroupProps = {
  useDocumentAsUser?: boolean,
  variant?: "default" | "grey",
  separator?: string,
} & (
  (FormComponentProps<string[]> & {multiselect: true}) |
  (FormComponentProps<string> & {multiselect?: false})
);

/**
 * A form input for selecting a localgroup -
 * the options are a list of groups for which the current user is an organizer,
 * or all groups if the user is an admin.
 */
const SelectLocalgroup = (props: SelectLocalgroupProps) => {
  const { MenuItem } = Components;

  // Default to currentUser, but use props.document if necessary
  // (ex. you want to be able to select groups for another user).
  const user = props.useDocumentAsUser ? props.document : props.currentUser

  const { results: groups } = useMulti({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsBase',
    terms: {
      view: props.currentUser?.isAdmin ? 'all' : 'userActiveGroups',
      userId: user._id,
      limit: 500
    },
    skip: !user
  });

  if (props.multiselect) {
    const options = groups?.map(group => {
      return {value: group._id, label: group.name}
    })
    return <Components.FormComponentMultiSelect {...props} options={options || []} />
  }

  const selectOptions = groups?.map(group => {
    return <MenuItem key={group._id} value={group._id}>
      {group.name}
    </MenuItem>
  })
  const {variant, separator, ...textFieldProps} = props;
  return <Components.MuiTextField
    select
    {...textFieldProps}
    {...!selectOptions?.length ? {disabled: true} : {}}
  >
    {selectOptions || []}
  </Components.MuiTextField>
}

const SelectLocalgroupComponent = registerComponent("SelectLocalgroup", SelectLocalgroup);

declare global {
  interface ComponentTypes {
    SelectLocalgroup: typeof SelectLocalgroupComponent
  }
}
