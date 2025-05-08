import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { commentBodyStyles } from '../../../themes/stylePiping';
import { isFriendlyUI, preferredHeadingCase } from '../../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[60],
    ...(isFriendlyUI
      ? {
        padding: "16px 16px 0",
        borderRadius: theme.borderRadius.default,
      } : {
        paddingLeft: 16,
        paddingTop: 12,
      }),
    '& ul': {
      paddingLeft: 20
    }
  },
  title: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontWeight: 600,
      marginBottom: 8,
    }
    : {},
  info: {
    color: theme.palette.grey[600],
    ...commentBodyStyles(theme),
    margin: '0 !important',
    paddingBottom: 8
  }
});

export const DialogueEditorGuidelinesInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.root}>
    <div className={classes.title}>{preferredHeadingCase("Dialogue Editor")}</div>
    <ul className={classes.info}>
      <li>You can edit your responses afterwards.</li>
      <li>You can see each other's responses as you type them.</li>
      <li>Default etiquette: It's okay to start drafting your message before the other person finishes theirs.</li>
    </ul>
  </div>;
}

export const DialogueEditorGuidelines = registerComponent('DialogueEditorGuidelines', DialogueEditorGuidelinesInner, {styles});

declare global {
  interface ComponentTypes {
    DialogueEditorGuidelines: typeof DialogueEditorGuidelines
  }
}
