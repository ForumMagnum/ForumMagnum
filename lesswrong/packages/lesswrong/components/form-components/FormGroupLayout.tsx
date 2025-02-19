import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import * as _ from 'underscore';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { FormControlProps } from '../vulcan-forms/FormGroup';
import { slugify } from '@/lib/utils/slugify';

const styles = (theme: ThemeType) => ({
  formSection: {
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.grey300,
    marginBottom: theme.spacing.unit,
    background: theme.palette.background.pageActiveAreaBackground,
    ...(isFriendlyUI ? {borderRadius: 6} : {})
  },
  formSectionBody: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
  formSectionPadding: {
    paddingRight: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*2,
  },
  formSectionCollapsed: {
    display: "none",
  },
  flex: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap"
  },
  flexAlignTop: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap"
  }
});

export interface FormGroupLayoutProps {
  children: React.ReactNode;
  label?: string;
  heading: React.ReactNode;
  footer: React.ReactNode;
  collapsed: boolean;
  hasErrors: boolean;
  /** Whether to style this as an expandable group */
  groupStyling?: boolean;
  paddingStyling?: boolean;
  flexStyling?: boolean;
  flexAlignTopStyling?: boolean;
  formControlProps: FormControlProps;
}

/**
 * Default component for the inside of a form group (the bit below the header, if using group styling). This
 * can be overriden by specifying a `layoutComponent` on the form group, or by setting the `formComponents` prop
 * on a form.
 */
const FormGroupLayout = ({
  children,
  label,
  heading,
  footer,
  collapsed,
  hasErrors,
  groupStyling,
  paddingStyling,
  flexStyling,
  flexAlignTopStyling,
  classes
}: FormGroupLayoutProps & { classes: ClassesType<typeof styles> }) => {
  return (
    <div
      className={classNames(
        { [classes.formSectionPadding]: paddingStyling, [classes.formSection]: groupStyling },
        `form-section-${slugify(label || "")}`
      )}
    >
      {heading}
      <div
        className={classNames({
          [classes.formSectionCollapsed]: collapsed && !hasErrors,
          [classes.formSectionBody]: groupStyling,
          [classes.flex]: flexStyling,
          [classes.flexAlignTop]: flexAlignTopStyling,
          [classes.formSectionPadding]: groupStyling,
        })}
      >
        {children}
      </div>
      {footer}
    </div>
  );
};

const FormGroupLayoutComponent = registerComponent('FormGroupLayout', FormGroupLayout, {styles});

declare global {
  interface ComponentTypes {
    FormGroupLayout: typeof FormGroupLayoutComponent
  }
}
