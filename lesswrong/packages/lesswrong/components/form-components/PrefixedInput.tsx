import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import InputAdornment from '@material-ui/core/InputAdornment';
import type { SocialMediaProfileField } from '../../lib/collections/users/helpers';

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: -10,
  },
  icon: {
    height: 20,
    fill: theme.palette.grey[1000],
    marginRight: 8
  },
  inputAdornment: {
    marginRight: 0,
    whiteSpace: "nowrap",
  },
  adornmentText: {
    color: theme.palette.grey[600]
  },
});

export const iconNameByUserFieldName: Record<SocialMediaProfileField|"website", SocialMediaSiteName> = {
  "linkedinProfileURL": "linkedin",
  "facebookProfileURL": "facebook",
  "blueskyProfileURL": "bluesky",
  "twitterProfileURL": "twitter",
  "githubProfileURL": "github",
  "website": "website",
};

/**
 * This is similar to a normal text input,
 * except it also displays an inputPrefix to the left of the cursor.
 */
const PrefixedInput = ({
  label,
  heading,
  inputPrefix,
  path,
  classes,
  ...props
}: FormComponentProps<string> & {
  inputPrefix?: string,
  heading?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {SocialMediaIcon, FormComponentFriendlyTextInput} = Components;

  const icon = (path in iconNameByUserFieldName) ? (
    <SocialMediaIcon
      className={classes.icon}
      name={iconNameByUserFieldName[path as SocialMediaProfileField|"website"]}
    />
  ) : null

  return (
    <FormComponentFriendlyTextInput
      {...props}
      startAdornment={
        <InputAdornment position="start" className={classes.inputAdornment}>
          {icon}
          <span className={classes.adornmentText}>{inputPrefix}</span>
        </InputAdornment>
      }
      path={path}
      label={heading}
      className={classes.root}
    />
  );
}

const PrefixedInputComponent = registerComponent("PrefixedInput", PrefixedInput, { styles });

declare global {
  interface ComponentTypes {
    PrefixedInput: typeof PrefixedInputComponent
  }
}
