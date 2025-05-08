import React, { useState, useRef } from 'react';
import { Components, ComponentsTable, DeferredComponentsTable, registerComponent } from '../../lib/vulcan-lib/components';
import InputAdornment from '@/lib/vendor/@material-ui/core/src/InputAdornment';
import classNames from 'classnames'
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import LinkIcon from '@/lib/vendor/@material-ui/icons/src/Link'
import LinkOffIcon from '@/lib/vendor/@material-ui/icons/src/LinkOff';
import { UpdateCurrentValues } from '../vulcan-forms/propTypes';

const styles = (theme: ThemeType) => ({
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
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: '16px 19px',
    marginBottom: 32, // NB: This will margin-collapse with the top margin of the next field
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
  hintText: {
    '& a': {
      color: theme.palette.primary.main,
    },
  },
})

const EditUrl = ({ value, path, classes, document, defaultValue, label, hintText, placeholder, updateCurrentValues, setFooterContent }: {
  value: string,
  path: keyof DbPost,
  classes: ClassesType<typeof styles>,
  document: Partial<DbPost>,
  defaultValue?: string,
  label?: string,
  hintText?: string,
  placeholder?: string,
  updateCurrentValues: UpdateCurrentValues,
  setFooterContent: (content: React.ReactNode) => void,
}) => {
  const [active, setActive] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>();
  
  // RobertM: we're deleting the global components table.
  // This form component isn't currently in use, and was only ever used by
  // the FeaturedResources.ctaUrl field.  FeaturedResources don't currently
  // have a form implemented for them.  If any future use of this component
  // needs a hintText component, it should probably just be passed in as a prop.
  
  // let HintTextComponent: React.ComponentClass | React.FC;
  // if (hintText && (hintText in ComponentsTable || hintText in DeferredComponentsTable)) {
  //   HintTextComponent = Components[hintText as keyof ComponentTypes]
  // }

  const updateValue = (value: string | null) => {
    void updateCurrentValues({
      [path]: value,
    });
  }

  const setEditorActive = (value: boolean) => {
    if (value) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      setFooterContent(
        <div className={classes.footer}>
          <Components.Typography variant='body2' className={classes.hintText}>
            {/* {HintTextComponent ? <HintTextComponent /> : hintText} */}
            {hintText}
          </Components.Typography>
        </div>
      );
    } else {
      updateValue(null);
      setFooterContent(null);
    }
    setActive(value);
  }

  const toggleEditor = () => setEditorActive(!active);

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateValue(event.target.value);
  const onFocus = () => setEditorActive(true);
  const onBlur = () => {
    if (!value || value.length < 1) {
      setEditorActive(false);
    }
  }

  return (
    <div className={classes.root}>
      <div>
        <span className={classNames(classes.input, {[classes.inactive]: !active})}>
          <Input
            inputRef={inputRef}
            className={classes.innerInput}
            value={(document && document[path]) || defaultValue || ""}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
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
