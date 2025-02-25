import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormLabel from '@material-ui/core/FormLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  greyDropdownRoot: {
    width: "100%",
    minHeight: 45,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    border: "none",
    display: "flex",
    "&:hover": {
      background: theme.palette.panelBackground.loginInputHovered,
    },
    "& *:first-child": {
      flexGrow: 1,
    },
  },
  greyDropdownTitle: {
    minHeight: 24,
    height: "unset",
  },
  greyDropdownMenu: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: 8,
    maxHeight: 400,
    overflow: "auto",
  },
  sectionTitle: {
    fontSize: 12,
  },
  formLabel: {
    fontSize: 10,
    marginBottom: 8
  },
  select: {
    '& .MuiOutlinedInput-input': {
      whiteSpace: 'pre-wrap',
      lineHeight: '1.8rem',
      paddingRight: 30,
    },
  },
  placeholder: {
    color: theme.palette.grey[600]
  },
  placeholderGrey: {
    fontStyle: "normal",
  },
});

type MultiselectOption = {
  value: string,
  label: string
}

/**
 * MultiSelect: A pick-multiple checkbox list. This is split from FormComponentMultiSelect
 * so that it can be used outside of vulcan-forms.
 */
const MultiSelect = ({
  value,
  setValue,
  label,
  placeholder,
  separator,
  options,
  variant = "default",
  classes,
}: {
  value: string[],
  setValue: (newValue: any) => void,
  label?: string,
  placeholder?: string,
  separator?: string,
  options: Array<MultiselectOption>,
  variant?: "default" | "grey",
  classes: ClassesType<typeof styles>,
}) => {
  const isGrey = variant === "grey";

  const renderValue = useCallback((selected: string[]) => {
    if (selected.length === 0) {
      return (
        <em className={classNames(
          classes.placeholder,
          isGrey && classes.placeholderGrey,
        )}>
          {placeholder}
        </em>
      );
    }

    // If any options are selected, display them separated by commas
    return selected
      .map((s) => options.find(option => option.value === s)?.label)
      .join(separator || ", ");
  }, [classes, isGrey, options, separator, placeholder]);

  const toggleValue = useCallback((newValue: string) => {
    const valueSet = new Set(value);
    if (valueSet.has(newValue)) {
      valueSet.delete(newValue);
    } else {
      valueSet.add(newValue);
    }
    setValue(Array.from(valueSet));
  }, [value, setValue]);

  if (isGrey) {
    const {
      SectionTitle, PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption,
    } = Components;
    return (
      <div>
        {label && <SectionTitle title={label} titleClassName={classes.sectionTitle} />}
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
                selected: value.some((v) => v === option.value),
                onToggle: toggleValue.bind(null, option.value),
              }}
            />
          ))}
        </PeopleDirectoryFilterDropdown>
      </div>
    );
  }

  const {MenuItem} = Components;
  return <FormControl>
    {label && <FormLabel className={classes.formLabel}>{label}</FormLabel>}
    <Select
      className={classes.select}
      value={value}
      input={<OutlinedInput labelWidth={0} />}
      onChange={e => {
        // MUI documentation says e.target.value is always an array: https://mui.com/components/selects/#multiple-select
        setValue(e.target.value)
      }}
      multiple
      displayEmpty
      renderValue={renderValue}
      {...!options.length ? {disabled: true} : {}}
    >
        {options.map(option => {
          return <MenuItem key={option.value} value={option.value}>
            <Checkbox checked={value.some(v => v === option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        })}
    </Select>
  </FormControl>
}


/**
 * FormComponentMultiSelect: Wrapper around MultiSelect for use with
 * vulcan-forms.
 */
const FormComponentMultiSelect = ({
  value,
  label,
  placeholder,
  separator,
  options,
  variant,
  path,
  updateCurrentValues,
}: FormComponentProps<string[]> & {
  separator?: string,
  options: Array<MultiselectOption>,
  variant?: "default" | "grey",
  classes: ClassesType<typeof styles>
}) => {
  return <Components.MultiSelect
    label={label}
    placeholder={placeholder}
    separator={separator}
    options={options}
    variant={variant}
    value={value}
    setValue={(value) => {
      void updateCurrentValues({
        [path]: value
      });
    }}
  />
}

const MultiSelectComponent = registerComponent("MultiSelect", MultiSelect, {styles});
const FormComponentMultiSelectComponent = registerComponent("FormComponentMultiSelect", FormComponentMultiSelect);

declare global {
  interface ComponentTypes {
    MultiSelect: typeof MultiSelectComponent
    FormComponentMultiSelect: typeof FormComponentMultiSelectComponent
  }
}
