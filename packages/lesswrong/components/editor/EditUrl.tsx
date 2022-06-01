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
  inactive: {
    width: 120,
  },
  button: {
    '&:hover': {
      cursor:'pointer'
    }
  },
  innerInput: {
    padding: '6px 0 7px'
  },
  footer: {
    border: theme.palette.border.grey400,
    padding: '7px 10px 8px',
    marginTop: '-8px',
    animation: 'reveal-url-footer 0.2s ease 0s',
    transformOrigin: 'top left',
  },
  '@keyframes reveal-url-footer': {
    from: {
      opacity: '0%',
      transform: 'scaleY(0%)',
    },
    to: {
      opacity: '100%',
      transform: 'scaleY(100%)',
    },
  },
})

const EditUrl = ({ value, path, classes, document, defaultValue, label, hintText, placeholder, tooltip, updateCurrentValues, setFooterContent, inputProperties }: {
  value: string,
  path: string,
  classes: ClassesType,
  document: Document,
  defaultValue?: string,
  label?: string,
  hintText?: string,
  placeholder?: string,
  tooltip?: string,
  updateCurrentValues<T extends {}>(values: T) : void,
  setFooterContent(content: any) : void,
  inputProperties: {
    labels?: {
      active: string,
      inactive: string,
    },
  },
}) => {
  const [active, setActive] = useState(!!value);

  const updateValue = (value: string | null) => {
    updateCurrentValues({
      [path]: value,
    });
  }

  const toggleEditor = () => {
    if (active) {
      updateValue(null);
      setFooterContent(null);
    } else {
      setFooterContent(<div className={classes.footer}>{hintText}</div>);
    }
    setActive(!active);
  }

  const onChange = (event) => updateValue(event.target.value);

  if (inputProperties.labels) {
    placeholder = inputProperties.labels[active ? 'active' : 'inactive'];
  }

  return (
    <div className={classes.root}>
      <div>
        <span className={classNames(classes.input, {[classes.inactive]: !active})}>
          <Input
            className={classes.innerInput}
            value={(document && document[path]) || defaultValue || ""}
            onChange={onChange}
            placeholder={placeholder || label}
            classes={{input: classes.input}}
            startAdornment={
              <InputAdornment className={classes.button} onClick={toggleEditor} position="start">
                {active ? <LinkOffIcon/> : <LinkIcon />}
              </InputAdornment>
            }
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
