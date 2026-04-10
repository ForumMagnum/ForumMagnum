import { defineStyles } from '../hooks/useStyles';

export const styles = defineStyles("NotificationsMenuButton", (theme: ThemeType) => ({
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
    fontFamily: 'freight-sans-pro, sans-serif',
  },
  badge: {
    pointerEvents: "none",
    top: 1,
    right: 1,
    fontWeight: 500,
    fontFamily: "freight-sans-pro, sans-serif",
    fontSize: 12,
    color: theme.palette.header.text,
  },
  badgeBackground: {
    backgroundColor: "inherit",
  },
  badge1Char: {},
  badge2Chars: {},
  buttonOpen: {
    backgroundColor: theme.palette.greyAlpha(0.4),
    color: theme.palette.grey[0],
  },
  buttonClosed: {
    backgroundColor: "transparent",
    color: theme.palette.header.text,
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
