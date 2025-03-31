import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('BuyButton', (theme: ThemeType) => ({
  root: {
    // --- Base Button Styles ---
    padding: '10px 20px', // Generous padding
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '16px', // Adjust size as needed
    fontWeight: 'bold',
    color: theme.palette.loot.buyButton.color, // Bright yellow text
    textShadow: theme.palette.loot.buyButton.textShadowColor, // Orange pixelated text shadow for contrast/depth
    textTransform: 'uppercase', // Common CTA style
    cursor: 'pointer',
    
    // --- Pixel Art Look ---
    border: `3px solid ${theme.palette.text.alwaysBlack}`, // Thick black border
    backgroundImage: theme.palette.loot.buyButton.backgroundImage, // Sharp green gradient
    backgroundSize: '100% 6px', // Creates horizontal pixelated stripes for the gradient
    imageRendering: 'pixelated', // Crucial for sharp edges on background
    boxShadow: `4px 4px 0px 0px ${theme.palette.text.alwaysBlack}`, // Hard pixelated drop shadow
    
    // --- Interactivity ---
    transition: 'transform 0.05s linear, box-shadow 0.05s linear', // Quick, snappy transitions
    
    '&:hover': {
      backgroundImage: theme.palette.loot.buyButton.backgroundImageHover, // Slightly brighter green on hover
      // Slight lift effect
      transform: 'translate(-1px, -1px)',
      boxShadow: `5px 5px 0px ${theme.palette.text.alwaysBlack}`, 
    },
    
    '&:active': {
      transform: 'translate(2px, 2px)', // "Pushed down" effect
      boxShadow: `2px 2px 0px ${theme.palette.text.alwaysBlack}`, // Shadow moves with the button
      backgroundImage: theme.palette.loot.buyButton.backgroundImageActive, // Darker green when pressed
    }
  }
}));

const BuyButton = () => {
  const classes = useStyles(styles);

  async function handleClick() {
    const response = await fetch('/loot-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const { url } = await response.json();
    window.location.href = url;
  }

  return <button className={classes.root} onClick={handleClick}>Buy PicoLightcones!</button>
}

const BuyButtonComponent = registerComponent('BuyButton', BuyButton);

export default BuyButtonComponent;

declare global {
  interface ComponentTypes {
    BuyButton: typeof BuyButtonComponent
  }
}
