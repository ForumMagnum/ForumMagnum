import React, { useState, useMemo } from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useLocation } from '../../lib/routeUtil';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SearchIcon from '@material-ui/icons/Search';
import { InstantSearch } from '../../lib/utils/componentsWithChildren';
import { Configure, SearchBox, connectStateResults } from 'react-instantsearch-dom';
import { getSearchIndexName, getSearchClient } from '../../lib/search/searchUtil';
import { useSingle } from '@/lib/crud/withSingle';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { useMulti } from '@/lib/crud/withMulti';

const styles = defineStyles("AllWikiTagsPage", (theme: ThemeType) => ({
  root: {
    maxWidth: 900,
    margin: "0 auto",
    position: 'relative',
    paddingLeft: 10,
    paddingRight: 10,
  },
  topSection: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  addTagSection: {
    position: 'absolute',
    top: 78,
    right: 20,
  },
  addTagButton: {
    marginBottom: -10,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: 4,
    },
    '& span': {
      '@media (max-width: 400px)': {
        display: 'none',
      },
    }
  },
  titleClass: {
    fontSize: "4rem",
    fontWeight: 300,
    marginBottom: 0,
  },
  searchContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    height: "100%",
    maxWidth: 600,
    position: "relative",
  },
  searchInputArea: {
    display: "block",
    position: "relative",
    width: "100%",
    height: 48,
    marginBottom: 24,

    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      width: '100%',
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      fontSize: 14,
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit": {
      display: "none"
    },
    "& .ais-SearchBox-reset": {
      position: "absolute",
      top: "50%",
      right: 12,
      transform: "translateY(-50%)",
      border: "none",
      background: "none",
      cursor: "pointer",
      opacity: 0.8,
      padding: 4,
      "&:hover": {
        color: theme.palette.grey[700]
      }
    },
    "& .ais-SearchBox-input": {
      height: "100%",
      width: "100%",
      padding: "12px 48px",
      paddingRight: 40,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: theme.palette.panelBackground.default,
      fontSize: '1.4rem',
      "-webkit-appearance": "none",
      cursor: "text",
      borderRadius: 12,
    },
  },
  searchIcon: {
    color: theme.palette.grey[500],
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  mainContent: {
    display: "flex",
    gap: "32px",
    flexGrow: 1,
    flexDirection: "column",
    width: "100%",
  },
  arbitalRedirectNotice: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
    padding: "16px",
    borderRadius: 12,
    backgroundColor: theme.palette.arbital.arbitalGreen,
    marginBottom: 24,
    ...theme.typography.commentStyle,
    color: theme.palette.text.alwaysWhite,
    "& a": {
      color: theme.palette.text.alwaysWhite,
      textDecoration: "underline",
      textDecorationStyle: "dotted",
    },
    '&& h2': {
      fontSize: '1.7rem',
      marginTop: '0rem',
      marginBottom: '.5rem',
      fontWeight:500,
    },
  },
  arbitalLogo: {
    width: 100,
    overflow: 'visible',
    padding: 8
  },
  dismissButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  dismissButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      color: theme.palette.text.alwaysLightGrey,
    },
    '&:focus': {
      outline: 'none',
    },
  },
  arbitalRedirectNoticeContent: {},
}))


// Create the artificial "Uncategorized" tags
const uncategorizedRootTag = {
  _id: 'uncategorized-root',
  core: true,
  name: 'Uncategorized',
  slug: 'uncategorized-root',
  oldSlugs: [],
  description: {
    _id: 'uncategorized-root',
    wordCount: 0,
  },
  postCount: 0,
  baseScore: 0,
  maxScore: 0,
  usersWhoLiked: [],
  coreTagId: null,
  parentTagId: null,
  isArbitalImport: false,
  wikiOnly: true,
};

// TODO: we really need to figure out a better way to handle this than slugs, especially with the merged rationality page
const prioritySlugs = [
  'rationality', 'rationality-1', 'ai', 'world-modeling', 
  'world-optimization', 'practical', 'community', 'site-meta'
] as const;

const ArbitalRedirectNotice = ({ onDismiss }: {
  onDismiss: () => void,
}) => {
  const classes = useStyles(styles);
  const { Loading } = Components


  const redirectHtml = <div>
    <h2>You have been redirected from Arbital.com</h2>
    <p>Following the end of the <a href="/posts/kAgJJa3HLSZxsuSrf/arbital-postmortem">Arbital project</a>, the site's content has been integrated into the LessWrong wiki system, ensuring it is preserved for posterity.</p>
    <p>Among other goals, Arbital aimed to the best place on the Internet for explanations. It spawned a great number or excellent pages on AI Alignment and math. Some of the best pages of Arbital include: <a href="/w/bayes-rule?lens=bayes_rule_guide">Bayes's Rule Guide</a>, <a href="#">Logarithm Guide</a>, and many <a href="/w/eliezer-s-lost-alignment-articles-the-arbital-sequence">AI alignment pages</a> by Eliezer.</p>
    <p>Arbital content is indicated with the Arbital theme color and logo.</p>
  </div>



  return (
    <div className={classes.arbitalRedirectNotice}>
      <ArbitalLogo className={classes.arbitalLogo} />
      <div className={classes.arbitalRedirectNoticeContent}>
        {redirectHtml}
      </div>
      <div className={classes.dismissButtonContainer}>
        <button className={classes.dismissButton} onClick={onDismiss}>×</button>
      </div>
    </div>
  );
}

const AllWikiTagsPage = () => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();

  const { WikiTagGroup, Loading, NewWikiTagButton } = Components;

  const { query } = useLocation();
  const isArbitalRedirect = query.ref === 'arbital';

  const { results: priorityTagsRaw } = useMulti({
    collectionName: "Tags",
    fragmentName: "ConceptItemFragment",
    terms: { 
      view: "tagsBySlugs",
      slugs: [...prioritySlugs]
    },
    fetchPolicy: 'cache-and-network',
    ssr: true,
  });

  const priorityTags = useMemo(() => {
    if (!priorityTagsRaw) return [];
    const tags = filterNonnull(priorityTagsRaw);
    if (!tags.length) return [];
    
    return [...tags].sort((a: ConceptItemFragment, b: ConceptItemFragment) => {
      const indexA = prioritySlugs.indexOf(a.slug as typeof prioritySlugs[number]);
      const indexB = prioritySlugs.indexOf(b.slug as typeof prioritySlugs[number]);
      return indexA - indexB;
    });
  }, [priorityTagsRaw]);

  const [currentQuery, setCurrentQuery] = useState('');
  const [showArbitalRedirectNotice, setShowArbitalRedirectNotice] = useState(isArbitalRedirect);

  // Function to handle search state changes
  const handleSearchStateChange = (searchState: any) => {
    setCurrentQuery(searchState.query || '');
    captureEvent('searchQueryUpdated', { query: searchState.query });
  };

  const CustomStateResults = connectStateResults(({ searchResults, isSearchStalled }) => {
    const hits = (searchResults && searchResults.hits) || [];
    const tagIds = hits.map(hit => hit.objectID);

    if (!priorityTags) return null;

    if (isSearchStalled) {
      return <Loading />;
    }

    return (
      <AnalyticsContext searchQuery={currentQuery}>
      <div className={classes.mainContent}>
        {priorityTags.map((tag: ConceptItemFragment) => (
          tag && <WikiTagGroup
            key={tag._id}
            coreTag={tag}
            searchTagIds={currentQuery ? tagIds : null}
            showArbitalIcons={isArbitalRedirect}
          />
        ))}
        <WikiTagGroup
          coreTag={uncategorizedRootTag}
          searchTagIds={currentQuery ? tagIds : null}
          showArbitalIcons={isArbitalRedirect}
          noLinkOrHoverOnTitle
        />
      </div>
      </AnalyticsContext>
    );
  });

  return (
    <AnalyticsContext pageContext="allWikiTagsPage">
      <div>
        <div className={classes.addTagSection}>
          <NewWikiTagButton />
        </div>
        <div className={classes.root}>
          <div className={classes.topSection}>
            <div className={classes.titleSection}>
              <div className={classes.titleClass}>Concepts</div>
            </div>

            <div className={classes.searchContainer}>
              <InstantSearch
                indexName={getSearchIndexName('Tags')}
                searchClient={getSearchClient()}
                onSearchStateChange={handleSearchStateChange}
              >
                <div className={classes.searchInputArea}>
                  <Configure hitsPerPage={200} />
                  <SearchIcon className={classes.searchIcon} />
                  <SearchBox 
                    translations={{ placeholder: 'What would you like to read about?' }}
                  />
                </div>
                {isArbitalRedirect && showArbitalRedirectNotice && (
                  <ArbitalRedirectNotice
                    onDismiss={() => setShowArbitalRedirectNotice(false)}
                  />
                )}
                <CustomStateResults />
              </InstantSearch>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
};

const AllWikiTagsPageComponent = registerComponent("AllWikiTagsPage", AllWikiTagsPage);

export default AllWikiTagsPageComponent;

declare global {
  interface ComponentTypes {
    AllWikiTagsPage: typeof AllWikiTagsPageComponent
  }
}
