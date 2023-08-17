import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import { SocialMediaSiteName } from '../icons/SocialMediaIcon';
import type { SocialMediaProfileField } from '../../lib/collections/users/schema';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: '100%',
    maxWidth: 350,
    '& input': {
      paddingBottom: 6
    }
  },
  icon: {
    height: 20,
    fill: theme.palette.icon.normal,
    marginRight: 6
  },
  inputAdornment: {
    marginRight: 0
  },
  adornmentText: {
    color: theme.palette.grey[600]
  },
})

export const iconNameByUserFieldName: Record<SocialMediaProfileField|"website", SocialMediaSiteName> = {
  "linkedinProfileURL": "linkedin",
  "facebookProfileURL": "facebook",
  "twitterProfileURL": "twitter",
  "githubProfileURL": "github",
  "website": "website",
};

/**
 * This is similar to a normal text input,
 * except it also displays an inputPrefix to the left of the cursor.
 */
const PrefixedInput = ({ path, inputPrefix, updateCurrentValues, value, classes }: {
  path: string;
  inputPrefix?: string;
  updateCurrentValues<T extends {}>(values: T) : void;
  value: string;
  classes: ClassesType;
}) => {
  const icon = (path in iconNameByUserFieldName) ? (
    <Components.SocialMediaIcon
      className={classes.icon}
      name={iconNameByUserFieldName[path as SocialMediaProfileField|"website"]}
    />
  ) : null

  return <Input
    onChange={e => {
      updateCurrentValues({
        [path]: e.target.value
      })
    }}
    startAdornment={
      <InputAdornment position="start" className={classes.inputAdornment}>
        {icon}
        <span className={classes.adornmentText}>{inputPrefix}</span>
      </InputAdornment>
    }
    value={value}
    className={classes.root}
  />

}

const PrefixedInputComponent = registerComponent("PrefixedInput", PrefixedInput, { styles });

declare global {
  interface ComponentTypes {
    PrefixedInput: typeof PrefixedInputComponent
  }
}
