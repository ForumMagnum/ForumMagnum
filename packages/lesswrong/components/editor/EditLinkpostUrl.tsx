import React, { useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: '100%',
    padding: 12,
    margin: "12px 0 16px 0",
    backgroundColor: theme.palette.grey[100],
    boxSizing: 'border-box',
    borderRadius: theme.borderRadius.default,
    fontSize: 14,
  },
  input: {
    marginTop: theme.spacing.unit,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderRadius: theme.borderRadius.default,
    padding: '8px 8px 7px 8px',
    color: theme.palette.grey[600],
  },
  title: {
    color: theme.palette.grey[1000],
  }
});

const EditLinkpostUrl = ({ value, path, classes, document, defaultValue, placeholder, updateCurrentValues }: {
  value: string,
  path: keyof DbPost,
  classes: ClassesType,
  document: Partial<DbPost>,
  defaultValue?: string,
  placeholder?: string,
  updateCurrentValues<T extends {}>(values: T) : void,
}) => {
  const [active, setActive] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>();

  const { postCategory } = document;
  if (postCategory !== "linkpost") return null;

  const updateValue = (value: string | null) => {
    updateCurrentValues({
      [path]: value,
    });
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateValue(event.target.value);
  const onFocus = () => setActive(true);
  const onBlur = () => {
    if (!value || value.length < 1) {
      setActive(false);
    }
  }

  return (
    <div className={classes.root}>
      <Components.Typography variant='body2' className={classes.title}>This is a linkpost for</Components.Typography>
      <Input
        inputRef={inputRef}
        className={classes.input}
        value={(document && document[path]) || defaultValue || ""}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disableUnderline
        fullWidth
      />
    </div>
  );
}

export const EditLinkpostUrlComponent = registerComponent("EditLinkpostUrl", EditLinkpostUrl, {styles});

declare global {
  interface ComponentTypes {
    EditLinkpostUrl: typeof EditLinkpostUrlComponent
  }
}
