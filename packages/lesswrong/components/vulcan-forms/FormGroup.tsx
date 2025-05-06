import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import * as _ from 'underscore';
import { isFriendlyUI } from '../../themes/forumTheme';

const headerStyles = (theme: ThemeType) => ({
  formSectionHeading: {
    cursor: "pointer",
    display:"flex",
    justifyContent: "space-between",
    paddingTop: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
  },
  formSectionHeadingExpanded: {
    borderBottom: theme.palette.border.grey300,
  },
  formSectionHeadingTitle: {
    marginBottom: 5,
    fontSize: "1.25rem",
    fontWeight: isFriendlyUI ? 600 : undefined,
  },
});

const FormGroupHeader = ({ toggle, collapsed, label, classes }: {
  toggle: () => void
  collapsed: boolean
  label?: string
  classes: ClassesType<typeof headerStyles>
}) => (
  <div className={classNames(classes.formSectionHeading, {
    [classes.formSectionHeadingExpanded]: !collapsed
  })} onClick={toggle}>
    <h3 className={classes.formSectionHeadingTitle}>{label}</h3>
    <span className="form-section-heading-toggle">
      {collapsed ? (
        <Components.IconRight height={16} width={16} />
      ) : (
        <Components.IconDown height={16} width={16} />
      )}
    </span>
  </div>
);

const FormGroupHeaderComponent = registerComponent('FormGroupHeader', FormGroupHeader, {
  styles: headerStyles
});

const IconRight = ({ width = 24, height = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
  >
    <polyline
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      points="5.5,23.5 18.5,12 5.5,0.5"
      id="Outline_Icons"
    />
    <rect fill="none" width="24" height="24" id="Frames-24px" />
  </svg>
);

const IconRightComponent = registerComponent('IconRight', IconRight);

const IconDown = ({ width = 24, height = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
  >
    <polyline
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      points="0.501,5.5 12.001,18.5 23.501,5.5"
      id="Outline_Icons"
    />
    <rect fill="none" width="24" height="24" id="Frames-24px" />
  </svg>
);

const IconDownComponent = registerComponent('IconDown', IconDown);

declare global {
  interface ComponentTypes {
    FormGroupHeader: typeof FormGroupHeaderComponent
    IconRight: typeof IconRightComponent
    IconDown: typeof IconDownComponent
  }
}
