import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defaultFilter, getNamesAttachedReactionsByName} from '../../lib/voting/reactions';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  reactionSvg: {
    verticalAlign: "middle",
    marginTop: 1
  },
  invertIfDarkMode: {
    filter: (theme.palette.type==="dark") ? "invert(1)" : undefined,
  },
  invertUnlessDarkMode: {
    filter: (theme.palette.type==="dark") ? undefined : "invert(1)"
  }
})

const ReactionIconInner = ({react, inverted=false, size=18, classes}: {
  react: string,
  inverted?: boolean,
  size?: number,
  classes: ClassesType<typeof styles>
}) => {
  const reactionType = getNamesAttachedReactionsByName(react);
  const opacity = reactionType.filter?.opacity ?? defaultFilter.opacity;
  const saturation = reactionType.filter?.saturate ?? defaultFilter.saturate;
  const padding = reactionType.filter?.padding ? `${reactionType.filter.padding}px` : undefined;

  const scale = reactionType.filter?.scale ?? defaultFilter.scale;
  const translateX = reactionType.filter?.translateX ?? defaultFilter.translateX
  const translateY = reactionType.filter?.translateY ?? defaultFilter.translateY

  return <span
    className={classNames(
      {
        [classes.invertIfDarkMode]: !inverted,
        [classes.invertUnlessDarkMode]: inverted,
      },
    )}
  >
    <img
      src={reactionType.svg}
      style={{
        filter: `opacity(${opacity}) saturate(${saturation})`,
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        padding,
        width:size, height:size,
      }}
      className={classes.reactionSvg}
    />
  </span>
}


export const ReactionIcon = registerComponent('ReactionIcon', ReactionIconInner, {styles});



