import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { commentBodyStyles } from '@/themes/stylePiping';
import { LWTooltip } from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
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
});

export const GlossaryEditFormNewPostInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
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

export const GlossaryEditFormNewPost = registerComponent('GlossaryEditFormNewPost', GlossaryEditFormNewPostInner, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormNewPost: typeof GlossaryEditFormNewPost
  }
}
