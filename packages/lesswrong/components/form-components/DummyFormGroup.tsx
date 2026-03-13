import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { FormGroupHeader } from "./FormGroupHeader";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('DummyFormGroup', (theme: ThemeType) => ({
  formSection: {
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.grey300,
    marginBottom: 8,
    background: theme.palette.background.pageActiveAreaBackground,
    ...(theme.isFriendlyUI ? {borderRadius: 6} : {})
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
}));

type DummyFormGroupProps = {
  label: string,
  startCollapsed: boolean,
  children: React.ReactNode;
}

/**
 * A component designed to mostly look and act like a default styled <FormGroup>
 * but for use outside a form.
 */
const DummyFormGroup = ({label, startCollapsed, children}: DummyFormGroupProps) => {
  const classes = useStyles(styles);
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

export default DummyFormGroup;


