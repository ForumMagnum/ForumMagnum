import { defineStyles } from '@/components/hooks/useStyles';

/** Shared styles for dashboard content tab sections (Drafts / Published headers, dividers, etc.) */
export const dashboardTabStyles = defineStyles('DashboardTabShared', (theme: ThemeType) => ({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[600],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  divider: {
    borderTop: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    marginTop: 24,
    marginBottom: 24,
  },
}));
