import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';

const ForumDropdown = ({value, options, queryParam, onSelect, eventProps, className}:{
  value: string,
  options: Record<string, SettingsOption>,
  queryParam?: string,
  onSelect?: (value: string) => void,
  eventProps?: Record<string, string>
  className?: string,
}) => {
  return <Components.ForumDropdownMultiselect
    values={[value]}
    options={options}
    queryParam={queryParam}
    onSelect={onSelect}
    eventProps={eventProps}
    className={className}
  />
}

const ForumDropdownComponent = registerComponent('ForumDropdown', ForumDropdown);

declare global {
  interface ComponentTypes {
    ForumDropdown: typeof ForumDropdownComponent
  }
}
