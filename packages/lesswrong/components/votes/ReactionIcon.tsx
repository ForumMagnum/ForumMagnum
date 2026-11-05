import React from 'react';
import { defaultFilter, getNamesAttachedReactionsByName} from '../../lib/voting/reactions';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const baseFilter = "opacity(var(--reaction-opacity)) saturate(var(--reaction-saturate))";
const invertedFilter = `${baseFilter} invert(1)`;

// Filter lives on the img only; a filtered wrapper span misplaces icons in iOS Safari.
const styles = defineStyles('ReactionIcon', (theme: ThemeType) => ({
  reactionSvg: {
    verticalAlign: "middle",
    marginTop: 1
  },
  invertIfDarkMode: {
    filter: (theme.palette.type==="dark") ? invertedFilter : baseFilter,
  },
  invertUnlessDarkMode: {
    filter: (theme.palette.type==="dark") ? baseFilter : invertedFilter,
  }
}))

const ReactionIcon = ({react, inverted=false, size=18}: {
  react: string,
  inverted?: boolean,
  size?: number,
}) => {
  const classes = useStyles(styles);
  const reactionType = getNamesAttachedReactionsByName(react);
  const opacity = reactionType.filter?.opacity ?? defaultFilter.opacity;
  const saturation = reactionType.filter?.saturate ?? defaultFilter.saturate;
  const padding = reactionType.filter?.padding ? `${reactionType.filter.padding}px` : undefined;

  const scale = reactionType.filter?.scale ?? defaultFilter.scale;
  const translateX = reactionType.filter?.translateX ?? defaultFilter.translateX
  const translateY = reactionType.filter?.translateY ?? defaultFilter.translateY

  const filterVars = {
    "--reaction-opacity": opacity,
    "--reaction-saturate": saturation,
  } as React.CSSProperties;

  return <span>
    <img
      src={reactionType.svg}
      style={{
        ...filterVars,
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        padding,
        width:size, height:size,
      }}
      className={classNames(classes.reactionSvg, {
        [classes.invertIfDarkMode]: !inverted,
        [classes.invertUnlessDarkMode]: inverted,
      })}
    />
  </span>
}


export default ReactionIcon;



