import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SettingsSection', (theme: ThemeType) => ({
  root: {
    marginTop: 28,
    '&:first-child': {
      marginTop: 0,
    },
  },
  heading: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 8,
    paddingLeft: 2,
  },
  description: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    marginBottom: 10,
    lineHeight: '1.5',
    paddingLeft: 2,
  },
  card: {
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    borderRadius: 8,
    padding: '4px 16px',
    boxShadow: theme.palette.boxShadow.default,
  },
}));

const SettingsSection = ({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <h4 className={classes.heading}>{title}</h4>
      {description && <div className={classes.description}>{description}</div>}
      <div className={classes.card}>
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
