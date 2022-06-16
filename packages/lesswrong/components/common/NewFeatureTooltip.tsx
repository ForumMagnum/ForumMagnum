import classNames from 'classnames';
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
    root: {
      // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
      display: "inline-block",
    },
    tooltip: {
      background: 'blue',
      width: 5,
      height: 5,
      borderRadius: '50%',
      alignSelf: 'center',
      position: 'absolute',
      right: 5
    },
    wrapper: {
      display: 'flex',
      position: 'relative'
    }
  })
/**
 * 
 * @param props 
 * @returns 
 */
const NewFeatureTooltip = ({classes, children, className, text} :
  { classes : ClassesType, 
    children: any, 
    /**
     * Test
     */
    className?: string,
    text: string
  }) => {

  return <div className={classes.wrapper}>
    {children}
    <span className={classNames(classes.tooltip, className)}/>
  </div>
}


const LWTooltipComponent = registerComponent("NewFeatureTooltip", NewFeatureTooltip, {
  styles,
  stylePriority: -1
});

declare global {
  interface ComponentTypes {
    NewFeatureTooltip: typeof LWTooltipComponent
  }
}
