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
    width: 150,
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
    maxHeight: 300,
    overflowY: "scroll",
    marginBottom: 12,
    marginTop: 12
  },
  tooltipIcon: {
    marginRight: 12,
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
    '&:last-child': {
      borderBottom: "none",
      paddingBottom: 0,
      marginBottom: 0,
    }
  }
})

type paletteView = "listView"|"gridView";

const namesAttachedReactionsByName = namesAttachedReactions.map(r => r.name);
type ReactionsPaletteName = typeof namesAttachedReactionsByName[number];

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
    return <Row>
     <div className={classes.tooltipIcon}>
        <ReactionIcon inverted={true} react={reaction.name} size={40}/>
      </div>
      <div>
        <span className={classes.tooltipLabel}>{reaction.label}</span>
        <ReactionDescription reaction={reaction} classes={classes}/>
      </div>
    </Row>
  }
  
  type ReactionsIconRow = ReactionsPaletteName[]

  const primaryEpistemic: ReactionsIconRow = [
    'agree',      'disagree',   'important',    'dontUnderstand', 'changemind', 'thinking',   'surprise',   'roll',         'confused',       
  ]
  const primaryEpistemicAndEmotions: ReactionsIconRow = [
    'agree',      'disagree',   'important',    'dontUnderstand', 'changemind',  'thanks', 'thumbs-up',  'verified', 
    'thinking',   'surprise',   'roll',         'confused', 'empathy', 'laugh',    'disappointed',    'smile', 'excitement', 
  ]
  const sectionB: ReactionsIconRow = [
    'crux',       'hitsTheMark', 'insightful', 'scout',     'charitable',                 'concrete', 'yeswhatimean',  'scholarship',  'locallyInvalid',
    'notacrux',   'miss',        'muddled',    'soldier',   'unnecessarily-combative',    'examples',      'offtopic', 'obtuse',
    'taboo',      'strawman',    'elaborate',  'timecost',   'coveredAlready', 'paperclip',   'additionalQuestions', 'typo',
  ]

  const sectionB2: ReactionsIconRow = [
    'verified', 'coveredAlready',
    'typo', 'nonsequitur',
    'insightful', 'muddled',
    'locallyValid', 'locallyInvalid',
    'crux', 'notacrux',
    'hitsTheMark', 'miss',
    'scout', 'soldier',
    'charitable', 'unnecessarily-combative',
    'concrete', 'examples',
    'yeswhatimean', 'offtopic',
    'scholarship', 'obtuse',
    'strawman', 'taboo',
    'elaborate', 'timecost',
    'paperclip', 'additionalQuestions'
  ]
  const emotional: ReactionsIconRow = [
    'smile', 'laugh',    'disappointed',        'empathy',  'thanks', 'excitement', 'shrug', 'seen',
  ]

  const getReactionFromName = (name: string) => namesAttachedReactions.find(r => r.name === name);

  const primaryEpistemicReactions = primaryEpistemic.map(r => getReactionFromName(r)).filter(r => r);
  const primaryepistemicAndEmotionsReactions = primaryEpistemicAndEmotions.map(r => getReactionFromName(r)).filter(r => r);
  // const sectionB: ReactionsIconRow = reactionsToShow.filter(r => !sectionA.includes(r.name)).map(r => r.name as ReactionsPaletteName)
  const sectionBReactions = sectionB.map(r => getReactionFromName(r)).filter(r => r);
  const sectionB2Reactions = sectionB2.map(r => getReactionFromName(r)).filter(r => r);
  const emotionalReactions = emotional.map(r => getReactionFromName(r)).filter(r => r);

  const unused = ['shakyPremise', 'unnecessarily-harsh',  'clear', 'handshake', 'tooManyAssumptions',  'nonSequitur', 'locallyValid', 'key', 'prediction', 'shrug', 'notPlanningToRespond','support']


  const gridReactButton = (reaction: NamesAttachedReactionType, size:number=24) => <LWTooltip title={tooltip(reaction)} key={`icon-${reaction.name}`}>
    <div className={classes.paletteIcon1} onClick={_ev => toggleReaction(reaction.name, quote)}>
      <ReactionIcon react={reaction.name} size={size}/>
    </div>
  </LWTooltip>

  const listReactButton = (reaction: NamesAttachedReactionType, size:number=22) => {
    const currentUserVote = getCurrentUserReactionVote(reaction.name);
    const currentUserReact = getCurrentUserReaction(reaction.name);
    return (
      <LWTooltip
        key={reaction.name} placement="right-start"
        title={tooltip(reaction)}
      >
        <div
          key={reaction.name}
          className={classNames(classes.paletteEntry, {
            [classes.selected]: (currentUserVote==="created" || currentUserVote==="seconded"),
            [classes.selectedAnti]: currentUserVote==="disagreed",
          })}
          onClick={_ev => toggleReaction(reaction.name, quote)}
        >
          <ReactionIcon react={reaction.name} size={size}/>
          <span className={classes.hoverBallotLabel}>{reaction.label}</span>
        </div>
      </LWTooltip>
    )
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

    {/* {displayStyle == "gridView" && <div className={classes.reactionPaletteScrollRegion}>
        <div className={classes.iconSection}>{primaryepistemicAndEmotionsReactions.map(react => react && gridReactButton(react, 28))}</div>
        <div className={classes.iconSection}>{sectionBReactions.map(react => react && gridReactButton(react, 28))}</div>
    </div>} */}

    {displayStyle == "gridView" && <div className={classes.reactionPaletteScrollRegion}>
        <div className={classes.iconSection}>{primaryEpistemicReactions.map(react => react && gridReactButton(react))}</div>
        <div className={classes.iconSection}>{sectionBReactions.map(react => react && gridReactButton(react))}</div>
        <div>{emotionalReactions.map(react => react && gridReactButton(react))}</div>
    </div>}
    {displayStyle == "listView" && <div className={classes.reactionPaletteScrollRegion}>
    <div className={classes.iconSection}>{primaryEpistemicReactions.map(react => react && gridReactButton(react))}</div>
        {sectionB2Reactions.map(react => react && listReactButton(react))}
        {emotionalReactions.map(react => react && listReactButton(react))}
    </div>}
    {/* {displayStyle == "listView" && <div>
      <div className={classNames(classes.reactionPaletteScrollRegion, {[classes.showAll]:showAll})}>
         {sectionBReactions.map(react => react && listReactButton(react))}
      </div>
    </div>} */}
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
    } else {
      return <div>{reaction.description("comment")}</div>
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

