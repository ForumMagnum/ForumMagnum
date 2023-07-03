import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (_theme: ThemeType): JssStyles => ({
  root: {
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  }
});

const NewFeaturePulse = ({
  className,
  classes,
  children,
  dx=0,
  dy=0,
  width=50,
  height=50,
}: {
  className?: string,
  classes: ClassesType,
  children: React.ReactNode,
  dx?: number;
  dy?: number;
  width?: number;
  height?: number;
}) => { 
  return <span className={classNames(classes.root, className)}>
    <span className={classes.pulse}>
      <svg style={{ position: 'relative', left: dx, top: dy }} width={width} height={height} viewBox={`-50 -50 100 100`}pointerEvents="none" xmlns="http://www.w3.org/2000/svg">
        <circle id="circle" cx="0" cy="0" fill="none" opacity="0" r="10" stroke="#0c869b" strokeWidth="4">
          <animate attributeName="r" from="25" to="50" dur="1.5s" begin="0s" repeatCount="2"/>
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1" dur='1.5s' repeatCount="2"/>
        </circle>
      </svg>
    </span>
    {children}
  </span>
 }

const NewFeaturePulseComponent = registerComponent('NewFeaturePulse', NewFeaturePulse, { styles });

declare global {
  interface ComponentTypes {
    NewFeaturePulse: typeof NewFeaturePulseComponent
  }
}
