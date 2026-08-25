import React from 'react';
import classNames from 'classnames';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { Link } from '../../lib/reactRouterWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import CloudinaryImage2 from '../common/CloudinaryImage2';
import { CloudinaryPropsType } from '../common/cloudinaryHelpers';
import HoverOver from '../common/HoverOver';
import { LibraryRowHoverCard } from './LibrarySequenceRow';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

interface LibraryRecommendedCard {
  title: string,
  /** Fallback shown if the item's database description fails to load */
  description: string,
  /** Set for cards whose target is a Collection; its description is loaded from the db */
  collectionId?: string,
  /** Set for cards whose target is a Sequence; its description is loaded from the db */
  sequenceId?: string,
  imageId: string,
  url: string,
  /** Cloudinary transform override, for art that needs a custom crop */
  imgProps?: CloudinaryPropsType,
}

// Hardcoded editorial picks, following the precedent of LWCoreReading's
// coreReadingCollections. Image ids are the items' existing Cloudinary art;
// swap these when final cover art for the redesign is settled.
const RECOMMENDED_CARDS: LibraryRecommendedCard[] = [
  {
    title: "The Codex",
    description: "Scott Alexander on science, medicine, philosophy, futurism and politics.",
    collectionId: "2izXHCrmJ684AnZ5X",
    imageId: "sequences/okpfwqjpdam8czvradbx",
    url: "/codex",
  },
  {
    title: "HPMOR",
    description: "The ideas in fiction — how most readers arrive here.",
    collectionId: "ywQvGBSojSQZTMpLh",
    imageId: "DALL_E_2022-07-13_21.49.04_-_11_year_old_wizard_boy_with_short_messy_black_hair_and_glasses_standing_upright_looking_intently_at_the_camera_casting_a_question_spell_glowing_wh_l1ls1k",
    url: "/hpmor",
  },
  {
    title: "Best of LessWrong",
    description: "Each December the community reviews the past year's posts and votes on which have stood the test of time.",
    collectionId: "nmk3nLpQE89dMRzzN",
    imageId: "DALL_E_2022-07-13_22.57.43_-_Books_and_emerald_compass_displayed_on_a_pedastal_aquarelle_painting_by_da_vinci_and_thomas_shaler_magic_the_gathering_concept_art_as_digital_art_ayufzo",
    url: "/bestoflesswrong",
  },
  {
    title: "Replacing Guilt",
    description: "Guilt-based motivation, replaced with something that lasts.",
    sequenceId: "pFatcKW3JJhTSxqAF",
    imageId: "sequences/ojux53txivllnxot2xok",
    url: "/s/pFatcKW3JJhTSxqAF",
  },
  {
    title: "Embedded Agency",
    description: "Why embedded agents break the standard theory of decisions.",
    sequenceId: "Rm6oQRJJmhGCcLvxh",
    imageId: "sequences/mybmkfxylya5scv99ggy",
    url: "/s/Rm6oQRJJmhGCcLvxh",
  },
  {
    title: "Inadequate Equilibria",
    description: "When can you outperform the experts and the markets?",
    sequenceId: "oLGCcbnvabyibnG9d",
    imageId: "sequences/c1h4gtqbcw3v04ikuprj",
    // The art is a 2133x1600 black field with a small emblem at the center;
    // crop in around the emblem so it isn't a speck at card size.
    imgProps: {c: "crop", g: "center", w: "1044", h: "520"},
    url: "/s/oLGCcbnvabyibnG9d",
  },
];

const RATIONALITY_COLLECTION_ID = "oneQyj4pw77ynzwAF";

const RECOMMENDED_COLLECTION_IDS = [
  RATIONALITY_COLLECTION_ID,
  ...RECOMMENDED_CARDS.flatMap(card => card.collectionId ? [card.collectionId] : []),
];
const RECOMMENDED_SEQUENCE_IDS = RECOMMENDED_CARDS.flatMap(card => card.sequenceId ? [card.sequenceId] : []);

const LibraryRecommendedCollectionsQuery = gql(`
  query LibraryRecommendedCollections($collectionIds: [String!]) {
    collections(selector: { default: { collectionIds: $collectionIds } }, limit: 10) {
      results {
        _id
        title
        isBookmarked
        postsCount
        readPostsCount
        user {
          _id
          displayName
        }
        contents {
          _id
          plaintextDescription
        }
      }
    }
  }
`);

const LibraryRecommendedSequencesQuery = gql(`
  query LibraryRecommendedSequences($sequenceIds: [String!]) {
    sequences(selector: { default: { sequenceIds: $sequenceIds } }, limit: 10) {
      results {
        _id
        title
        isBookmarked
        postsCount
        readPostsCount
        user {
          _id
          displayName
        }
        contents {
          _id
          plaintextDescription
        }
      }
    }
  }
`);

interface RecommendedItemInfo {
  title: string | null,
  authorName: string | null,
  description: string | null,
  isBookmarked: boolean,
  postsCount: number,
  readPostsCount: number,
}

// Wraps a recommended-zone box with the shared library hover-preview card,
// filled from the item's database record (with hardcoded fallbacks for
// anything not yet loaded).
const RecommendedHoverOver = ({info, fallbackTitle, fallbackDescription, url, documentId, collectionName, className, children}: {
  info: RecommendedItemInfo | undefined,
  fallbackTitle: string,
  fallbackDescription: string,
  url: string,
  documentId: string,
  collectionName: 'Sequences' | 'Collections',
  className?: string,
  children: React.ReactNode,
}) => {
  return <HoverOver
    title={<LibraryRowHoverCard
      title={info?.title ?? fallbackTitle}
      authorName={info?.authorName ?? null}
      description={info?.description ?? fallbackDescription}
      url={url}
      documentId={documentId}
      collectionName={collectionName}
      isBookmarked={info?.isBookmarked ?? false}
      postsCount={info?.postsCount ?? 0}
      readPostsCount={info?.readPostsCount ?? 0}
    />}
    placement="bottom-start"
    tooltip={false}
    clickable
    hideOnTouchScreens
    inlineBlock={false}
    As="div"
    className={className}
    analyticsProps={{ pageElementContext: 'libraryRecommendedHoverCard' }}
  >
    {children}
  </HoverOver>;
};

const RATIONALITY_DESCRIPTION = "How can we think better on purpose? Why should we think better on purpose? For two years Eliezer Yudkowsky wrote a blogpost a day, braindumping thoughts on rationality, ambition and artificial intelligence. Those posts were edited into this introductory collection, recommended reading for all LessWrong users.";

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
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    minHeight: 215,
    [theme.breakpoints.down('xs')]: {
      flexWrap: 'wrap',
    },
  },
  // Stretches to the full row height, with the art's right side dissolving
  // into the panel background via a long alpha-mask fade, so the image melts
  // into the text bar instead of ending at a hard edge. The star stays small
  // and centered within the mask's solid zone.
  coverWrapper: {
    display: 'flex',
    flex: 'none',
    alignSelf: 'stretch',
    width: 230,
    maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 98%)',
    '-webkit-mask-image': 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 98%)',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  coverImage: {
    height: '100%',
    width: '100%',
  },
  heroText: {
    flex: 1,
    padding: '16px 0',
    position: 'relative',
  },
  heroTitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    ...theme.typography.smallCaps,
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
    marginRight: 20,
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
  // Single-line pointer to the Highlights under the Rationality: A–Z
  // description, presenting them as a lighter entry into the same work.
  highlightsLine: {
    display: 'inline-block',
    marginTop: 10,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13.5,
    color: theme.palette.primary.main,
    '&:hover': {
      color: theme.palette.primary.dark,
    },
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr',
    },
  },
  // The hover-over wrapper is the grid item; flex lets the card link inside
  // stretch to the full row height so cards in a row stay equal-height.
  cardHoverWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    display: 'block',
    overflow: 'hidden',
    flexGrow: 1,
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
    fontFamily: theme.typography.postStyle.fontFamily,
    ...theme.typography.smallCaps,
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
    display: '-webkit-box',
    '-webkit-line-clamp': 3,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
}));

const LibraryRecommendedZone = () => {
  const classes = useStyles(styles);

  const { data: collectionsData } = useQuery(LibraryRecommendedCollectionsQuery, {
    variables: { collectionIds: RECOMMENDED_COLLECTION_IDS },
  });
  const { data: sequencesData } = useQuery(LibraryRecommendedSequencesQuery, {
    variables: { sequenceIds: RECOMMENDED_SEQUENCE_IDS },
  });

  const infoById: Record<string, RecommendedItemInfo> = {};
  for (const result of [
    ...(collectionsData?.collections?.results ?? []),
    ...(sequencesData?.sequences?.results ?? []),
  ]) {
    infoById[result._id] = {
      title: result.title ?? null,
      authorName: result.user?.displayName ?? null,
      description: result.contents?.plaintextDescription ?? null,
      isBookmarked: result.isBookmarked ?? false,
      postsCount: result.postsCount ?? 0,
      readPostsCount: result.readPostsCount ?? 0,
    };
  }

  return <AnalyticsContext pageSectionContext="libraryRecommended">
    <div>
      <div className={classes.label}>Recommended</div>
      <div className={classNames(classes.panel, classes.heroPanel)}>
        <RecommendedHoverOver
          info={infoById[RATIONALITY_COLLECTION_ID]}
          fallbackTitle="Rationality: A–Z"
          fallbackDescription={RATIONALITY_DESCRIPTION}
          url="/rationality"
          documentId={RATIONALITY_COLLECTION_ID}
          collectionName="Collections"
        >
          <div className={classes.heroRow}>
            <CloudinaryImage2
              publicId="mississippi-compass_gwqjvs"
              width={230}
              // c_fill (rather than the default scale) keeps the compass star
              // centered instead of squashing the art to the requested aspect.
              imgProps={{c: "fill", g: "center", w: "460", h: "490"}}
              objectFit="cover"
              className={classes.coverImage}
              wrapperClassName={classes.coverWrapper}
            />
            <div className={classes.heroText}>
              <div className={classes.heroTitle}>Rationality: A–Z</div>
              <div className={classes.heroSubtitle}>Also known as “The Sequences”</div>
              <div className={classes.heroBody}>{RATIONALITY_DESCRIPTION}</div>
              <Link to="/highlights" className={classes.highlightsLine}>
                or read the highlights of the sequences here
              </Link>
            </div>
            <Link to="/rationality" className={classes.startButton}>Start</Link>
          </div>
        </RecommendedHoverOver>
      </div>
      <div className={classes.cardGrid}>
        {RECOMMENDED_CARDS.map(card => {
          const documentId = card.collectionId ?? card.sequenceId ?? '';
          return <RecommendedHoverOver
            key={card.title}
            info={infoById[documentId]}
            fallbackTitle={card.title}
            fallbackDescription={card.description}
            url={card.url}
            documentId={documentId}
            collectionName={card.collectionId ? 'Collections' : 'Sequences'}
            className={classes.cardHoverWrapper}
          >
            <Link to={card.url} className={classNames(classes.panel, classes.card)}>
              <CloudinaryImage2
                publicId={card.imageId}
                imgProps={card.imgProps ?? {w: "522", h: "260"}}
                className={classes.cardImage}
                wrapperClassName={classes.cardImageWrapper}
              />
              <div className={classes.cardBody}>
                <div className={classes.cardTitle}>{card.title}</div>
                <div className={classes.cardDescription}>
                  {infoById[documentId]?.description ?? card.description}
                </div>
              </div>
            </Link>
          </RecommendedHoverOver>;
        })}
      </div>
    </div>
  </AnalyticsContext>;
};

export default LibraryRecommendedZone;
