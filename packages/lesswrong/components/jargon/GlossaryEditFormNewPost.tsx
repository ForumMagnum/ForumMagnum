import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { commentBodyStyles } from '@/themes/stylePiping';

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

export const GlossaryEditFormNewPost = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { LWTooltip } = Components

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

const GlossaryEditFormNewPostComponent = registerComponent('GlossaryEditFormNewPost', GlossaryEditFormNewPost, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormNewPost: typeof GlossaryEditFormNewPostComponent
  }
}
