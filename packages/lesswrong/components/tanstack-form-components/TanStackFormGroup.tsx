import React, { useCallback, useState } from 'react';
import Tooltip from '@/lib/vendor/@material-ui/core/src/Tooltip';
import classNames from 'classnames';
import { Components } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { AnyFormApi } from '@tanstack/react-form';
import type { FormGroupLayoutProps } from '../form-components/FormGroupLayout';

const headerStyles = defineStyles('TanStackFormGroupHeader', (theme: ThemeType) => ({
  formSectionHeading: {
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 2,
  },
  formSectionHeadingExpanded: {
    borderBottom: theme.palette.border.grey300,
  },
  formSectionHeadingTitle: {
    marginBottom: 5,
    fontSize: '1.25rem',
    fontWeight: isFriendlyUI ? 600 : undefined,
  },
}));

const FormGroupHeader = ({
  toggle,
  collapsed,
  label,
}: {
  toggle: () => void;
  collapsed: boolean;
  label?: string;
}) => {
  const classes = useStyles(headerStyles);
  return (
    <div
      className={classNames(classes.formSectionHeading, {
        [classes.formSectionHeadingExpanded]: !collapsed,
      })}
      onClick={toggle}
    >
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
};

interface GroupMeta {
  name?: string;
  label?: string;
  startCollapsed?: boolean;
  helpText?: string;
  hideHeader?: boolean;
  OverrideLayoutComponent?: React.ComponentType<FormGroupLayoutProps>;
  layoutComponentProps?: any;
}

interface TanStackFormGroupProps {
  group: GroupMeta;
  form: AnyFormApi;
  children: ({ setFooterContent }: { setFooterContent: (content: React.ReactNode) => void }) => React.ReactNode;
}

export function TanStackFormGroup({
  group,
  form,
  children,
}: TanStackFormGroupProps) {
  const { query } = useLocation();
  const {
    name,
    label,
    startCollapsed,
    helpText,
    hideHeader,
    OverrideLayoutComponent,
    layoutComponentProps,
  } = group;

  const [footerContent, setFooterContent] = useState<React.ReactNode>(null);
  const renderedChildren = children({ setFooterContent });

  const childFieldNames = React.Children.toArray(renderedChildren)
    .map((c: React.ReactElement) => c?.props?.name)
    .filter(name => !!name);

  const highlightInFields = query.highlightField && childFieldNames.includes(query.highlightField);

  const [collapsed, setCollapsed] = useState((startCollapsed && !highlightInFields) || false);

  const toggle = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const hasErrors = form.state.errors.length && form.state.errors.some(error => error.path === name);

  const groupStyling = !(name === 'default' || layoutComponentProps?.groupStyling === false);
  const showHeading = groupStyling && !hideHeader;

  const LayoutComponent = OverrideLayoutComponent ?? Components.FormGroupLayout;

  const headingNode = showHeading
    ? helpText
      ? (<Tooltip title={helpText}>
          <span>
            <FormGroupHeader toggle={toggle} label={label} collapsed={collapsed} />
          </span>
        </Tooltip>)
      : (<FormGroupHeader toggle={toggle} label={label} collapsed={collapsed} />)
    : null;

  return (
    <LayoutComponent
      label={label}
      collapsed={collapsed}
      heading={headingNode}
      footer={footerContent}
      groupStyling={groupStyling}
      hasErrors={hasErrors}
      {...layoutComponentProps}
    >
      {renderedChildren}
    </LayoutComponent>
  );
}
