import React from 'react';
import { commentBodyStyles } from '@/themes/stylePiping';
import LWTooltip from "../common/LWTooltip";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("GlossaryEditFormNewPost", (theme: ThemeType) => ({
  root: {
    ...commentBodyStyles(theme),
    marginTop: -8,
    marginBottom: -8,
    color: theme.palette.grey[500],
    textWrap: 'pretty',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginRight: 10,
    color: theme.palette.grey[900],
    fontSize: '1.25rem'
  }
}));

export const GlossaryEditFormNewPost = () => {
  const classes = useStyles(styles);
  const tooltipTitle = <div>If you've saved this post once,<br/>you can add terms to the glossary</div>
  return <div className={classes.root}>
    <LWTooltip title={tooltipTitle}>
      <span className={classes.title}>Glossary [Beta]</span> 
    </LWTooltip>
    <LWTooltip title={tooltipTitle}>
      <span>Available after saving once</span>
    </LWTooltip>
  </div>;
}

export default GlossaryEditFormNewPost;


