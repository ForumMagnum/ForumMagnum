import React, { useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import type { NamesAttachedReactionsList, QuoteLocator } from '../../../lib/voting/namesAttachedReactions';
import type { VotingProps } from '../votingProps';
import classNames from 'classnames';
import { HoveredReactionListContext } from './HoveredReactionContextProvider';

const styles = (theme: ThemeType): JssStyles => ({
  highlight: {
    "&:hover": {
      backgroundColor: theme.palette.grey[200],
    },
  },
  
  reactionTypeHovered: {
    backgroundColor: theme.palette.background.primaryTranslucentHeavy,
  },

  // Comment or post hovered
  "@global": {
    ".CommentsItem-body:hover .InlineReactHoverableHighlight-highlight": {
      textDecorationLine: 'underline',
      textDecorationStyle: 'dashed',
      textDecorationColor: theme.palette.text.dim4,
      textUnderlineOffset: '3px'
    },
    ".PostsPage-postContent:hover .InlineReactHoverableHighlight-highlight": {
      textDecorationLine: 'underline',
      textDecorationStyle: 'dashed',
      textDecorationColor: theme.palette.text.dim4,
      textUnderlineOffset: '3px'
    }
  }
})

const InlineReactHoverableHighlight = ({quote,reactions, voteProps, children, classes}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  voteProps: VotingProps<VoteableTypeClient>,
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const { InlineReactHoverInfo, LWTooltip } = Components;
  const hoveredReactions = useContext(HoveredReactionListContext);
  const isHovered = hoveredReactions
    && Object.keys(reactions).some(reaction =>
      hoveredReactions.find(r=>r===reaction)
    );

  return <LWTooltip
    title={<InlineReactHoverInfo
      quote={quote}
      reactions={reactions}
      voteProps={voteProps}
    />}
    placement="top-start"
    tooltip={false}
    flip={false}
    inlineBlock={false}
    clickable={true}
  >
    <span className={classNames(classes.highlight, {
      [classes.reactionTypeHovered]: isHovered
    })}>
      {children}
    </span>
  </LWTooltip>
}

const InlineReactHoverableHighlightComponent = registerComponent('InlineReactHoverableHighlight', InlineReactHoverableHighlight, {styles});

declare global {
  interface ComponentTypes {
    InlineReactHoverableHighlight: typeof InlineReactHoverableHighlightComponent
  }
}

