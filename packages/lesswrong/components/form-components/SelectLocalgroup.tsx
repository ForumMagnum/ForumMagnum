import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { TypedFieldApi } from '../tanstack-form-components/BaseAppForm';
import { TanStackMultiSelect } from '../tanstack-form-components/TanStackMultiSelect';
import { TanStackMuiTextField } from '../tanstack-form-components/TanStackMuiTextField';

interface SelectLocalgroupBaseProps {
  useDocumentAsUser?: boolean;
  variant?: "default" | "grey";
  separator?: string;
  document: { _id?: string };
  label?: string;
}

type SelectLocalgroupProps = SelectLocalgroupBaseProps & (
  { field: TypedFieldApi<string[]>; multiselect: true } |
  { field: TypedFieldApi<string | null>; multiselect?: false }
);

/**
 * A form input for selecting a localgroup -
 * the options are a list of groups for which the current user is an organizer,
 * or all groups if the user is an admin.
 */
export const SelectLocalgroup = (props: SelectLocalgroupProps) => {
  const currentUser = useCurrentUser();
  const { MenuItem } = Components;

  // Default to currentUser, but use props.document if necessary
  // (ex. you want to be able to select groups for another user).
  const user = props.useDocumentAsUser ? props.document : currentUser

  const { results: groups } = useMulti({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsBase',
    terms: {
      view: currentUser?.isAdmin ? 'all' : 'userActiveGroups',
      userId: user?._id,
      limit: 500
    },
    skip: !user
  });

  if (props.multiselect) {
    const options = groups?.map(group => {
      return {value: group._id, label: group.name ?? ''}
    })
    return <TanStackMultiSelect {...props} options={options || []} />
  }

  const selectOptions = groups?.map(group => {
    return <MenuItem key={group._id} value={group._id}>
      {group.name}
    </MenuItem>
  })
  const {variant, separator, ...textFieldProps} = props;
  return <TanStackMuiTextField
    select
    {...textFieldProps}
    {...!selectOptions?.length ? {disabled: true} : {}}
  >
    {selectOptions || []}
  </TanStackMuiTextField>
}
