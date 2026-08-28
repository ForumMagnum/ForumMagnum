import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LibrarySectionTitle', (theme: ThemeType) => ({
  root: {
    scrollMarginTop: 80,
    marginBottom: 16,
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: "8px",
  },
  title: {
    ...theme.typography.headerStyle,
    ...theme.typography.smallCaps,
    color: theme.palette.grey[800],
    fontSize: 28,
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.2,
  },
  children: {
    ...theme.typography.commentStyle,
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[600],
    marginTop: 4,
    maxWidth: 570,
  },
}));

const LibrarySectionTitle = ({title, description, anchor, children}: {
  title: string,
  description?: string,
  anchor?: string,
  children?: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  return <div className={classes.root} id={anchor}>
    <div className={classes.titleRow}>
      <h2 className={classes.title}>{title}</h2>
      {children && <div className={classes.children}>{children}</div>}
    </div>
    {description && <div className={classes.description}>{description}</div>}
  </div>;
};

export default LibrarySectionTitle;
