import React, {useRef, useState} from 'react';
import {Components, getSiteUrl, registerComponent} from '../../lib/vulcan-lib';
import { UserVoteOnSingleReaction, VoteOnReactionType } from '../../lib/voting/namesAttachedReactions';
import { namesAttachedReactions, NamesAttachedReactionType } from '../../lib/voting/reactions';
import classNames from 'classnames';
import AppsIcon from '@material-ui/icons/Apps';
import ViewListIcon from '@material-ui/icons/ViewList';
import { useCurrentUser } from '../common/withUser';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useTracking } from "../../lib/analyticsEvents";
import debounce from "lodash/debounce";
import { PopperPlacementType } from '@material-ui/core/Popper/Popper';

const styles = (theme: ThemeType): JssStyles => ({
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
  numQuotes: {
    fontSize: 10,
    marginRight: 6
  },
  paletteEntry: {
    cursor: "pointer",
    width: 162,
    padding: 4,
    display: "flex",
    alignItems: "center",
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  paletteIcon1: {
    cursor: "pointer",
    padding: 6,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  iconBorder: {
    border: theme.palette.border.normal,
    borderRadius: 4,
    padding:"1px 3px",
    marginRight:5
  },
  paletteIcon2: {
    cursor: "pointer",
    padding: 6,
    textAlign: "center",
    width: 54,
    height: 50,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  selected: {
    background: theme.palette.panelBackground.darken10,
  },
  selectedAnti: {
    background: "rgb(255, 189, 189, .23)",
  },
  reactionPaletteScrollRegion: {
    width: 350,
    maxHeight: 292,
    overflowY: "scroll",
    marginTop: 12
  },
  tooltipIcon: {
    marginRight: 12,
    padding: 8,
  },
  showAll: {
    maxHeight: "none",
  },
  showMore: {
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
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingBottom: 6,
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
  iconSection: {
    borderBottom: theme.palette.border.faint,
    paddingBottom: 6,
    marginBottom: 6,
    marginRight: 7,
    display: "flex",
    flexWrap: "wrap",
  },
  tooltipRoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8
  },
  likelihoodSection: {
    borderTop: theme.palette.border.faint,
    paddingBottom: 6,
    marginBottom: 6,
  },
  paddedRow: {
    marginTop: "1em",
    marginBottom: "1em",
  }
})

type paletteView = "listView"|"gridView";

const ReactionsPalette = ({getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction, quote, classes}: {
  getCurrentUserReaction: (name: string) => UserVoteOnSingleReaction|null,
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  toggleReaction: (reactionName: string, quote?: string)=>void,
  quote?: string,
  classes: ClassesType,
}) => {
  const { ReactionIcon, LWTooltip, Row, MetaInfo } = Components;
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
        <ReactionDescription reaction={reaction} classes={classes}/>
      </div>
    </div>
  }

  const getReactionFromName = (name: string) => namesAttachedReactions.find(r => r.name === name && reactionsToShow.includes(r));
 
  // const primary = [
  //   'agree',      'disagree',   'important',    'dontUnderstand', 'shrug', 'thanks', 'thumbs-up',  'thumbs-down', 'seen',
  // ].map(r => getReactionFromName(r)).filter(r => r);

  // const emotions = [
  //   'thinking',   'surprise',   'roll',         'confused',  'laugh',    'disappointed',    'smile',  'empathy', 'excitement',
  // ].map(r => getReactionFromName(r)).filter(r => r);

  const primary = [
    'agree',      'disagree',   'important',    'dontUnderstand', 'shrug', 'thinking',   'surprise',   'roll', 'confused',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const emotions2 = [
    'smile', 'laugh',    'disappointed',    'empathy', 'excitement','thumbs-up', 'thumbs-down',  'seen', 'thanks',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const likelihoods = [
    '1percent', '10percent', '25percent', '40percent', '50percent', '60percent', '75percent', '90percent', '99percent',
  ].map(r => getReactionFromName(r)).filter(r => r);
  
  const gridSectionB = [
    'crux',       'hitsTheMark', 'locallyValid',   'scout',     'charitable',             'concrete',  'yeswhatimean', 'clear', 'verified',
    'notacrux',   'miss',        'locallyInvalid', 'soldier',   'unnecessarily-combative','examples',  'strawman',     'muddled', 'verifiedFalse',
  ].map(r => getReactionFromName(r)).filter(r => r);

  const gridSectionC = [
    'taboo',  'offtopic',  'insightful',  'elaborate',  'timecost',  'coveredAlready',         'typo',        'scholarship', 'notPlanningToRespond'

  ].map(r => getReactionFromName(r)).filter(r => r);

  const listViewSectionB = [
    'changemind',   'typo',   
    'thanks',       'insightful',
    'locallyValid', 'locallyInvalid',
    'crux',         'notacrux',
    'charitable',   'unnecessarily-combative',
    'concrete',     'examples',
    'yeswhatimean', 'strawman',
    'hitsTheMark',  'miss',
    'scout',        'soldier',
    'clear',        'muddled',
    'verified',     'verifiedFalse',
    'scholarship',  'offtopic',
    'taboo',        'elaborate',       
    'coveredAlready','timecost',

  ].map(r => getReactionFromName(r)).filter(r => r );

  const gridReactButton = (reaction: NamesAttachedReactionType, size=24) => <LWTooltip title={tooltip(reaction)} key={`icon-${reaction.name}`}>
    <div className={classes.paletteIcon1} onClick={_ev => toggleReaction(reaction.name, quote)}>
      <ReactionIcon react={reaction.name} size={size}/>
    </div>
  </LWTooltip>

  const listReactButton = (reaction: NamesAttachedReactionType, placement: PopperPlacementType="left", size=22, ) => {
    const currentUserVote = getCurrentUserReactionVote(reaction.name);
    return <LWTooltip
      key={reaction.name} placement={placement}
      title={tooltip(reaction)}
    >
    <div className={classNames(classes.paletteEntry, {
        [classes.selected]: (currentUserVote==="created" || currentUserVote==="seconded"),
        [classes.selectedAnti]: currentUserVote==="disagreed",
      })}
      onClick={_ev => toggleReaction(reaction.name, quote)}
      key={reaction.name}
    >
    <ReactionIcon react={reaction.name} size={size}/>

    <span className={classes.hoverBallotLabel}>{reaction.label}</span>
  </div>    
  </LWTooltip>}

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
            className={classNames(classes.viewButton, {[classes.viewButtonSelected]: displayStyle == "listView"})}
            onClick={() => handleChangeView("listView")}
          />  
        </LWTooltip>
        <LWTooltip title="Switch to grid view">
          <AppsIcon 
            className={classNames(classes.viewButton, {[classes.viewButtonSelected]: displayStyle == "gridView"})}
            onClick={() => handleChangeView("gridView")} 
          />
        </LWTooltip>
      </Row>
    </Row>
    <div className={classNames(classes.reactionPaletteScrollRegion, {[classes.showAll]: showAll})}>
      {displayStyle == "listView" && <div>
        <p>
          {primary.map(react => react && gridReactButton(react, 24))}
        </p>
        <p>
          {listViewSectionB.map((react, i) => react && listReactButton(react, i%2 === 0 ? "left" : "right"))}
        </p>
        <div className={classes.paddedRow}>
          {emotions2.map(react => react && gridReactButton(react, 24))}
        </div>
      </div>}
      {displayStyle == "gridView" && <div>
        <div className={classes.iconSection}>
          {primary.map(react => react && gridReactButton(react, 24))}
          {emotions2.map(react => react && gridReactButton(react, 24))}
        </div>
        <div className={classes.iconSection}>
          {gridSectionB.map(react => react && gridReactButton(react, 24))}
        </div>
        <div>
          {gridSectionC.map(react => react && gridReactButton(react, 24))}
        </div>
        {likelihoods.map(react => react && gridReactButton(react, 24))}
        {/* <div className={classes.likelihoodSection}>
          {likelihoods.map(react => react && gridReactButton(react, 24))}
        </div> */}
      </div>}
    </div>
    {displayStyle === "listView" && <div className={classes.likelihoodSection}>
      {likelihoods.map(react => react && gridReactButton(react, 24))}
    </div>}
    <div className={classes.reactPaletteFooter}>
      <LWTooltip title={currentUser?.hideIntercom ? "You must enable Intercom in your user settings" : ""}>
        <a className={classes.reactPaletteFooterFeedbackButton} onClick={() => {
            captureEvent("reactPaletteFeedbackButtonClicked")
          // eslint-disable-next-line babel/new-cap
            window.Intercom('trackEvent', 'suggest-react-palette-feedback')
          }}>
          <span className={classes.reactPaletteFeedbackButton}>
            Request React / Give Feedback
          </span>
        </a>
      </LWTooltip>
      {displayStyle == "listView" && <a className={classes.showMore} onClick={() => {
        setShowAll(!showAll)
        captureEvent("reactPaletteShowMoreClicked", {showAll: !showAll})
      }} >
        <MetaInfo>{showAll ? "Show Fewer" : "Show More"}</MetaInfo>
      </a>}
    </div>
  </div>
  
}
    
    
const ReactionDescription = ({reaction, classes}: {
reaction: NamesAttachedReactionType,
classes: ClassesType,
  }) => {
    if (!reaction.description) {
      return null;
    } else if (typeof reaction.description === "string") {
      return <div>{reaction.description}</div>
    } else if (typeof reaction.description === "function") {
      return <div>{reaction.description("comment")}</div>
    } else {
      return <div>{reaction.description}</div>
    }
  }

function reactionsSearch(candidates: NamesAttachedReactionType[], searchText: string): NamesAttachedReactionType[] {
  if (!searchText || !searchText.length)
    return candidates;
  
  searchText = searchText.toLowerCase();

  return candidates.filter(
    reaction => reaction.name.toLowerCase().startsWith(searchText)
      || reaction.label.toLowerCase().startsWith(searchText)
      || reaction.searchTerms?.some(searchTerm => searchTerm.toLowerCase().startsWith(searchText))
  );
}


const ReactionsPaletteComponent = registerComponent('ReactionsPalette', ReactionsPalette, {styles});

declare global {
  interface ComponentTypes {
    ReactionsPalette: typeof ReactionsPaletteComponent
  }
}

