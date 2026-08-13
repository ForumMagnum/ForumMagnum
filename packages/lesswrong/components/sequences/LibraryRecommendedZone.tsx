import React from 'react';
import classNames from 'classnames';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { Link } from '../../lib/reactRouterWrapper';
import CloudinaryImage2 from '../common/CloudinaryImage2';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

interface LibraryRecommendedCard {
  title: string,
  description: string,
  imageId: string,
  url: string,
}

// Hardcoded editorial picks, following the precedent of LWCoreReading's
// coreReadingCollections. Image ids are the items' existing Cloudinary art;
// swap these when final cover art for the redesign is settled.
const RECOMMENDED_CARDS: LibraryRecommendedCard[] = [
  {
    title: "The Codex",
    description: "Scott Alexander on science, medicine, philosophy, futurism and politics.",
    imageId: "sequences/r6u4ghtv3smv1zeh6rvv",
    url: "/codex",
  },
  {
    title: "HPMOR",
    description: "The ideas in fiction — how most readers arrive here.",
    imageId: "DALL_E_2022-07-13_21.49.04_-_11_year_old_wizard_boy_with_short_messy_black_hair_and_glasses_standing_upright_looking_intently_at_the_camera_casting_a_question_spell_glowing_wh_l1ls1k",
    url: "/hpmor",
  },
  {
    title: "Best of LessWrong",
    description: "Each December the community reviews the past year's posts and votes on which have stood the test of time.",
    imageId: "DALL_E_2022-07-13_22.57.43_-_Books_and_emerald_compass_displayed_on_a_pedastal_aquarelle_painting_by_da_vinci_and_thomas_shaler_magic_the_gathering_concept_art_as_digital_art_ayufzo",
    url: "/bestoflesswrong",
  },
  {
    title: "Replacing Guilt",
    description: "Guilt-based motivation, replaced with something that lasts.",
    imageId: "sequences/bj5eolzptpnu9fi9gi1a",
    url: "/s/pFatcKW3JJhTSxqAF",
  },
  {
    title: "Embedded Agency",
    description: "Why embedded agents break the standard theory of decisions.",
    imageId: "sequences/mybmkfxylya5scv99ggy",
    url: "/s/Rm6oQRJJmhGCcLvxh",
  },
  {
    title: "Inadequate Equilibria",
    description: "When can you outperform the experts and the markets?",
    imageId: "sequences/c1h4gtqbcw3v04ikuprj",
    url: "/s/oLGCcbnvabyibnG9d",
  },
];

const RATIONALITY_DESCRIPTION = "How can we think better on purpose? Why should we think better on purpose? For two years Eliezer Yudkowsky wrote a blogpost a day, braindumping thoughts on rationality, ambition and artificial intelligence. Those posts were edited into this introductory collection, recommended reading for all LessWrong users.";

const HIGHLIGHTS_DESCRIPTION = "LessWrong can be kind of intimidating - there's a lot of concepts to learn. We recommend getting started with the Highlights, a collection of 50 top posts from Eliezer's Sequences.";

const styles = defineStyles('LibraryRecommendedZone', (theme: ThemeType) => ({
  label: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: '.6px',
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 12,
  },
  panel: {
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.025)}`,
  },
  heroPanel: {
    marginBottom: 10,
  },
  heroRow: {
    padding: 20,
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      flexWrap: 'wrap',
    },
  },
  coverWrapper: {
    display: 'block',
    flex: 'none',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 26,
    fontWeight: 400,
    lineHeight: 1.2,
    margin: '3px 0 5px',
    color: theme.palette.text.normal,
  },
  heroSubtitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 18,
    color: theme.palette.text.secondary,
    marginBottom: 8,
  },
  heroBody: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 14.5,
    lineHeight: '20px',
    color: theme.palette.text.secondary,
    maxWidth: 420,
  },
  startButton: {
    display: 'inline-block',
    background: 'light-dark(#f1f1f1, #333333)',
    borderRadius: 10,
    padding: '14px 26px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.greyAlpha(0.87),
    whiteSpace: 'nowrap',
    '&:hover': {
      background: 'light-dark(#e7e7e7, #3d3d3d)',
    },
  },
  heroDivider: {
    borderTop: theme.palette.border.faint,
    margin: '0 20px',
  },
  highlightsRow: {
    padding: '16px 20px',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    '&:hover': {
      background: theme.palette.background.hover,
    },
    [theme.breakpoints.down('xs')]: {
      flexWrap: 'wrap',
    },
  },
  highlightsTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 18,
    fontWeight: 500,
    margin: '2px 0',
    color: theme.palette.text.normal,
  },
  highlightsBody: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13.5,
    lineHeight: '19px',
    color: theme.palette.text.secondary,
    maxWidth: 460,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    display: 'block',
    overflow: 'hidden',
    '&:hover': {
      boxShadow: `0 0 10px ${theme.palette.boxShadowColor(0.2)}`,
    },
  },
  cardImageWrapper: {
    display: 'block',
  },
  cardImage: {
    display: 'block',
    width: '100%',
    height: 130,
    objectFit: 'cover',
  },
  cardBody: {
    padding: '14px 16px',
  },
  cardTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 16.9,
    fontWeight: 500,
    marginTop: 3,
    color: theme.palette.text.normal,
  },
  cardDescription: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13.5,
    lineHeight: '18px',
    color: theme.palette.text.secondary,
    marginTop: 4,
  },
}));

const LibraryRecommendedZone = () => {
  const classes = useStyles(styles);

  return <AnalyticsContext pageSectionContext="libraryRecommended">
    <div>
      <div className={classes.label}>Recommended</div>
      <div className={classNames(classes.panel, classes.heroPanel)}>
        <div className={classes.heroRow}>
          <CloudinaryImage2
            publicId="mississippi-compass_gwqjvs"
            width={128}
            height={164}
            objectFit="cover"
            wrapperClassName={classes.coverWrapper}
          />
          <div className={classes.heroText}>
            <div className={classes.heroTitle}>Rationality: A–Z</div>
            <div className={classes.heroSubtitle}>Also known as “The Sequences”</div>
            <div className={classes.heroBody}>{RATIONALITY_DESCRIPTION}</div>
          </div>
          <Link to="/rationality" className={classes.startButton}>Start</Link>
        </div>
        <div className={classes.heroDivider} />
        <Link to="/highlights" className={classes.highlightsRow}>
          <CloudinaryImage2
            publicId="sequences/rdl8pwokejuqyxipg6vx"
            width={84}
            height={104}
            objectFit="cover"
            wrapperClassName={classes.coverWrapper}
          />
          <div className={classes.heroText}>
            <div className={classes.highlightsTitle}>Highlights of The Sequences</div>
            <div className={classes.highlightsBody}>{HIGHLIGHTS_DESCRIPTION}</div>
          </div>
          <span className={classes.startButton}>Start</span>
        </Link>
      </div>
      <div className={classes.cardGrid}>
        {RECOMMENDED_CARDS.map(card =>
          <Link key={card.title} to={card.url} className={classNames(classes.panel, classes.card)}>
            <CloudinaryImage2
              publicId={card.imageId}
              imgProps={{w: "522", h: "260"}}
              className={classes.cardImage}
              wrapperClassName={classes.cardImageWrapper}
            />
            <div className={classes.cardBody}>
              <div className={classes.cardTitle}>{card.title}</div>
              <div className={classes.cardDescription}>{card.description}</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  </AnalyticsContext>;
};

export default LibraryRecommendedZone;
