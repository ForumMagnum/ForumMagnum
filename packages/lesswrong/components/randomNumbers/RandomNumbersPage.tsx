"use client";

import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const NUMBER_COUNT = 60;

const styles = defineStyles("RandomNumbersPage", (theme: ThemeType) => ({
  description: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
    gap: 8,
  },
  number: {
    ...theme.typography.commentStyle,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    padding: "10px 4px",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
    fontSize: 16,
    color: theme.palette.grey[900],
  },
  placeholder: {
    color: theme.palette.grey[400],
  },
  button: {
    ...theme.typography.commentStyle,
    marginTop: 16,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 3,
    border: theme.palette.border.commentBorder,
    background: theme.palette.panelBackground.default,
    color: theme.palette.primary.main,
  },
}));

function generateRandomNumbers(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 1000));
}

const RandomNumbersPage = () => {
  const classes = useStyles(styles);
  // Generated in an effect rather than during render, so that the server-rendered
  // markup and the first client render match.
  const [numbers, setNumbers] = useState<number[] | null>(null);

  useEffect(() => {
    setNumbers(generateRandomNumbers(NUMBER_COUNT));
  }, []);

  const regenerate = useCallback(() => {
    setNumbers(generateRandomNumbers(NUMBER_COUNT));
  }, []);

  return <SingleColumnSection>
    <SectionTitle title="Random Numbers" />
    <div className={classes.description}>
      {NUMBER_COUNT} random integers between 0 and 999.
    </div>
    <div className={classes.grid}>
      {numbers
        ? numbers.map((n, i) => <div key={i} className={classes.number}>{n}</div>)
        : Array.from({ length: NUMBER_COUNT }, (_, i) =>
            <div key={i} className={classNames(classes.number, classes.placeholder)}>—</div>
          )}
    </div>
    <button type="button" className={classes.button} onClick={regenerate}>
      Regenerate
    </button>
  </SingleColumnSection>;
};

export default RandomNumbersPage;
