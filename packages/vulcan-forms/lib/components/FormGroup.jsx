import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, Utils } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { registerComponent, mergeWithComponents } from 'meteor/vulcan:core';

const headerStyles = theme => ({
  formSectionHeading: {
    cursor: "pointer",
    display:"flex",
    justifyContent: "space-between",
    paddingTop: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
  },
});

const FormGroupHeader = ({ toggle, collapsed, label, classes }) => (
  <div className={classes.formSectionHeading} onClick={toggle}>
    <h3 className="form-section-heading-title">{label}</h3>
    <span className="form-section-heading-toggle">
      {collapsed ? (
        <Components.IconRight height={16} width={16} />
      ) : (
        <Components.IconDown height={16} width={16} />
      )}
    </span>
  </div>
);
FormGroupHeader.propTypes = {
  toggle: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  collapsed: PropTypes.bool
};
registerComponent({ name: 'FormGroupHeader', component: FormGroupHeader,
  hocs: [withStyles(headerStyles, {name: "FormGroupHeader"})]});

const groupLayoutStyles = theme => ({
  formSection: {
    fontFamily: theme.typography.fontFamily,
    border: `solid 1px ${theme.palette.grey[400]}`,
    marginBottom: theme.spacing.unit,
  },
  formSectionFields: {
    paddingRight: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*2,
    [theme.breakpoints.down('md')]: {
      paddingLeft: theme.spacing.unit/2,
      paddingRight: theme.spacing.unit/2,
    },
  },
  formSectionBody: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    borderTop: `solid 1px ${theme.palette.grey[300]}`,
  },
  flex: {
    display: "flex",
    alignItems: "flex-start",
    flexWrap: "wrap"
  }
});

const FormGroupLayout = ({ children, label, heading, collapsed, hasErrors, groupStyling, flexStyle, classes }) => {
  return <div className={classNames(
    {[classes.formSection]: groupStyling},
    `form-section-${Utils.slugify(label)}`)}
  >
    {heading}
    <div
      className={classNames(
        classes.formSectionFields,
        {
          'form-section-collapsed': collapsed && !hasErrors,
          [classes.formSectionBody]: groupStyling,
          [classes.flex]: flexStyle,
        }
      )}
    >
      {children}
    </div>
  </div>
};
FormGroupLayout.propTypes = {
  hasErrors: PropTypes.bool,
  collapsed: PropTypes.bool,
  heading: PropTypes.node,
  children: PropTypes.node
};
registerComponent({ name: 'FormGroupLayout', component: FormGroupLayout,
  hocs: [withStyles(groupLayoutStyles, {name: "FormGroupLayout"})]});

class FormGroup extends PureComponent {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.renderHeading = this.renderHeading.bind(this);
    this.state = {
      collapsed: props.startCollapsed || false
    };
  }

  toggle() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  renderHeading(FormComponents) {
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
    _.some(this.props.fields, field => {
      return !!this.props.errors.filter(error => error.path === field.path)
        .length;
    });

  render() {
    const { name, fields, formComponents, label, defaultStyle, flexStyle } = this.props;
    const { collapsed } = this.state;
    const FormComponents = mergeWithComponents(formComponents);
    const groupStyling = !(name === 'default' || defaultStyle)

    return (
      <FormComponents.FormGroupLayout
        label={label}
        toggle={this.toggle}
        collapsed={collapsed}
        heading={groupStyling ? this.renderHeading(FormComponents) : null}
        groupStyling={groupStyling}
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
            formComponents={FormComponents}
          />
        ))}
      </FormComponents.FormGroupLayout>
    );
  }
}

FormGroup.propTypes = {
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
  currentUser: PropTypes.object
};

module.exports = FormGroup;

registerComponent('FormGroup', FormGroup);

const IconRight = ({ width = 24, height = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
  >
    <polyline
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      points="5.5,23.5 18.5,12 5.5,0.5"
      id="Outline_Icons"
    />
    <rect fill="none" width="24" height="24" id="Frames-24px" />
  </svg>
);

registerComponent('IconRight', IconRight);

const IconDown = ({ width = 24, height = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
  >
    <polyline
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      points="0.501,5.5 12.001,18.5 23.501,5.5"
      id="Outline_Icons"
    />
    <rect fill="none" width="24" height="24" id="Frames-24px" />
  </svg>
);

registerComponent('IconDown', IconDown);
