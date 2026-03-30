import { defineStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';

const BG_WHITE = '#FFFFFF';
const BG_LIGHT = '#FAFAF8';
const INK = '#1A1A1A';
const INK_SECONDARY = '#555555';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';
const RULE_DARK = '#333333';

export const NEWSPAPER_BODY_CLASS = 'newspaper-fullwidth-active';

export const newspaperStyles = defineStyles('NewspaperFrontpage', () => ({
  '@global': {
    [`body.${NEWSPAPER_BODY_CLASS} .RouteRootClient-main`]: {
      overflowX: 'visible !important',
    },
    [`body.${NEWSPAPER_BODY_CLASS} .RouteRootClient-centralColumn`]: {
      width: '100%',
      maxWidth: 'none',
      paddingTop: '0 !important',
      paddingLeft: '0 !important',
      paddingRight: '0 !important',
    },
    [`body.${NEWSPAPER_BODY_CLASS} .LeftAndRightSidebarsWrapper-spacedGridActivated`]: {
      display: 'block !important',
    },
    [`body.${NEWSPAPER_BODY_CLASS} .Slide-wrapper`]: {
      display: 'none !important',
    },
  },
  pageWrapper: {
    width: '100%',
    background: BG_WHITE,
    color: INK,
    colorScheme: 'light',
    minHeight: '100vh',
    fontFamily: serifStack,
    position: 'relative',
    zIndex: 1,
  },
  container: {
    maxWidth: 1500,
    margin: '0 auto',
    padding: '0 48px',
    '@media (max-width: 768px)': {
      padding: '0 24px',
    },
  },
  containerWide: {
    maxWidth: 1600,
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
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gap: 0,
    marginTop: 32,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  heroMain: {
    paddingRight: 40,
    borderRight: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 900px)': {
      paddingRight: 0,
      borderRight: 'none',
      paddingBottom: 32,
      borderBottom: `1px solid ${RULE_COLOR}`,
    },
  },
  heroTitle: {
    fontFamily: headerStack,
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: 1.2,
    marginBottom: 10,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
    '@media (max-width: 768px)': {
      fontSize: '28px',
    },
  },
  heroByline: {
    fontFamily: headerStack,
    fontWeight: 700,
    fontSize: '13px',
    color: INK_TERTIARY,
    marginBottom: 20,
    '& a': {
      color: INK_TERTIARY,
      textDecoration: 'none',
    },
  },
  heroExcerpt: {
    fontFamily: serifStack,
    fontSize: '17px',
    lineHeight: 1.75,
    color: INK,
    display: '-webkit-box',
    WebkitLineClamp: 12,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.9em',
    },
    '& a': {
      color: INK,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: '1.1em',
      marginBottom: '0.5em',
    },
  },
  heroMeta: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    color: INK_TERTIARY,
    marginTop: 16,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 0,
    paddingLeft: 0,
    '@media (max-width: 900px)': {
      paddingLeft: 0,
      marginTop: 24,
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
    },
  },
  card: {
    padding: '0 20px 20px 20px',
    borderBottom: `1px solid ${RULE_COLOR}`,
    borderLeft: `1px solid ${RULE_COLOR}`,
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 900px)': {
      borderLeft: 'none',
      '&:nth-child(odd)': {
        borderRight: `1px solid ${RULE_COLOR}`,
      },
    },
    '@media (max-width: 600px)': {
      '&:nth-child(odd)': {
        borderRight: 'none',
      },
    },
  },
  cardTitle: {
    fontFamily: headerStack,
    fontSize: '21px',
    fontWeight: 400,
    lineHeight: 1.3,
    marginBottom: 6,
    marginTop: 20,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
  },
  cardByline: {
    fontFamily: headerStack,
    fontWeight: 700,
    fontSize: '12px',
    color: INK_TERTIARY,
    marginBottom: 12,
  },
  cardExcerpt: {
    fontFamily: serifStack,
    fontSize: '17px',
    lineHeight: 1.75,
    color: INK_SECONDARY,
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 8,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.5em',
    },
    '& a': {
      color: INK_SECONDARY,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: '1em',
      marginBottom: '0.4em',
    },
  },
  cardMeta: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginTop: 12,
  },
  sectionRule: {
    borderTop: `1px solid ${RULE_COLOR}`,
    margin: '0',
  },
  sectionRuleDark: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: '0',
  },
  sectionHeader: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    textAlign: 'center',
    margin: '32px 0 24px 0',
  },
  tertiaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 0,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tertiaryArticle: {
    padding: '20px 24px',
    borderRight: `1px solid ${RULE_COLOR}`,
    borderBottom: `1px solid ${RULE_COLOR}`,
    '&:nth-child(3n)': {
      borderRight: 'none',
    },
    '@media (max-width: 900px)': {
      '&:nth-child(3n)': {
        borderRight: `1px solid ${RULE_COLOR}`,
      },
      '&:nth-child(2n)': {
        borderRight: 'none',
      },
    },
    '@media (max-width: 600px)': {
      borderRight: 'none',
    },
  },
  tertiaryTitle: {
    fontFamily: headerStack,
    fontSize: '19px',
    fontWeight: 400,
    lineHeight: 1.3,
    marginBottom: 6,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
  },
  tertiaryByline: {
    fontFamily: headerStack,
    fontWeight: 700,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginBottom: 10,
  },
  tertiaryExcerpt: {
    fontFamily: serifStack,
    fontSize: '17px',
    lineHeight: 1.75,
    color: INK_SECONDARY,
    display: '-webkit-box',
    WebkitLineClamp: 8,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.4em',
    },
    '& a': {
      color: INK_SECONDARY,
    },
  },
  tertiaryMeta: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginTop: 10,
  },
  tagSectionWrapper: {
    marginTop: 32,
  },
  tagSectionRule: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: 0,
  },
  tagLabel: {
    fontFamily: sansSerifStack,
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '4px',
    textTransform: 'uppercase',
    color: INK,
    textAlign: 'center',
    margin: '24px 0 4px 0',
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
  },
  tagLabelSubtext: {
    fontFamily: serifStack,
    fontSize: '13px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  belowFold: {
    background: BG_LIGHT,
    borderTop: `2px solid ${RULE_DARK}`,
    marginTop: 32,
    paddingTop: 8,
    paddingBottom: 48,
  },
  belowFoldSection: {
    maxWidth: 765,
    margin: '0 auto',
    padding: '0 24px',
  },
  belowFoldHeader: {
    fontFamily: headerStack,
    fontSize: '24px',
    fontWeight: 400,
    textAlign: 'center',
    margin: '32px 0 4px 0',
    letterSpacing: '1px',
    color: INK,
  },
  belowFoldSubheader: {
    fontFamily: serifStack,
    fontSize: '13px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  classifiedsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    border: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  classifiedItem: {
    padding: '16px 20px',
    borderRight: `1px solid ${RULE_COLOR}`,
    borderBottom: `1px solid ${RULE_COLOR}`,
    '&:nth-child(2n)': {
      borderRight: 'none',
    },
    '@media (max-width: 600px)': {
      borderRight: 'none',
    },
  },
  classifiedTitle: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: INK,
    marginBottom: 6,
  },
  classifiedBody: {
    fontFamily: serifStack,
    fontSize: '13px',
    lineHeight: 1.5,
    color: INK_SECONDARY,
    '& a': {
      color: INK,
      textDecoration: 'none',
      borderBottom: `1px solid ${RULE_COLOR}`,
      '&:hover': {
        borderBottomColor: INK,
      },
    },
  },
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
  loading: {
    textAlign: 'center',
    padding: '80px 0',
    fontFamily: serifStack,
    fontSize: '18px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
  },
}), { allowNonThemeColors: true });
