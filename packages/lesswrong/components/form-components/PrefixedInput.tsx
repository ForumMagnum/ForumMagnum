import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import InputAdornment from '@/lib/vendor/@material-ui/core/src/InputAdornment';
import type { SocialMediaProfileField } from '../../lib/collections/users/helpers';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { FormComponentFriendlyTextInput } from './FormComponentFriendlyTextInput';
import SocialMediaIcon from "../icons/SocialMediaIcon";

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
    name: TypedFieldApi<string | null | undefined>['name'];
    state: Pick<TypedFieldApi<string | null | undefined>['state'], 'value'>;
    handleChange: TypedFieldApi<string | null | undefined>['handleChange'];
  };
  inputPrefix?: string,
  heading?: string,
  smallBottomMargin?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
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
      value={value ?? null}
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

export default registerComponent("PrefixedInput", PrefixedInput, { styles });


