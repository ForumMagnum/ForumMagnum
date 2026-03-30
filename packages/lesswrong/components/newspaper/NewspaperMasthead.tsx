import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, sansSerifStack } from '@/themes/defaultPalette';
import { getVolumeAndIssue, formatNewspaperDate } from './newspaperHelpers';

const INK = '#1A1A1A';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';
const RULE_DARK = '#333333';

const styles = defineStyles('NewspaperMasthead', () => ({
  container: {
    maxWidth: 1500,
    margin: '0 auto',
    padding: '0 48px',
    '@media (max-width: 768px)': {
      padding: '0 24px',
    },
  },
  masthead: {
    textAlign: 'center',
    paddingTop: 48,
    paddingBottom: 12,
  },
  mastheadTitle: {
    fontFamily: headerStack,
    fontSize: '56px',
    fontWeight: 400,
    letterSpacing: '2px',
    lineHeight: 1.1,
    marginBottom: 8,
    textTransform: 'uppercase',
    color: INK,
    '@media (max-width: 768px)': {
      fontSize: '36px',
      letterSpacing: '1px',
    },
    '@media (max-width: 480px)': {
      fontSize: '28px',
    },
  },
  mastheadSubtitle: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    marginBottom: 24,
  },
  mastheadRule: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: '0',
  },
  mastheadMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: sansSerifStack,
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    padding: '8px 0',
    borderBottom: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      gap: 4,
    },
  },
}), { allowNonThemeColors: true });

const NewspaperMasthead = ({displayDate}:{displayDate: Date}) => {
  const classes = useStyles(styles);
  return <div className={classes.container}>
    <div className={classes.masthead}>
      <div className={classes.mastheadTitle}>
        The LessWrong Times
      </div>
      <div className={classes.mastheadSubtitle}>
        Curated stories matching your interests.
      </div>
    </div>
    <hr className={classes.mastheadRule} />
    <div className={classes.mastheadMeta}>
      <span>{getVolumeAndIssue(displayDate)}</span>
      <span>Founded 2009</span>
      <span>{formatNewspaperDate(displayDate)}</span>
    </div>
  </div>;
};

export default NewspaperMasthead;
