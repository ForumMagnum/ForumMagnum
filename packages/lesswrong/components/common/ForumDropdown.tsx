import React from 'react';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import ForumDropdownMultiselect from "./ForumDropdownMultiselect";

const ForumDropdown = ({
  value,
  options,
  queryParam,
  onSelect,
  paddingSize,
  useIconLabel,
  disabled,
  className,
  menuPlacement,
}: {
  value: string,
  options: Record<string, SettingsOption>,
  queryParam?: string,
  onSelect?: (value: string) => void,
  paddingSize?: number,
  useIconLabel?: boolean,
  disabled?: boolean,
  className?: string,
  menuPlacement?: "bottom-start" | "bottom-end",
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
    menuPlacement={menuPlacement}
  />
}

export default ForumDropdown;


