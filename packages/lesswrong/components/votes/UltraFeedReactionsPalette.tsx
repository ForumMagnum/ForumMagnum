import React, {useRef, useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { EmojiReactName, QuoteLocator, VoteOnReactionType } from '../../lib/voting/namesAttachedReactions';
import { namesAttachedReactions, NamesAttachedReactionType } from '../../lib/voting/reactions';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import debounce from "lodash/debounce";
import type { Placement as PopperPlacementType } from "popper.js"
import { defineStyles, useStyles } from '../hooks/useStyles';
import ReactionIcon from "./ReactionIcon";
import LWTooltip from "../common/LWTooltip";
import ReactionDescription from "./lwReactions/ReactionDescription";
import { reactionsSearch } from './ReactionsPalette';

const styles = defineStyles('UltraFeedReactionsPalette', (theme: ThemeType) => ({
  moreReactions: {
  },
  searchBox: {
    border: theme.palette.border.faint,
    borderRadius: 3,
    width: "100%",
    padding: 4,
    background: theme.palette.panelBackground.default,
    marginBottom: 8,

    "&:focus": {
      border: theme.palette.border.normal,
    },
  },
  hoverBallotLabel: {
    marginLeft: 10,
    marginRight: 10,
    verticalAlign: "middle",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexGrow: 1,
    fontSize: 13,
  },
  paletteEntry: {
    cursor: "pointer",
    width: 140,
    marginBottom: 1,
    display: "flex",
    alignItems: "center",
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  paletteIcon: {
    padding: 3,
    margin: 1
  },
  selected: {
    background: theme.palette.panelBackground.darken10,
    borderRadius: 6
  },
  selectedAnti: {
    background: theme.palette.namesAttachedReactions.selectedAnti,
    borderRadius: 6
  },
  reactionPaletteScrollRegion: {
    width: '100%',
    maxHeight: 260,
    overflowY: "scroll",
    marginTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 2,
  },
  tooltipIcon: {
    marginRight: 12,
    padding: 8,
    '& img': {
      filter: 'opacity(1) !important'
    }
  },
  tooltipLabel: {
    fontSize: 15
  },
  primarySection: {
    marginBottom: 8,
    display: 'flex',
    flexWrap: 'wrap',
  },
  iconSection: {
    borderBottom: theme.palette.border.faint,
    paddingBottom: 6,
    marginBottom: 6,
    marginRight: 7,
    display: "flex",
    flexWrap: "wrap",
  },
  bottomSection: {
    marginTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
  },
  tooltipRoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8
  },
  gridIconButton: {
    cursor: "pointer",
    padding: 4,
    margin: 2,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
}));

const ReactTooltip = (props: { reaction: NamesAttachedReactionType }) => {
  const classes = useStyles(styles);
  const { reaction } = props;
  return <div className={classes.tooltipRoot}>
   <div className={classes.tooltipIcon}>
      <ReactionIcon inverted={true} react={reaction.name} size={40}/>
    </div>
    <div>
      <span className={classes.tooltipLabel}>{reaction.label}</span>
      <ReactionDescription reaction={reaction} />
    </div>
  </div>
}

interface ListReactButtonProps {
  getCurrentUserReactionVote: (name: EmojiReactName, quote: QuoteLocator|null) => VoteOnReactionType|null;
  toggleReaction: (reactionName: string, quote: QuoteLocator|null) => void;
  reaction: NamesAttachedReactionType;
  placement?: PopperPlacementType;
  size?: number;
  quote: QuoteLocator|null;
}

const ListReactButton: React.FC<ListReactButtonProps> = ({
  getCurrentUserReactionVote,
  toggleReaction,
  reaction,
  placement = "left",
  size = 18,
  quote
}) => {
    const currentUserVote = getCurrentUserReactionVote(reaction.name, quote);
    const classes = useStyles(styles);
    return <LWTooltip
      key={reaction.name} placement={placement}
      title={<ReactTooltip reaction={reaction} />}
    >
      <div className={classes.paletteEntry}
        onClick={_ev => toggleReaction(reaction.name, quote)}
        key={reaction.name}
      >
        <span className={classNames(classes.paletteIcon, {
          [classes.selected]: (currentUserVote==="created" || currentUserVote==="seconded"),
          [classes.selectedAnti]: currentUserVote==="disagreed"})
        }>
          <ReactionIcon react={reaction.name} size={size}/>
        </span>
        <span className={classes.hoverBallotLabel}>
          {reaction.label}
        </span>
      </div>
    </LWTooltip>
}

const UltraFeedReactionsPalette = ({getCurrentUserReactionVote, toggleReaction, quote}: {
  getCurrentUserReactionVote: (name: EmojiReactName, quote: QuoteLocator|null) => VoteOnReactionType|null,
  toggleReaction: (reactionName: string, quote: QuoteLocator|null) => void,
  quote: QuoteLocator|null,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking()
  const [searchText,setSearchText] = useState("");
  const debouncedCaptureEvent = useRef(debounce(captureEvent, 500))
  
  const activeReacts = namesAttachedReactions.filter(r=>!r.deprecated);
  const reactionsToShow = reactionsSearch(activeReacts, searchText);

  // Ensure we always include the full set of active reactions in the same
  // ordering as the master palette, to avoid divergence.
  const orderedVisibleReactions = activeReacts.filter(r => reactionsToShow.includes(r));

  return <div className={classes.moreReactions}>
    <input
      type="text" className={classes.searchBox}
      value={searchText}
      placeholder="Search reactions"
      onChange={(ev) => {
        setSearchText(ev.currentTarget.value)
        debouncedCaptureEvent.current("ultraFeedReactPaletteSearch", {searchText: ev.currentTarget.value})
      }}
    />
    <div className={classes.reactionPaletteScrollRegion}>
      {orderedVisibleReactions.map((reaction, idx) => {
        // Slightly alternate tooltip placement to avoid obscuring UI
        const placement: PopperPlacementType = (idx % 2 === 0) ? "left" : "right";
        return <ListReactButton
          getCurrentUserReactionVote={getCurrentUserReactionVote}
          toggleReaction={toggleReaction}
          reaction={reaction}
          placement={placement}
          size={18}
          quote={quote} />;
      })}
    </div>
  </div>
}


export default registerComponent('UltraFeedReactionsPalette', UltraFeedReactionsPalette); 
