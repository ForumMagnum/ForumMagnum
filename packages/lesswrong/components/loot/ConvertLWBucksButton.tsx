import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';
// Assuming ThemeType is defined elsewhere
// import { ThemeType } from 'your-theme-definition';

const styles = defineStyles('ConvertLWBucksButton', (theme: ThemeType) => ({
  root: {
    display: 'flex', // Use flexbox for layout
    alignItems: 'center', // Vertically center items
    justifyContent: 'center', // Horizontally center items
    position: 'relative',
    zIndex: 10001,
    padding: '6px 12px',
    fontFamily: '"Press Start 2P", cursive', // Pixel font (ensure loaded globally)
    fontSize: '16px', // Adjust as needed
    color: 'white', // White text
    // Thick black outline/shadow for pixel effect
    textShadow: '0.5px 0.5px 0 #000',
    // Bright gold gradient background
    background: 'linear-gradient(180deg, #f7d04f 0%, #e5a934 100%)',
    border: '4px solid #000', // Thick black border
    borderRadius: '0', // Sharp corners for pixel style
    cursor: 'pointer',
    imageRendering: 'pixelated', // Keep borders sharp
    transition: 'transform 0.1s ease, background 0.1s ease', // Smoothish transitions

    // Hover state
    '&:hover': {
      background: 'linear-gradient(180deg, #ffe070 0%, #f5b944 100%)', // Brighter gold
      transform: 'scale(1.02)', // Slight grow effect
    },

    // Active (pressed) state
    '&:active': {
      background: 'linear-gradient(180deg, #e5a934 0%, #d3982a 100%)', // Darker gold
      transform: 'translate(2px, 2px)', // "Pushed down" effect
    },
  },
  treasureChestImage: {
    width: '30px',
    height: 'auto',
    marginLeft: '10px', // Space out image from text
    transform: 'scaleX(-1)', // Keep the mirror effect if desired
    imageRendering: 'pixelated', // Keep image sharp/pixelated
    // verticalAlign is no longer needed due to flexbox alignment
  }
}));

const ConvertLWBucksButton = () => {
  const classes = useStyles(styles);

  const { openDialog } = useDialog();

  function handleClick() {
    openDialog({
      componentName: 'BuyBoxesModal',
      componentProps: {},
    })
  }

  return <button className={classes.root} onClick={handleClick}>
    {'Search for hidden virtues!'}
    <img
      src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743370814/ChatGPT_Image_Mar_30_2025_02_39_36_PM_vhrh9w.png"
      className={classes.treasureChestImage}
    />
  </button>
}

const ConvertLWBucksButtonComponent = registerComponent('ConvertLWBucksButton', ConvertLWBucksButton);

export default ConvertLWBucksButtonComponent;

declare global {
  interface ComponentTypes {
    ConvertLWBucksButton: typeof ConvertLWBucksButtonComponent
  }
}
