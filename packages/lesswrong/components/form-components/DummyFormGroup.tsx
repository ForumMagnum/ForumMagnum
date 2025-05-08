import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import * as _ from 'underscore';
import { isFriendlyUI } from '../../themes/forumTheme';

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
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 16,
    paddingLeft: 16,
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
const DummyFormGroupInner = ({
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

export const DummyFormGroup = registerComponent('DummyFormGroup', DummyFormGroupInner, {styles});

declare global {
  interface ComponentTypes {
    DummyFormGroup: typeof DummyFormGroup
  }
}
