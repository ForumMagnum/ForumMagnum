import React, { useCallback, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { InstantSearch } from '../../lib/utils/componentsWithChildren';
import { SearchBox, Hits, Configure } from 'react-instantsearch-dom';
import { getSearchIndexName, getSearchClient, isSearchEnabled } from '../../lib/search/searchUtil';
import { useCurrentUser } from '../common/withUser';
import { userCanCreateTags } from '../../lib/betas';
import { Link } from '../../lib/reactRouterWrapper';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { getAllTagsPath } from '../../lib/routes';
import type { SearchState } from 'react-instantsearch-core';

const styles = (theme: ThemeType) => ({
  root: {
    "& .ais-SearchBox": {
      padding: 8,
    },
    '& .ais-SearchBox-input': {
      background: "transparent",
    },
    '& .ais-SearchBox-submit': {
      position: "absolute",
      right: 11
    },
    '& .ais-SearchBox-submitIcon path': {
      fill: theme.palette.grey[900],
    },
  },
  newTag: {
    display: "block",
    padding: 8,
    cursor: "pointer",
    color: theme.palette.grey[600],
    ...theme.typography.commentStyle
  },
});

const AddTagOrWikiPageInner = ({onTagSelected, isVotingContext, onlyTags, numSuggestions=6, showAllTagsAndCreateTags=true, classes}: {
  onTagSelected: (props: {tagId: string, tagName: string, tagSlug: string}) => void,
  isVotingContext?: boolean,
  onlyTags: boolean,
  numSuggestions?: number,
  showAllTagsAndCreateTags?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {TagSearchHit, DropdownDivider} = Components
  const currentUser = useCurrentUser()
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchStateChanged = React.useCallback((searchState: SearchState) => {
    setSearchOpen((searchState.query?.length ?? 0) > 0);
  }, []);
  const inputRef = useRef<HTMLInputElement>();

  // When this appears, yield to the event loop once, use getElementsByTagName
  // to find the search input text box, then focus it.
  //
  // Why this hideously complicated thing, rather than just set autoFocus={true}
  // on the <SearchBox> component? Unfortunately this component gets used inside
  // Material-UI Poppers, and Poppers have an unfortunate property: they first
  // render off-screen, then measure the size of their contents, then move
  // themselves to their correct position. This means that during first-render,
  // this component is positioned in an off-screen temporary location, and if
  // you focus the input box then, it will scroll the page to the bottom. In
  // order to avoid this, we have to defer focusing until Popper is finished,
  // ie setTimeout(..., 0). Unfortunately again, react-instantsearch's SearchBox
  // component doesn't expose an API for controlling focus other than at mount
  // time, so in order to find the text box we want focused, we have to search
  // the DOM for it.
  const containerRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.getElementsByTagName("input")[0];
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  }, []);

  if (!isSearchEnabled()) {
    return <div className={classes.root} ref={containerRef}>
      <input placeholder="Tag ID" type="text" onKeyPress={ev => {
        if (ev.charCode===13) {
          const id = (ev.target as any).value;
          onTagSelected({
            tagId: id,
            tagName: "Tag",
            tagSlug: id,
          });
          ev.preventDefault();
        }
      }}/>
    </div>
  }

  return <div className={classes.root} ref={containerRef}>
    <InstantSearch
      indexName={getSearchIndexName("Tags")}
      searchClient={getSearchClient()}
      onSearchStateChange={searchStateChanged}
    >
      {/* Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop, when
        * null is the only option that actually suppresses the extra X button.
       // @ts-ignore */}
      <SearchBox inputRef={inputRef} reset={null} focusShortcuts={[]}/>
      <Configure
        facetFilters={onlyTags ? [["wikiOnly:false"]] : []}
        hitsPerPage={searchOpen ? 12 : numSuggestions}
      />
      <Hits hitComponent={({hit}: {hit: any}) =>
        <TagSearchHit
          hit={hit}
          onClick={ev => {
            onTagSelected({
              tagId: hit._id,
              tagName: hit.name,
              tagSlug: hit.slug,
            });
            ev.stopPropagation();
          }}
          isVotingContext={isVotingContext}
        />
      }/>
    </InstantSearch>
    {showAllTagsAndCreateTags && <>
      <DropdownDivider />
      <Link target="_blank" to={getAllTagsPath()} className={classes.newTag}>
        All {taggingNamePluralCapitalSetting.get()}
      </Link>
      {userCanCreateTags(currentUser) && tagUserHasSufficientKarma(currentUser, "new") && <Link
        target="_blank"
        to={tagCreateUrl}
        className={classes.newTag}
      >
        Create {taggingNameCapitalSetting.get()}
      </Link>}
    </>}
  </div>
}

export const AddTagOrWikiPage = registerComponent("AddTagOrWikiPage", AddTagOrWikiPageInner, {styles});

declare global {
  interface ComponentTypes {
    AddTagOrWikiPage: typeof AddTagOrWikiPage
  }
}
