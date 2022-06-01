import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import InputAdornment from '@material-ui/core/InputAdornment';
import classNames from 'classnames'
import Input from '@material-ui/core/Input';
import LinkIcon from '@material-ui/icons/Link'
import LinkOffIcon from '@material-ui/icons/LinkOff';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: theme.spacing.unit
  },
  input: {
    marginLeft: 5,
    display: 'inline-block',
    overflow: 'hidden',
    transition: 'width 0.25s',
    width: 175,
    fontSize: '1.1rem',
    lineHeight: '1.5em',
  },
  hideInput: {
    width: 28,
  },
  button: {
    '&:hover': {
      cursor:'pointer'
    }
  },
  innerInput: {
    padding: '6px 0 7px'
  }
})

const EditUrl = ({ value, path, classes, document, defaultValue, label, hintText, placeholder, updateCurrentValues }: {
  value: string,
  path: string,
  classes: ClassesType,
  document: Document,
  defaultValue?: string,
  label?: string,
  hintText?: string,
  placeholder?: string,
  updateCurrentValues<T extends {}>(values: T) : void,
}) => {
  const [active, setActive] = useState(!!value);

  const updateValue = (value: string | null) => {
    updateCurrentValues({
      [path]: value,
    });
  }

  const toggleEditor = () => {
    if (active)
      updateValue(null);
    setActive(!active);
  }

  const onChange = (event) => updateValue(event.target.value);

  const startAdornmentInactive = (
    <InputAdornment className={classes.button} onClick={toggleEditor} position="start">
      <LinkIcon/>
    </InputAdornment>
  );
  const startAdornmentActive = (
    <InputAdornment className={classes.button} onClick={toggleEditor} position="start">
      <LinkOffIcon/>
    </InputAdornment>
  );

  return (
    <div className={classes.root}>
      <div>
        <span className={classNames(classes.input, {[classes.hideInput]: !active})}>
          <Input
            className={classes.innerInput}
            value={(document && document[path]) || defaultValue || ""}
            onChange={onChange}
            placeholder={hintText || placeholder || label}
            disableUnderline={!active}
            classes={{input: classes.input}}
            startAdornment={active ? startAdornmentActive : startAdornmentInactive}
          />
        </span>
      </div>
    </div>
  );
}

export const EditUrlComponent = registerComponent("EditUrl", EditUrl, {styles});

declare global {
  interface ComponentTypes {
    EditUrl: typeof EditUrlComponent
  }
}
