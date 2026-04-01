import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { sansSerifStack } from '@/themes/defaultPalette';

const BG_WHITE = '#FFFFFF';
const INK = '#1A1A1A';
const INK_SECONDARY = '#555555';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';

const styles = defineStyles('NewspaperFooter', () => ({
  footer: {
    background: BG_WHITE,
    borderTop: `1px solid ${RULE_COLOR}`,
    padding: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    color: INK_TERTIARY,
    letterSpacing: '0.5px',
    '& a': {
      color: INK_SECONDARY,
      textDecoration: 'none',
      '&:hover': {
        color: INK,
      },
    },
  },
}), { allowNonThemeColors: true });

const NewspaperFooter = ({displayDate}:{displayDate: Date}) => {
  const classes = useStyles(styles);
  return <div className={classes.footer}>
    <div className={classes.footerText}>
      <Link to="/?newspaper=false">Return to regular LessWrong</Link>
      {' \u00B7 '}
      The Less Wrong Times is a special April 1st edition.
      {' \u00B7 '}
      &copy; {displayDate.getFullYear()} LessWrong
    </div>
  </div>;
};

export default NewspaperFooter;
