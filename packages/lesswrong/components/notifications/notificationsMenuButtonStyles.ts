import { isFriendlyUI } from '@/themes/forumTheme';
import { defineStyles } from '../hooks/useStyles';

/**
 * These same styles are also used by `MessagesMenuButton`, so changes here
 * should also be checked there as well.
 */
export const styles = defineStyles("NotificationsMenuButton", (theme: ThemeType) => ({
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
    fontFamily: isFriendlyUI
      ? theme.palette.fonts.sansSerifStack
      : 'freight-sans-pro, sans-serif',
  },
  badge: {
    pointerEvents: "none",
    ...(isFriendlyUI
      ? {
        top: 3,
        right: 6,
        maxHeight: 20,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.22px",
        color: `${theme.palette.text.alwaysWhite} !important`,
        borderRadius: "50%",
      }
      : {
        top: 1,
        right: 1,
        fontWeight: 500,
        fontFamily: "freight-sans-pro, sans-serif",
        fontSize: 12,
        color: theme.palette.header.text,
      }),
  },
  badgeBackground: {
    backgroundColor: isFriendlyUI
      ? theme.palette.primary.main
      : "inherit",
  },
  badge1Char: isFriendlyUI
    ? {
      width: 18,
      height: 18,
    }
    : {},
  badge2Chars: isFriendlyUI
    ? {
      width: 20,
      height: 20,
    }
    : {},
  buttonOpen: {
    backgroundColor: theme.palette.buttons.notificationsBellOpen.background,
    color: isFriendlyUI
      ? theme.palette.grey[600]
      : theme.palette.buttons.notificationsBellOpen.icon,
  },
  buttonClosed: {
    backgroundColor: "transparent",
    color: isFriendlyUI
      ? theme.palette.grey[600]
      : theme.palette.header.text,
  },
  buttonActive: {
    backgroundColor: theme.palette.greyAlpha(0.1),
  },
  karmaStar: {
    color: theme.palette.icon.headerKarma,
    transform: "rotate(-15deg)",
    position: "absolute",
    width: 16,
    height: 16,
  },
  karmaStarWithBadge: {
    left: -6,
    top: -6,
  },
  karmaStarWithoutBadge: {
    left: 1,
    top: 1,
  },
  tooltip: {
    background: `${theme.palette.panelBackground.tooltipBackground2} !important`,
    padding: "5px 13px",
    transform: "translateY(5px)",
  },
}), { stylePriority: -1 });
