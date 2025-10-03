import { defineStyles } from '@/components/hooks/useStyles';
import { isIfAnyoneBuildsItFrontPage } from '@/components/seasonal/styles';
import { isEAForum } from '@/lib/instanceSettings';
import { isFriendlyUI } from '@/themes/forumTheme';

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
    color: theme.isFriendlyUI ? theme.palette.grey[600] : theme.palette.header.text,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
  },
  title: {
    display: 'block',
    paddingTop: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit
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
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[500]
    }
  },
}), { stylePriority: -1 });
