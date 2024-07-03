import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import * as _ from 'underscore';
import { isFriendlyUI } from '../../themes/forumTheme';

// TODO try importing these from FormGroupLayout
const styles = (theme: ThemeType) => ({
  formSection: {
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.grey300,
    marginBottom: theme.spacing.unit,
    background: theme.palette.background.pageActiveAreaBackground,
    ...(isFriendlyUI ? {borderRadius: 6} : {})
  },
  formSectionCollapsed: {
    display: "none",
  },
  formSectionPadding: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingRight: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*2,
  },
});

type DummyFormGroupProps = {
  label: string,
  startCollapsed: boolean,
  children: React.ReactNode;
}

/**
 * A component designed to mostly look and act like a default styled <FormGroup>
 * but for use outside a form.
 */
const DummyFormGroup = ({
  label,
  startCollapsed,
  children,
  classes
}: DummyFormGroupProps & { classes: ClassesType<typeof styles> }) => {
  const { FormGroupHeader } = Components;
  const [collapsed, setCollapsed] = useState(startCollapsed)

  return (
    <div className={classes.formSection}>
      <FormGroupHeader toggle={() => setCollapsed(!collapsed)} label={label} collapsed={collapsed} />
      <div
        className={classNames(classes.formSectionPadding, {
          [classes.formSectionCollapsed]: collapsed,
        })}
      >
        {children}
      </div>
    </div>
  );
};

const DummyFormGroupComponent = registerComponent('DummyFormGroup', DummyFormGroup, {styles});

declare global {
  interface ComponentTypes {
    DummyFormGroup: typeof DummyFormGroupComponent
  }
}
