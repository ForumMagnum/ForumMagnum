import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ModerationDefaultOptions', (theme: ThemeType) => ({
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.typography.commentStyle,
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
    '& li': {
      listStyleType: '"→ "',
    },
  },
}));

const ModerationDefaultOptions = () => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <p>
        <strong>Has 1-2 Auto-Rejected posts:</strong>
        <ul>
          <li>Surprisingly good? <b>Shift-A (approve only current post)</b></li>
          <li>Not obviously good? <b>Q (remove from queue)</b></li>
        </ul>
      </p>
    </div>
  );
};

export default ModerationDefaultOptions;



