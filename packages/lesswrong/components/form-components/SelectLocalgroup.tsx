import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { FormComponentMultiSelect } from '@/components/form-components/FormComponentMultiSelect';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { MenuItem } from "../common/Menus";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const localGroupsBaseMultiQuery = gql(`
  query multiLocalgroupSelectLocalgroupQuery($selector: LocalgroupSelector, $limit: Int, $enableTotal: Boolean) {
    localgroups(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...localGroupsBase
      }
      totalCount
    }
  }
`);

interface SelectLocalgroupBaseProps {
  useDocumentAsUser?: boolean;
  variant?: "default" | "grey";
  separator?: string;
  document: { _id?: string };
  label?: string;
  placeholder?: string;
  hideClear?: boolean;
}

type SelectLocalgroupProps = SelectLocalgroupBaseProps & (
  { field: TypedFieldApi<string[] | null | undefined>; multiselect: true } |
  { field: TypedFieldApi<string | null | undefined>; multiselect?: false }
);

/**
 * A form input for selecting a localgroup -
 * the options are a list of groups for which the current user is an organizer,
 * or all groups if the user is an admin.
 */
export const SelectLocalgroup = (props: SelectLocalgroupProps) => {
  const currentUser = useCurrentUser();
  // Default to currentUser, but use props.document if necessary
  // (ex. you want to be able to select groups for another user).
  const user = props.useDocumentAsUser ? props.document : currentUser

  const view = currentUser?.isAdmin ? 'all' : 'userActiveGroups';
  const selectorTerms = view === 'all' ? {} : { userId: user?._id };

  const { data } = useQuery(localGroupsBaseMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 500,
      enableTotal: false,
    },
    skip: !user,
    notifyOnNetworkStatusChange: true,
  });

  const groups = data?.localgroups?.results;

  if (props.multiselect) {
    const options = groups?.map(group => {
      return {value: group._id, label: group.name ?? ''}
    })
    return <FormComponentMultiSelect {...props} options={options || []} />
  }

  const selectOptions = groups?.map(group => {
    return <MenuItem key={group._id} value={group._id}>
      {group.name}
    </MenuItem>
  })
  const {variant, separator, ...textFieldProps} = props;
  return <MuiTextField
    select
    {...textFieldProps}
    {...!selectOptions?.length ? {disabled: true} : {}}
  >
    {selectOptions || []}
  </MuiTextField>
}
