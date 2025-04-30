import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import InputAdornment from '@/lib/vendor/@material-ui/core/src/InputAdornment';
import type { SocialMediaProfileField } from '../../lib/collections/users/helpers';
import type { TypedFieldApi } from '../tanstack-form-components/BaseAppForm';

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
  field,
  heading,
  inputPrefix,
  smallBottomMargin,
  classes,
}: {
  field: {
    name: TypedFieldApi<string | null>['name'];
    state: Pick<TypedFieldApi<string | null>['state'], 'value'>;
    handleChange: TypedFieldApi<string | null>['handleChange'];
  };
  inputPrefix?: string,
  heading?: string,
  smallBottomMargin?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {SocialMediaIcon, FormComponentFriendlyTextInput} = Components;

  const value = field.state.value;
  const fieldName = field.name;

  const icon = (fieldName in iconNameByUserFieldName) ? (
    <SocialMediaIcon
      className={classes.icon}
      name={iconNameByUserFieldName[fieldName as SocialMediaProfileField|"website"]}
    />
  ) : null

  return (
    <FormComponentFriendlyTextInput
      value={value}
      startAdornment={
        <InputAdornment position="start" className={classes.inputAdornment}>
          {icon}
          <span className={classes.adornmentText}>{inputPrefix}</span>
        </InputAdornment>
      }
      updateCurrentValue={field.handleChange}
      label={heading}
      className={classes.root}
      smallBottomMargin={smallBottomMargin}
    />
  );
}

const PrefixedInputComponent = registerComponent("PrefixedInput", PrefixedInput, { styles });

declare global {
  interface ComponentTypes {
    PrefixedInput: typeof PrefixedInputComponent
  }
}
