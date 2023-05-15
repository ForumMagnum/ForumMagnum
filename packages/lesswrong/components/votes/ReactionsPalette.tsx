import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { VoteOnReactionType } from '../../lib/voting/namesAttachedReactions';
import { namesAttachedReactions, NamesAttachedReactionType } from '../../lib/voting/reactions';
import classNames from 'classnames';
import some from 'lodash/some';

const styles = (theme: ThemeType): JssStyles => ({
  moreReactions: {
    paddingLeft: 12,
    paddingRight: 12,
  },
  searchBox: {
    border: theme.palette.border.faint,
    borderRadius: 3,
    width: "100%",
    padding: 2,
    marginBottom: 12,
  },
  hoverBallotLabel: {
    verticalAlign: "middle",
    marginLeft: 6,
  },
  paletteEntry: {
    cursor: "pointer",
    width: 150,
    padding: 4,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  selected: {
    background: theme.palette.panelBackground.darken10,
  },
  selectedAnti: {
    background: "rgb(255, 189, 189, .23)", //TODO themeify
  },
  reactionDescription: {
  },
})

const ReactionsPalette = ({getCurrentUserReactionVote, toggleReaction, classes}: {
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  toggleReaction: (reactionName: string)=>void,
  classes: ClassesType
}) => {
  const { ReactionIcon, LWTooltip } = Components;
  const [searchText,setSearchText] = useState("");
  
  const reactionsToShow = reactionsSearch(namesAttachedReactions, searchText);

  return <div className={classes.moreReactions}>
    <div className={classes.searchBoxWrapper}>
      <input
        type="text" className={classes.searchBox}
        value={searchText}
        placeholder="Search"
        onChange={(ev) => setSearchText(ev.currentTarget.value)}
      />
    </div>

    {reactionsToShow.map(reaction => {
      const currentUserVote = getCurrentUserReactionVote(reaction.name);
      return (
        <LWTooltip key={reaction.name} title={<>
          <div>
            <ReactionIcon react={reaction.name}/>
            <span className={classes.hoverBallotLabel}>{reaction.label}</span>
          </div>
          <ReactionDescription reaction={reaction} classes={classes}/>
        </>}>
          <div
            key={reaction.name}
            className={classNames(classes.paletteEntry, {
              [classes.selected]: (currentUserVote==="created" || currentUserVote==="seconded"),
              [classes.selectedAnti]: currentUserVote==="disagreed",
            })}
            onClick={_ev => toggleReaction(reaction.name)}
          >
            <ReactionIcon react={reaction.name}/>
            <span className={classes.hoverBallotLabel}>{reaction.label}</span>
          </div>
        </LWTooltip>
      )
    })}
  </div>
}

const ReactionDescription = ({reaction, classes}: {
  reaction: NamesAttachedReactionType,
  classes: ClassesType,
}) => {
  if (!reaction.description) {
    return null;
  } else if (typeof reaction.description === "string") {
    return <div className={classes.reactionDescription}>{reaction.description}</div>
  } else {
    return <div className={classes.reactioNDescription}>{reaction.description("comment")}</div>
  }
}

function reactionsSearch(candidates: NamesAttachedReactionType[], searchText: string): NamesAttachedReactionType[] {
  if (!searchText || !searchText.length)
    return candidates;
  
  return candidates.filter(
    reaction => reaction.name.startsWith(searchText)
      || some(reaction.searchTerms, searchTerm=>searchTerm.startsWith(searchText))
  );
}


const ReactionsPaletteComponent = registerComponent('ReactionsPalette', ReactionsPalette, {styles});

declare global {
  interface ComponentTypes {
    ReactionsPalette: typeof ReactionsPaletteComponent
  }
}

