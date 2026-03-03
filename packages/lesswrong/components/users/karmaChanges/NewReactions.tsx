import React from 'react';
import LWTooltip from '@/components/common/LWTooltip';
import ReactionIcon from '@/components/votes/ReactionIcon';
import UsersName from '../UsersName';
import { styles } from './styles';
import { useStyles } from '@/components/hooks/useStyles';
import type { ReactionChange } from '@/server/collections/users/karmaChangesGraphQL';


export const NewReactions = ({ reactionChanges }: {
  reactionChanges: ReactionChange[];
}) => {
  const classes = useStyles(styles);
  const distinctReactionTypes = new Set<string>();
  for (let reactionChange of reactionChanges)
    distinctReactionTypes.add(reactionChange.reactionType);

  return <span>
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
              <UsersName documentId={r.userId} />
            </>)}
          disabled={disableTooltip}
        >
          <ReactionIcon react={reactionType} />
        </LWTooltip>
      </span>;
    })}
  </span>;
};
