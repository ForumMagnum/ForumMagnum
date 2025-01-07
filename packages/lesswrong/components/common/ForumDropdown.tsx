import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';

const ForumDropdown = ({
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
  return <Components.ForumDropdownMultiselect
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

const ForumDropdownComponent = registerComponent('ForumDropdown', ForumDropdown);

declare global {
  interface ComponentTypes {
    ForumDropdown: typeof ForumDropdownComponent
  }
}
