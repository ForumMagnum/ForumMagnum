import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, mergeWithComponents } from '../../lib/vulcan-lib';
import { slugify } from '../../lib/vulcan-lib/utils';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import * as _ from 'underscore';
import { withLocation } from '../../lib/routeUtil';
import { isEAForum } from '../../lib/instanceSettings';

const headerStyles = (theme: ThemeType): JssStyles => ({
  formSectionHeading: {
    cursor: "pointer",
    display:"flex",
    justifyContent: "space-between",
    paddingTop: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
  },
  formSectionHeadingTitle: {
    marginBottom: 5,
    fontSize: "1.25rem",
    fontWeight: isEAForum ? 600 : undefined,
  },
});

const FormGroupHeader = ({ toggle, collapsed, label, classes }: {
  toggle: ()=>void
  collapsed: boolean
  label?: string
  classes: ClassesType
}) => (
  <div className={classes.formSectionHeading} onClick={toggle}>
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

export const groupLayoutStyles = (theme: ThemeType): JssStyles => ({
  formSection: {
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.grey300,
    marginBottom: theme.spacing.unit,
    background: theme.palette.background.pageActiveAreaBackground,
    ...(isEAForum ? {borderRadius: 6} : {})
  },
  formSectionBody: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    borderTop: theme.palette.border.grey300,
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
  }
});

const FormGroupLayout = ({ children, label, heading, footer, collapsed, hasErrors, groupStyling, paddingStyling, flexStyle, toggle, classes }: {
  children: React.ReactNode
  label?: string
  heading: React.ReactNode
  footer: React.ReactNode
  collapsed: boolean
  hasErrors: boolean
  groupStyling: any
  paddingStyling: any
  flexStyle: any
  toggle: ()=>void
  classes: ClassesType
}) => {
  return <div className={classNames(
    { [classes.formSectionPadding]: paddingStyling,
      [classes.formSection]: groupStyling},
    `form-section-${slugify(label||"")}`)}
  >
    {heading}
    <div
      className={classNames(
        {
          [classes.formSectionCollapsed]: collapsed && !hasErrors,
          [classes.formSectionBody]: groupStyling,
          [classes.flex]: flexStyle,
          [classes.formSectionPadding]: groupStyling,
        }
      )}
    >
      {children}
    </div>
    {footer}
  </div>
};

const FormGroupLayoutComponent = registerComponent('FormGroupLayout', FormGroupLayout, {styles: groupLayoutStyles});

interface FormGroupExternalProps extends FormGroupType {
  errors: any[]
  throwError: any
  currentValues: any
  updateCurrentValues: any
  deletedValues: any
  addToDeletedValues: any
  clearFieldErrors: any
  formType: "new"|"edit"
  currentUser: UsersCurrent|null
  formComponents: ComponentTypes
  formProps: any
  disabled: boolean
  fields: FormField<any>[]
}
interface FormGroupProps extends FormGroupExternalProps, WithLocationProps {
}
interface FormGroupState {
  collapsed: boolean
  footerContent: React.ReactNode
}

class FormGroup extends PureComponent<FormGroupProps,FormGroupState> {
  constructor(props: FormGroupProps) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.renderHeading = this.renderHeading.bind(this);
    this.setFooterContent = this.setFooterContent.bind(this);

    const { query } = this.props.location;
    const highlightInFields = query.highlightField && props.fields.map(f => f.name).includes(query.highlightField)
    const collapsed = (props.startCollapsed && !highlightInFields) || false

    this.state = {
      collapsed,
      footerContent: null,
    };
  }

  toggle() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  setFooterContent(footerContent: React.ReactNode) {
    this.setState({ footerContent });
  }

  renderHeading(FormComponents: ComponentTypes) {
    const component = <FormComponents.FormGroupHeader
      toggle={this.toggle}
      label={this.props.label}
      collapsed={this.state.collapsed}
    />
    if (this.props.helpText) {
      return <Tooltip title={this.props.helpText}>
        <span>
        {component}
        </span>
      </Tooltip>
    }
    return component
  }

  // if at least one of the fields in the group has an error, the group as a whole has an error
  hasErrors = () =>
    _.some(this.props.fields, (field: FormField<any>) => {
      return !!this.props.errors.filter((error: any) => error.path === field.path)
        .length;
    });

  render() {
    const { name, fields, formComponents, label, defaultStyle, flexStyle, paddingStyle, formProps } = this.props;
    const { collapsed } = this.state;
    const FormComponents = mergeWithComponents(formComponents);
    const groupStyling = !(name === 'default' || defaultStyle)

    return (
      <FormComponents.FormGroupLayout
        label={label}
        toggle={this.toggle}
        collapsed={collapsed}
        heading={groupStyling ? this.renderHeading(FormComponents) : null}
        footer={this.state.footerContent}
        groupStyling={groupStyling}
        paddingStyling={paddingStyle}
        hasErrors={this.hasErrors()}
        flexStyle={flexStyle}
      >
        {fields.map(field => (
          <FormComponents.FormComponent
            key={field.name}
            disabled={this.props.disabled}
            {...field}
            errors={this.props.errors}
            throwError={this.props.throwError}
            currentValues={this.props.currentValues}
            updateCurrentValues={this.props.updateCurrentValues}
            deletedValues={this.props.deletedValues}
            addToDeletedValues={this.props.addToDeletedValues}
            clearFieldErrors={this.props.clearFieldErrors}
            formType={this.props.formType}
            currentUser={this.props.currentUser}
            formProps={formProps}
            formComponents={FormComponents}
            setFooterContent={this.setFooterContent}
          />
        ))}
      </FormComponents.FormGroupLayout>
    );
  }
}

(FormGroup as any).propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  order: PropTypes.number,
  fields: PropTypes.array.isRequired,
  errors: PropTypes.array.isRequired,
  throwError: PropTypes.func.isRequired,
  currentValues: PropTypes.object.isRequired,
  updateCurrentValues: PropTypes.func.isRequired,
  deletedValues: PropTypes.array.isRequired,
  addToDeletedValues: PropTypes.func.isRequired,
  clearFieldErrors: PropTypes.func.isRequired,
  formType: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
};

const FormGroupComponent = registerComponent<FormGroupExternalProps>('FormGroup', FormGroup, {hocs: [withLocation]});

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
    FormGroupLayout: typeof FormGroupLayoutComponent
    FormGroup: typeof FormGroupComponent
    IconRight: typeof IconRightComponent
    IconDown: typeof IconDownComponent
  }
}
