import React, { useCallback } from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import FormControl from '@/lib/vendor/@material-ui/core/src/FormControl';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import FormLabel from '@/lib/vendor/@material-ui/core/src/FormLabel';
import OutlinedInput from '@/lib/vendor/@material-ui/core/src/OutlinedInput';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import ListItemText from '@/lib/vendor/@material-ui/core/src/ListItemText';
import classNames from 'classnames';

import { defineStyles, useStyles } from '../hooks/useStyles';
import { TypedFieldApi } from './BaseAppForm';

const styles = defineStyles('TanStackMultiSelect', (theme: ThemeType) => ({
  greyDropdownRoot: {
    width: '100%',
    minHeight: 45,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    border: 'none',
    display: 'flex',
    '&:hover': {
      background: theme.palette.panelBackground.loginInputHovered,
    },
    '& *:first-child': {
      flexGrow: 1,
    },
  },
  greyDropdownTitle: {
    minHeight: 24,
    height: 'unset',
  },
  greyDropdownMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: 8,
    maxHeight: 400,
    overflow: 'auto',
  },
  sectionTitle: {
    fontSize: 12,
  },
  formLabel: {
    fontSize: 10,
    marginBottom: 8,
  },
  select: {
    '& .MuiOutlinedInput-input': {
      whiteSpace: 'pre-wrap',
      lineHeight: '1.8rem',
      paddingRight: 30,
    },
  },
  placeholder: {
    color: theme.palette.grey[600],
  },
  placeholderGrey: {
    fontStyle: 'normal',
  },
}));

type MultiselectOption = {
  value: string;
  label: string;
};

interface TanStackMultiSelectProps {
  field: TypedFieldApi<string[]>;
  label?: string;
  placeholder?: string;
  separator?: string;
  options: Array<MultiselectOption>;
  variant?: 'default' | 'grey';
}

export function TanStackMultiSelect({
  field,
  label,
  placeholder,
  separator,
  options,
  variant = 'default',
}: TanStackMultiSelectProps) {
  const classes = useStyles(styles);
  const value = field.state.value;
  const isGrey = variant === 'grey';

  const { SectionTitle, PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption, MenuItem } = Components;

  const renderValue = useCallback((selected: string[]) => {
    if (selected.length === 0) {
      return (
        <em
          className={classNames(
            classes.placeholder,
            isGrey && classes.placeholderGrey,
          )}
        >
          {placeholder}
        </em>
      );
    }

    // If any options are selected, display them separated by commas
    return selected
      .map((s) => options.find((option) => option.value === s)?.label)
      .join(separator || ', ');
  }, [classes, isGrey, options, separator, placeholder]);

  const toggleValue = useCallback((newValue: string) => {
    const valueSet = new Set(value);
    if (valueSet.has(newValue)) {
      valueSet.delete(newValue);
    } else {
      valueSet.add(newValue);
    }
    field.handleChange(Array.from(valueSet));
  }, [value, field]);

  if (isGrey) {
    return (
      <div>
        {label && (
          <SectionTitle
            title={label}
            titleClassName={classes.sectionTitle}
          />
        )}
        <PeopleDirectoryFilterDropdown
          title={<span>{renderValue(value)}</span>}
          rootClassName={classes.greyDropdownRoot}
          titleClassName={classes.greyDropdownTitle}
          className={classes.greyDropdownMenu}
        >
          {options.map((option) => (
            <PeopleDirectorySelectOption
              key={option.value}
              state={{
                ...option,
                selected: value.includes(option.value),
                onToggle: () => toggleValue(option.value),
              }}
            />
          ))}
        </PeopleDirectoryFilterDropdown>
      </div>
    );
  }

  return (
    <FormControl>
      {label && <FormLabel className={classes.formLabel}>{label}</FormLabel>}
      <Select
        className={classes.select}
        value={value}
        input={<OutlinedInput labelWidth={0} />}
        onChange={(e) => {
          field.handleChange(e.target.value as unknown as string[]);
        }}
        multiple
        displayEmpty
        renderValue={renderValue}
        disabled={options.length === 0}
        onBlur={field.handleBlur}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox checked={value.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
