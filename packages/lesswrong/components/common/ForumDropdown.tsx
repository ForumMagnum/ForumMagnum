import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { ForumDropdownMultiselect } from "./ForumDropdownMultiselect";

const ForumDropdownInner = ({
  value,
  options,
  queryParam,
  onSelect,
  paddingSize,
  useIconLabel,
  disabled,
  className,
}: {
  value: string,
  options: Record<string, SettingsOption>,
  queryParam?: string,
  onSelect?: (value: string) => void,
  paddingSize?: number,
  useIconLabel?: boolean,
  disabled?: boolean,
  className?: string,
}) => {
  return <ForumDropdownMultiselect
    values={[value]}
    options={options}
    queryParam={queryParam}
    onSelect={onSelect}
    paddingSize={paddingSize}
    useIconLabel={useIconLabel}
    disabled={disabled}
    className={className}
  />
}

export const ForumDropdown = registerComponent('ForumDropdown', ForumDropdownInner);


