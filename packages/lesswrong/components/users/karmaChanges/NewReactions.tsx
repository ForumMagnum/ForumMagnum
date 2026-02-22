import LWTooltip from '@/components/common/LWTooltip';
import { useStyles } from '@/components/hooks/useStyles';
import ReactionIcon from '@/components/votes/ReactionIcon';
import { eaEmojiPalette } from '@/lib/voting/eaEmojiPalette';
import type { ReactionChange } from '@/server/collections/users/karmaChangesGraphQL';
import UsersName from '../UsersName';
import { styles } from './styles';


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
      let EAEmojiComponent = eaEmojiPalette.find(emoji => emoji.name === reactionType)?.Component;
      // On EAF, if the emoji is not in the list of non-anonymous reacts (eaEmojiPalette),
      // then make sure not to show any usernames of voters. They should not be available here anyway,
      // but we also don't want to show [anonymous], so we disable the tooltip altogether.
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
          {<ReactionIcon
                          react={reactionType} />}
        </LWTooltip>
      </span>;
    })}
  </span>;
};
