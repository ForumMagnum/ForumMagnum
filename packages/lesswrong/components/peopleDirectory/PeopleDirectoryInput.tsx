import React, { ChangeEvent, MutableRefObject, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { ForumIconName } from "../common/ForumIcon";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.grey[0],
    color: theme.palette.grey[1000],
  },
  border: {
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  icon: {
    marginLeft: 12,
    marginRight: -8,
    height: 16,
  },
  input: {
    width: "100%",
    background: theme.palette.greyAlpha(0),
    padding: "12px",
    fontSize: 14,
    fontWeight: 500,
  },
});

const PeopleDirectoryInputInner = ({
  value,
  setValue,
  icon,
  noBorder,
  placeholder,
  inputRef,
  classes,
}: {
  value?: string,
  setValue?: (newValue: string) => void,
  icon?: ForumIconName,
  noBorder?: boolean,
  placeholder?: string,
  inputRef?: MutableRefObject<HTMLInputElement | null>,
  classes: ClassesType<typeof styles>,
}) => {
  const onChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setValue?.(ev.target?.value ?? "");
  }, [setValue]);
  const {ForumIcon} = Components;
  return (
    <div className={classNames(classes.root, {[classes.border]: !noBorder})}>
      {icon && <ForumIcon icon={icon} className={classes.icon} />}
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={classes.input}
        ref={inputRef}
      />
    </div>
  );
}

export const PeopleDirectoryInput = registerComponent(
  "PeopleDirectoryInput",
  PeopleDirectoryInputInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryInput: typeof PeopleDirectoryInput
  }
}
