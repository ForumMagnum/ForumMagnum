import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export const StatusCodeSetter = ({status}: {
  status: number
}) => {
  return <div {...{"data-response-status": status}}/>
}
