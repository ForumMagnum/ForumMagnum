import { Components } from "@/lib/vulcan-lib/components";
import React, { useState } from "react";

export const DefaultFormGroupLayout = ({ label, startCollapsed, children }: {
  label: string;
  startCollapsed?: boolean;
  children: React.ReactNode;
}) => {
  const { FormGroupLayout, FormGroupHeader } = Components;
  const [collapsed, setCollapsed] = useState(startCollapsed ?? false);
  return (
    <FormGroupLayout
      label={label}
      collapsed={collapsed}
      heading={<FormGroupHeader
        label={label}
        collapsed={collapsed}
        toggle={() => setCollapsed(!collapsed)}
      />}
      footer={<></>}
      hasErrors={false}
      groupStyling
    >
      {children}
    </FormGroupLayout>
  );
};
