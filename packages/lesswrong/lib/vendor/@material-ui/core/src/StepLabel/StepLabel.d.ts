import * as React from 'react';
import { StandardProps } from '..';
import { Orientation } from '../Stepper';
import { StepButtonIcon } from '../StepButton';
import { StepIconProps } from '../StepIcon';

export interface StepLabelProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, StepLabelClasskey> {
  active?: boolean;
  alternativeLabel?: boolean;
  children: React.ReactNode;
  completed?: boolean;
  disabled?: boolean;
  error?: boolean;
  icon?: StepButtonIcon;
  last?: boolean;
  optional?: React.ReactNode;
  orientation?: Orientation;
  StepIconComponent?: React.ReactType;
  StepIconProps?: Partial<StepIconProps>;
}

export type StepLabelClasskey =
  | 'root'
  | 'horizontal'
  | 'vertical'
  | 'active'
  | 'completed'
  | 'alternativeLabel'
  | 'error'
  | 'disabled'
  | 'label'
  | 'iconContainer'
  | 'labelContainer';

declare const StepLabel: React.ComponentType<StepLabelProps>;

export default StepLabel;
