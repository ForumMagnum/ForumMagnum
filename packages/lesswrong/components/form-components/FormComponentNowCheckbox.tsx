import React, { useMemo } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  root: {
    marginRight:theme.spacing.unit*3,
    marginTop: 5,
    display: "flex",
    alignItems: "center"
  },
  size: {
    width:36,
    height:0
  },
  inline: {
    display: "inline",
    cursor: "pointer",
  },
  blurb: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[800]
  },
  warningButton: {
    border: `1px solid ${theme.palette.error.main} !important`,
    color: theme.palette.error.main
  }
})

// TODO rename
const FormComponentNowCheckbox = (
  { classes, value, updateCurrentValues, ...otherProps }: FormComponentProps<boolean> & {
    classes: ClassesType<typeof styles>
  }
) => {
  const { FormComponentCheckbox, EAButton } = Components;

  return (
    <>
      <div>
        <p className={classes.blurb}>
          Deactivating your account means your posts and comments will be listed as '[Anonymous]', and your user profile
          won't accessible. This can be reversed at any time.
        </p>
        <EAButton variant="contained">Deactivate account</EAButton>
        <p className={classes.blurb}>
          Permanently delete your data from the Forum and associated services, in compliance with GDPR. You will be asked
          for confirmation before continuing.
        </p>
        <EAButton className={classes.warningButton} variant="outlined">
          Request permanent account deletion
        </EAButton>
      </div>
    </>
  );
};

const FormComponentNowCheckboxComponent = registerComponent("FormComponentNowCheckbox", FormComponentNowCheckbox, { styles });

declare global {
  interface ComponentTypes {
    FormComponentNowCheckbox: typeof FormComponentNowCheckboxComponent
  }
}

