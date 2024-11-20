import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/CommentsListSection';
import { MENU_WIDTH, DismissButton } from './PostsItemTrailingButtons';

export const KARMA_WIDTH = 32;

export const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  root: {
    position: "relative",
    minWidth: 0,
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    },
    '&:hover .PostsItemTrailingButtons-actions': {
      opacity: .2,
    },
    '&:hover .PostsItemTrailingButtons-archiveButton': {
      opacity: .2,
    }
  },
  background: {
    width: "100%",
    background: theme.palette.panelBackground.default,
  },
  checkboxWidth: {
    width: "calc(100% - 24px)"
  },
  translucentBackground: {
    width: "100%",
    background: theme.palette.panelBackground.translucent,
    backdropFilter: "blur(1px)"
  },
  postsItem: {
    display: "flex",
    position: "relative",
    padding: 10,
    paddingLeft: 6,
    alignItems: "center",
    flexWrap: "nowrap",
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      paddingLeft: 5
    },
  },
  withGrayHover: {
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.postsItemHover,
    },
  },
  hasSmallSubtitle: {
    '&&': {
      top: -5,
    }
  },
  hasSequenceImage: {
    paddingRight: 0,
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  commentsBackground: {
    backgroundColor: theme.palette.panelBackground.postsItemExpandedComments,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: theme.spacing.unit/2,
      paddingRight: theme.spacing.unit/2
    }
  },
  karma: {
    width: KARMA_WIDTH,
    marginRight: 4,
    [theme.breakpoints.down('xs')]:{
      width: "unset",
      justifyContent: "flex-start",
      marginLeft: 2,
      marginRight: theme.spacing.unit
    }
  },
  karmaPredictedReviewWinner: {
    color: theme.palette.review.winner
  },
  title: {
    minHeight: 26,
    flex: 1500,
    maxWidth: "fit-content",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: 12,
    [theme.breakpoints.up('sm')]: {
      position: "relative",
      top: 3,
    },
    [theme.breakpoints.down('xs')]: {
      order:-1,
      height: "unset",
      maxWidth: "unset",
      width: "100%",
      paddingRight: theme.spacing.unit,
      flex: "unset",
    },
    '&:hover': {
      opacity: 1,
    }
  },
  spacer: {
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
  },
  author: {
    justifyContent: "flex",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    zIndex: theme.zIndexes.postItemAuthor,
    flex: 1000,
    maxWidth: "fit-content",
    [theme.breakpoints.down('xs')]: {
      justifyContent: "flex-end",
      width: "unset",
      marginLeft: 0,
      flex: "unset"
    }
  },
  event: {
    maxWidth: 250,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('xs')]: {
      width: "unset",
      marginLeft: 0,
    }
  },
  newCommentsSection: {
    width: "100%",
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingTop: theme.spacing.unit,
    cursor: "pointer",
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    }
  },
  actions: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 0,
    right: -MENU_WIDTH - 6,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  archiveButton: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 1,
    right: -3*MENU_WIDTH,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  mobileSecondRowSpacer: {
    [theme.breakpoints.up('sm')]: {
      display: "none",
    },
    flexGrow: 1,
    height: 24,
  },
  mobileActions: {
    cursor: "pointer",
    width: MENU_WIDTH,
    opacity: .5,
    marginRight: theme.spacing.unit,
    display: "none",
    [theme.breakpoints.down('xs')]: {
      display: "block"
    }
  },
  mobileIcons: {
    [theme.breakpoints.up('sm')]: {
      display: "none"
    }
  },
  mobileDismissButton: {
    display: "none",
    opacity: 0.75,
    verticalAlign: "middle",
    position: "relative",
    cursor: "pointer",
    right: 10,
    [theme.breakpoints.down('xs')]: {
      display: "inline-block"
    }
  },
  subtitle: {
    color: theme.palette.grey[700],
    fontFamily: theme.typography.commentStyle.fontFamily,

    [theme.breakpoints.up('sm')]: {
      position: "absolute",
      left: 42,
      bottom: 5,
      zIndex: theme.zIndexes.nextUnread,
    },
    [theme.breakpoints.down('xs')]: {
      order: -1,
      width: "100%",
      marginTop: -2,
      marginBottom: 3,
      marginLeft: 1,
    },
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  sequenceImage: {
    position: "relative",
    marginLeft: -60,
    opacity: 0.6,
    height: 48,
    width: 146,

    // Negative margins that are the opposite of the padding on postsItem, since
    // the image extends into the padding.
    marginTop: -12,
    marginBottom: -12,
    [theme.breakpoints.down('xs')]: {
      marginTop: 0,
      marginBottom: 0,
      position: "absolute",
      overflow: 'hidden',
      right: 0,
      bottom: 0,
      height: "100%",
    },

    // Overlay a white-to-transparent gradient over the image
    "&:after": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      background: `linear-gradient(to right, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent2} 60%, transparent 100%)`,
    }
  },
  sequenceImageImg: {
    height: 48,
    width: 146,
    [theme.breakpoints.down('xs')]: {
      height: "100%",
      width: 'auto'
    },
  },
  reviewCounts: {
    width: 50
  },
  noReviews: {
    color: theme.palette.grey[400]
  },
  dense: {
    paddingTop: 7,
    paddingBottom:8
  },
  withRelevanceVoting: {
      marginLeft: 28
  },
  bookmark: {
    marginLeft: theme.spacing.unit/2,
    marginRight: theme.spacing.unit*1.5,
    position: "relative",
    height: 22,
  },
  isRead: {
    // this is just a placeholder, enabling easier theming.
  },
  checkbox: {
    marginRight: 10
  },
  mostValuableCheckbox: {
    marginLeft: 5
  },
  commentsIcon: {
    marginLeft: 8
  },
  reviewPostButton: {
    marginLeft: 10
  },
  unreadDebateResponsesIcon: {
    height: 14,
    position: 'relative',
    top: 2,
    color: theme.palette.primary.main
  },
  unreadDebateResponseCount: {
    paddingLeft: 4,
    color: theme.palette.primary.main
  }, 
  unreadDebateResponseContainer: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    }
  }
})
