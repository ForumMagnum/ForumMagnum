import React, { useState } from "react";
import { TooltipSpan } from "../common/FMTooltip";
import FormGroupLayout from "../form-components/FormGroupLayout";
import { FormGroupHeader } from "../vulcan-forms/FormGroup";

export const LegacyFormGroupLayout = ({
  label,
  startCollapsed,
  hideHeader,
  groupStyling = true,
  paddingStyling,
  flexStyling,
  flexAlignTopStyling,
  tooltipText,
  children,
}: {
  label?: string;
  startCollapsed?: boolean;
  hideHeader?: boolean;
  groupStyling?: boolean;
  paddingStyling?: boolean;
  flexStyling?: boolean;
  flexAlignTopStyling?: boolean;
  tooltipText?: string;
  children: React.ReactNode;
}) => {
  const [collapsed, setCollapsed] = useState(startCollapsed ?? false);

  const heading = <FormGroupHeader
    label={label}
    collapsed={collapsed}
    toggle={() => setCollapsed(!collapsed)}
  />;

  const wrappedHeading = tooltipText
    ? <TooltipSpan title={tooltipText}>{heading}</TooltipSpan>
    : heading;

  const displayedHeading = hideHeader || !groupStyling
    ? null
    : wrappedHeading;

  return (
    <FormGroupLayout
      label={label}
      collapsed={collapsed}
      heading={displayedHeading}
      footer={<></>}
      hasErrors={false}
      groupStyling={groupStyling}
      paddingStyling={paddingStyling}
      flexStyling={flexStyling}
      flexAlignTopStyling={flexAlignTopStyling}
    >
      {children}
    </FormGroupLayout>
  );
};
