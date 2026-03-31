import React from 'react';
import LWTooltip from '@/components/common/LWTooltip';
import ReactionIcon from '@/components/votes/ReactionIcon';
import UsersName from '../UsersName';
import { useStyles } from '@/components/hooks/useStyles';
import { defineStyles } from '@/components/hooks/defineStyles';
import type { ReactionChange } from '@/server/collections/users/karmaChangesGraphQL';

const styles = defineStyles("NewReactions", (theme: ThemeType) => ({
  individualAddedReact: {
    marginLeft: 2,
  },
  votedItemReacts: {
    marginLeft: 6,
  },
}));

export const NewReactions = ({ reactionChanges }: {
  reactionChanges: ReactionChange[]|null|undefined;
}) => {
  const classes = useStyles(styles);
  if (!reactionChanges || !reactionChanges.length) {
    return null;
  }
  const distinctReactionTypes = new Set<string>();
  for (let reactionChange of reactionChanges) {
    distinctReactionTypes.add(reactionChange.reactionType);
  }


  return <span className={classes.votedItemReacts}>
    {[...distinctReactionTypes.keys()].map(reactionType => {
      let disableTooltip = false;

      return <span
        className={classes.individualAddedReact}
        key={reactionType}
      >
        <LWTooltip
          title={reactionChanges.filter(r => r.reactionType === reactionType)
            .map((r, i) => <>
              {i > 0 && <>{", "}</>}
              <UsersName documentId={r.userId ?? undefined} />
            </>)}
          disabled={disableTooltip}
        >
          <ReactionIcon react={reactionType} />
        </LWTooltip>
      </span>;
    })}
  </span>;
};
