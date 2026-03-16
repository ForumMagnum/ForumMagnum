import React from 'react';
import { commentBodyStyles } from '../../../themes/stylePiping';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('DialogueEditorGuidelines', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[60],
    paddingLeft: 16,
    paddingTop: 12,
    '& ul': {
      paddingLeft: 20
    }
  },
  title: {},
  info: {
    color: theme.palette.grey[600],
    ...commentBodyStyles(theme),
    margin: '0 !important',
    paddingBottom: 8
  }
}));

export const DialogueEditorGuidelines = () => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
    <div className={classes.title}>Dialogue Editor</div>
    <ul className={classes.info}>
      <li>You can edit your responses afterwards.</li>
      <li>You can see each other's responses as you type them.</li>
      <li>Default etiquette: It's okay to start drafting your message before the other person finishes theirs.</li>
    </ul>
  </div>;
}

export default DialogueEditorGuidelines;


