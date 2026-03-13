import { defineStyles } from '@/components/hooks/useStyles';
import { isIfAnyoneBuildsItFrontPage } from '@/components/seasonal/styles';
import { isEAForum } from '@/lib/instanceSettings';

export const styles = defineStyles("KarmaChangeNotifier", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  placeholder: {},
  karmaNotifierButton: {},
  karmaNotifierPaper: {},
  karmaNotifierPopper: {
    zIndex: theme.zIndexes.karmaChangeNotifier,
  },
  starIcon: {
    color: theme.palette.header.text,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
  },
  title: {
    display: 'block',
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8
  },
  votedItems: {},
  votedItemRow: {
    height: 20
  },
  votedItemScoreChange: {
    display: "inline-block",
    minWidth: 20,
    textAlign: "right",
  },
  votedItemReacts: {
    marginLeft: isEAForum() ? 12 : 6,
  },
  individualAddedReact: {
    color: isEAForum() ? theme.palette.primary.main : undefined,
    marginLeft: 2,
    marginRight: isEAForum() ? 6 : undefined,
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 250,
    textOverflow: "ellipsis"
  },

  singleLinePreview: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 300,
  },
  pointBadge: {
    fontSize: '0.9rem'
  },
  gainedPoints: {
    color: theme.palette.primary.main,
  },
  zeroPoints: {},
  lostPoints: {},
  settings: {
    display: 'block',
    textAlign: 'right',
    paddingTop: 8,
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[500]
    }
  },
}), { stylePriority: -1 });
