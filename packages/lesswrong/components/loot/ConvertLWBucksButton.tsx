import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';

const styles = defineStyles('ConvertLWBucksButton', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10001,
    padding: '6px 12px',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '16px',
    color: theme.palette.grey[0],
    textShadow: `0.5px 0.5px 0 ${theme.palette.grey[1000]}`,
    background: theme.palette.loot.buyModal.buyButtonBackground,
    border: `4px solid ${theme.palette.grey[1000]}`,
    borderRadius: '0',
    cursor: 'pointer',
    imageRendering: 'pixelated',
    transition: 'transform 0.1s ease, background 0.1s ease',

    '&:hover': {
      background: theme.palette.loot.buyModal.buyButtonBackgroundHover,
      transform: 'scale(1.02)',
    },

    '&:active': {
      background: theme.palette.loot.buyModal.buyButtonBackgroundActive,
      transform: 'translate(2px, 2px)',
    },
  },
  treasureChestImage: {
    width: '30px',
    height: 'auto',
    marginLeft: '10px',
    transform: 'scaleX(-1)',
    imageRendering: 'pixelated',
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

export default ConvertLWBucksButton;
