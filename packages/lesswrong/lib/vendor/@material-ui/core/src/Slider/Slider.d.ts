import * as React from 'react';
import { StandardProps } from '@/lib/vendor/@material-ui/core/src';
import { ButtonProps } from '@/lib/vendor/@material-ui/core/src/Button';
import { TransitionProps } from 'react-transition-group/Transition';
import { TransitionHandlerProps } from '@/lib/vendor/@material-ui/core/src/transitions/transition';

export interface SliderProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, SliderClassKey, 'onChange'> {
  disabled?: boolean;
  vertical?: boolean;
  max?: number;
  min?: number;
  step?: number;
  value?: number;
  onChange?: (event: React.ChangeEvent<{}>, value: number) => void;
  onDragEnd?: (event: React.ChangeEvent<{}>) => void;
  onDragStart?: (event: React.ChangeEvent<{}>) => void;
}

export type SliderClassKey =
  | 'root'
  | 'container'
  | 'track'
  | 'trackBefore'
  | 'trackAfter'
  | 'thumb'
  | 'focused'
  | 'activated'
  | 'disabled'
  | 'vertical'
  | 'jumped';

declare const Slider: React.ComponentType<SliderProps>;

export default Slider;
