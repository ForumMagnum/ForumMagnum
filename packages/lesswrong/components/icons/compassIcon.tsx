import React from 'react';
import { useTheme } from '../themes/useTheme';
import { GhibliIconPath } from '../themes/ghibli/GhibliIcon';

export const CompassIcon = () => {
  const theme = useTheme();
  if (theme.themeOptions.name === 'ghiblify') {
    return <GhibliIconPath path="/ghibli/compass.png"/>;
  }

  return <svg version="1.1" x="0px" y="0px" viewBox="0 0 100 100">
    <g fill="currentColor">
      <path d="M29.1,29.2l6.4,11.6l4.3-0.8l0.8-4.3L29.1,29.2z M40.7,64.5l-0.8-4.3l-4.3-0.8L29.2,71L40.7,64.5z M70.9,70.9l-6.4-11.6l-4.3,0.8l-0.8,4.3L70.9,70.9z M64.4,40.8l6.4-11.6l-11.6,6.4l0.8,4.3L64.4,40.8z M67.4,58.8l10.8,19.4L58.8,67.4L50,98.8l-8.8-31.4L21.9,78.2l10.8-19.4L1.2,50.1l31.4-8.8L21.9,21.9l19.4,10.8L50,1.3l8.8,31.4l19.4-10.8L67.4,41.3L98.8,50L67.4,58.8zM57.7,57.8L83.5,50L50,50.1l7.7-7.7L50,16.6v33.5l-7.7-7.7l-25.8,7.7H50l-7.7,7.7L50,83.5V50.1L57.7,57.8z"/>
    </g>
  </svg>
}

export const compassIcon = <CompassIcon/>
