import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('ClearInput', (theme: ThemeType) => ({
  formComponentClear: {
    "& span": {
      position: "relative",
      top: 20,
      padding: 10,
    },
  },
}));

export const ClearInput = ({ clearField }: { clearField: () => void }) => {
  const classes = useStyles(styles);
  return (
    <a
      className={classes.formComponentClear}
      title="Clear field"
      onClick={clearField}
    >
      <span>✕</span>
    </a>
  );
};
