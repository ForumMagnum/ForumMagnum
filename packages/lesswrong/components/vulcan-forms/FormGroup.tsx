import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import * as _ from 'underscore';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { FormGroupLayoutProps } from '../form-components/FormGroupLayout';
import { FormComponentOverridesType } from './propTypes';

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

interface FormControlProps {
  disabled: boolean;
  errors: any[];
  throwError: any;
  currentValues: any;
  updateCurrentValues: any;
  deletedValues: any[];
  addToDeletedValues: any;
  clearFieldErrors: any;
  formType: "new" | "edit";
  currentUser: UsersCurrent | null;
  formProps: any;
  formComponents?: FormComponentOverridesType;
}

interface FormGroupProps<N extends CollectionNameString> extends FormControlProps {
  group: FormGroupType<N>
  fields: FormField<N>[]
}

const FormGroup = ({
  group,
  fields,
  formComponents,
  disabled,
  errors,
  throwError,
  currentValues,
  updateCurrentValues,
  deletedValues,
  addToDeletedValues,
  clearFieldErrors,
  formType,
  currentUser,
  formProps
}: FormGroupProps<CollectionNameString>) => {
  const { query } = useLocation();
  const { name, label, startCollapsed, helpText, hideHeader, layoutComponent, layoutComponentProps } = group;
  const highlightInFields = query.highlightField && fields.map(f => f.name).includes(query.highlightField);
  const [collapsed, setCollapsed] = useState((startCollapsed && !highlightInFields) || false);
  const [footerContent, setFooterContent] = useState<React.ReactNode>(null);

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const renderHeading = useCallback(() => {
    const component = (
      <Components.FormGroupHeader
        toggle={toggle}
        label={label}
        collapsed={collapsed}
      />
    );
    if (helpText) {
      return (
        <Tooltip title={helpText}>
          <span>{component}</span>
        </Tooltip>
      );
    }
    return component;
  }, [label, helpText, collapsed, toggle]);

  const hasErrors = useCallback(() => {
    return _.some(fields, (field: FormField<any>) => {
      return !!errors.filter((error: any) => error.path === field.path).length;
    });
  }, [fields, errors]);

  const groupStyling = !(name === 'default' || (layoutComponentProps?.groupStyling === false));
  const showHeading = groupStyling && !hideHeader;

  const LayoutComponent = 
    (layoutComponent && Components[layoutComponent as ComponentWithProps<FormGroupLayoutProps>])
    || formComponents?.FormGroupLayout
    || Components.FormGroupLayout;

  const formControlProps: FormControlProps = {
    disabled,
    errors,
    throwError,
    currentValues,
    updateCurrentValues,
    deletedValues,
    addToDeletedValues,
    clearFieldErrors,
    formType,
    currentUser,
    formProps,
    formComponents,
  };

  return (
    <LayoutComponent
      label={label}
      collapsed={collapsed}
      heading={showHeading ? renderHeading() : null}
      footer={footerContent}
      groupStyling={groupStyling}
      hasErrors={hasErrors()}
      {...layoutComponentProps}
    >
      {fields.map(field => (
        <Components.FormComponent
          key={field.name}
          {...formControlProps}
          setFooterContent={setFooterContent}
          {...field}
        />
      ))}
    </LayoutComponent>
  );
};

const FormGroupComponent = registerComponent('FormGroup', FormGroup);

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
    FormGroup: typeof FormGroupComponent
    IconRight: typeof IconRightComponent
    IconDown: typeof IconDownComponent
  }
}
