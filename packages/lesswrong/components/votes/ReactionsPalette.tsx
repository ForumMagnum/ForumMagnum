import React, {useRef, useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { EmojiReactName, QuoteLocator, UserVoteOnSingleReaction, VoteOnReactionType } from '../../lib/voting/namesAttachedReactions';
import { namesAttachedReactions, NamesAttachedReactionType } from '../../lib/voting/reactions';
import classNames from 'classnames';
import AppsIcon from '@/lib/vendor/@material-ui/icons/src/Apps';
import ViewListIcon from '@/lib/vendor/@material-ui/icons/src/ViewList';
import { useCurrentUser } from '../common/withUser';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useTracking } from "../../lib/analyticsEvents";
import debounce from "lodash/debounce";
import type { Placement as PopperPlacementType } from "popper.js"
import { defineStyles, useStyles } from '../hooks/useStyles';
import ReactionIcon from "./ReactionIcon";
import LWTooltip from "../common/LWTooltip";
import Row from "../common/Row";
import ReactionDescription from "./lwReactions/ReactionDescription";
import MetaInfo from "../common/MetaInfo";

const styles = defineStyles('ReactionsPalette', (theme: ThemeType) => ({
  moreReactions: {
    paddingLeft: 12,
    paddingRight: 12,
  },
  searchBox: {
    border: theme.palette.border.faint,
    borderRadius: 3,
    width: "100%",
    padding: 4,
    background: theme.palette.panelBackground.default,

    "&:focus": {
      border: theme.palette.border.normal,
    },
  },
  hoverBallotLabel: {
    marginLeft: 10,
    verticalAlign: "middle",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexGrow: 1
  },
  paletteEntry: {
    cursor: "pointer",
    width: 162,
    marginBottom: 1,
    display: "flex",
    alignItems: "center",
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  paletteIcon1: {
    cursor: "pointer",
    padding: 4,
    margin: 2,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  paletteIcon2: {
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
    width: 350,
    maxHeight: 305,
    overflowY: "scroll",
    marginTop: 12,
  },
  tooltipIcon: {
    marginRight: 12,
    padding: 8,
    '& img': {
      filter: 'opacity(1) !important'
    }
  },
  showAll: {
    maxHeight: "none",
  },
  showAllButton: {
    display: "flex",
    justifyContent: "center",
  },
  viewButton: {
    cursor: "pointer",
    width: 18,
    height: 18,
    marginLeft: 6,
    color: theme.palette.grey[300],
    '&:hover': {
      opacity: .5
    }
  },
  viewButtonSelected: {
    color: theme.palette.grey[600],
  },
  reactPaletteFooter: {
    textAlign: "center",
    padding: 6,
    paddingTop: 10
  },
  reactPaletteFooterFeedbackButton: {
    display: "inline",
    color: theme.palette.primary.light,
    marginRight: theme.spacing.unit,
    fontSize: "1rem",
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  },
  tooltipLabel: {
    fontSize: 15
  },
  primarySection: {
    marginBottom: 13,
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
    marginTop: 13,
  },
  tooltipRoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8
  },
  paddedRow: {
    marginTop: "1em",
    marginBottom: "1em",
  }
}));

type paletteView = "listView"|"gridView";

const ReactionsPalette = ({getCurrentUserReactionVote, toggleReaction, quote}: {
  getCurrentUserReactionVote: (name: EmojiReactName, quote: QuoteLocator|null) => VoteOnReactionType|null,
  toggleReaction: (reactionName: string, quote: QuoteLocator|null) => void,
  quote: QuoteLocator|null,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const reactPaletteStyle = currentUser?.reactPaletteStyle ?? "listView";
  const [searchText,setSearchText] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [displayStyle, setDisplayStyle] = useState<paletteView>(reactPaletteStyle);
  const debouncedCaptureEvent = useRef(debounce(captureEvent, 500))
  
  const activeReacts = namesAttachedReactions.filter(r=>!r.deprecated);
  const reactionsToShow = reactionsSearch(activeReacts, searchText);

  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });

  const handleChangeView = (view: paletteView) => {
    setDisplayStyle(view);
    captureEvent("reactionPaletteChangeViewClicked", {view})
    if (!currentUser) return;
    void updateUser({
      selector: {_id: currentUser._id},
      data: {
        reactPaletteStyle: view
      }
    })
  }

  function tooltip (reaction: NamesAttachedReactionType) {
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

  const getReactionFromName = (name: string) => namesAttachedReactions.find(r => r.name === name && reactionsToShow.includes(r));

  const listPrimary = [
    'agree', 'disagree', 'important', 'dontUnderstand', 'shrug', 'thinking', 'surprise', 'seen', 'thanks', 
  ].map(r => getReactionFromName(r)).filter(r => r);

  const listEmotions = [
    'smile', 'laugh', 'disappointed', 'confused', 'roll', 'excitement', 'thumbs-up', 'thumbs-down', 'paperclip', 
  ].map(r => getReactionFromName(r)).filter(r => r);

  const gridPrimary = [
    'agree', 'disagree', 'important', 'dontUnderstand', 'changemind', 'shrug', 'thinking', 'surprise', 'seen',  
  ].map(r => getReactionFromName(r)).filter(r => r);

  const gridEmotions = [
    'smile', 'laugh', 'disappointed', 'confused', 'roll', 'excitement', 'thumbs-up', 'thumbs-down', 'thanks', 
  ].map(r => getReactionFromName(r)).filter(r => r);
  
  const gridSectionB = [
    'crux',       'hitsTheMark', 'locallyValid',   'scout',     'facilitation',             'concrete',  'yeswhatimean', 'clear', 'betTrue',
    'notacrux',   'miss',        'locallyInvalid', 'soldier',   'unnecessarily-combative','examples',  'strawman',     'muddled', 'betFalse',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const gridSectionC = [
    'heart', 'insightful', 'taboo',  'offtopic',  'elaborate',  'timecost',  'typo', 'scholarship', 'why'
  ].map(r => getReactionFromName(r)).filter(r => r);

  const likelihoods = [
    '1percent', '10percent', '25percent', '40percent', '50percent', '60percent', '75percent', '90percent', '99percent',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const listViewSectionB = [
    'changemind',   'insightful',
    'thanks',       'heart',
    'typo',         'why', 
    'offtopic',     'elaborate',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const listViewSectionC = [
    'hitsTheMark',  'miss',
    'crux',         'notacrux',
    'locallyValid', 'locallyInvalid',
    'facilitation', 'unnecessarily-combative',
    'yeswhatimean', 'strawman',
    'concrete',     'examples',
    'clear',        'muddled',
    'betTrue',     'betFalse',
    'scout',        'soldier',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const listViewSectionD = [
    'scholarship',  'taboo',             
    'coveredAlready','timecost',
  ].map(r => getReactionFromName(r)).filter(r => r );

  const gridReactButton = (reaction: NamesAttachedReactionType, size=24) => {
    const currentUserVote = getCurrentUserReactionVote(reaction.name, quote);
    return <LWTooltip title={tooltip(reaction)} key={`icon-${reaction.name}`}>
      <div className={classNames(
        classes.paletteIcon1, {
          [classes.selected]: (currentUserVote==="created" || currentUserVote==="seconded"),
          [classes.selectedAnti]: currentUserVote==="disagreed"}
        )}
        onClick={_ev => toggleReaction(reaction.name, quote)}
      >
        <ReactionIcon react={reaction.name} size={size}/>
      </div>
    </LWTooltip>
  }
  const listReactButton = (reaction: NamesAttachedReactionType, placement: PopperPlacementType="left", size=22, ) => {
    const currentUserVote = getCurrentUserReactionVote(reaction.name, quote);
    return <LWTooltip
      key={reaction.name} placement={placement}
      title={tooltip(reaction)}
    >
      <div className={classes.paletteEntry}
        onClick={_ev => toggleReaction(reaction.name, quote)}
        key={reaction.name}
      >
        <span className={classNames(classes.paletteIcon2, {
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

  return <div className={classes.moreReactions}>
    {quote && <p>Reacting to "{quote}"</p>}
    <Row justifyContent='space-between'>
      <input
        type="text" className={classes.searchBox}
        value={searchText}
        placeholder="Search"
        onChange={(ev) => {
          setSearchText(ev.currentTarget.value)
          debouncedCaptureEvent.current("reactPaletteSearchKeysLogged", {searchText: ev.currentTarget.value})
        }}
      />
      <Row>
       <LWTooltip title="Switch to list view">
          <ViewListIcon 
            className={classNames(classes.viewButton, {[classes.viewButtonSelected]: displayStyle === "listView"})}
            onClick={() => handleChangeView("listView")}
          />  
        </LWTooltip>
        <LWTooltip title="Switch to grid view">
          <AppsIcon 
            className={classNames(classes.viewButton, {[classes.viewButtonSelected]: displayStyle === "gridView"})}
            onClick={() => handleChangeView("gridView")} 
          />
        </LWTooltip>
      </Row>
    </Row>
    <div className={classNames(classes.reactionPaletteScrollRegion, {[classes.showAll]: showAll})}>
      {displayStyle === "listView" && <div>
        <div className={classes.primarySection}>
          {listPrimary.map(react => react && gridReactButton(react, 24))}
        </div>
        <div className={classes.iconSection}>
          {listViewSectionB.map((react, i) => react && listReactButton(react, i%2 === 0 ? "left" : "right"))}
        </div>
        <div className={classes.iconSection}>
          {listViewSectionC.map((react, i) => react && listReactButton(react, i%2 === 0 ? "left" : "right"))}
        </div>
        <div>
          {listViewSectionD.map((react, i) => react && listReactButton(react, i%2 === 0 ? "left" : "right"))}
        </div>
        <div className={classes.bottomSection}>
          {likelihoods.map(react => react && gridReactButton(react, 24))}
          {listEmotions.map(react => react && gridReactButton(react, 24))}
        </div>
      </div>}
      {displayStyle === "gridView" && <div>
        <div className={classes.iconSection}>
          {gridPrimary.map(react => react && gridReactButton(react, 24))}
          {gridEmotions.map(react => react && gridReactButton(react, 24))}
        </div>
        <div className={classes.iconSection}>
          {gridSectionB.map(react => react && gridReactButton(react, 24))}
        </div>
        <div>
          {gridSectionC.map(react => react && gridReactButton(react, 24))}
        </div>
        {likelihoods.map(react => react && gridReactButton(react, 24))}
      </div>}
    </div>
    <div className={classes.reactPaletteFooter}>
      {displayStyle === "listView" && <a className={classes.showAllButton} onClick={() => {
        setShowAll(!showAll)
        captureEvent("reactPaletteShowMoreClicked", {showAll: !showAll})
      }} >
        <MetaInfo>{showAll ? "Show Fewer" : "Show All"}</MetaInfo>
      </a>}
    </div>
  </div>
}

export function reactionsSearch(candidates: NamesAttachedReactionType[], searchText: string): NamesAttachedReactionType[] {
  if (!searchText || !searchText.length)
    return candidates;
  
  searchText = searchText.toLowerCase();

  return candidates.filter(
    reaction => reaction.name.toLowerCase().startsWith(searchText)
      || reaction.label.toLowerCase().startsWith(searchText)
      || reaction.searchTerms?.some(searchTerm => searchTerm.toLowerCase().startsWith(searchText))
  );
}

export default registerComponent('ReactionsPalette', ReactionsPalette);





