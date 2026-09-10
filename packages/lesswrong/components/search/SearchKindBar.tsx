import React from 'react';
import classNames from 'classnames';
import { SearchIndexCollectionName } from '@/lib/search/searchUtil';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import SearchChip from './SearchChip';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import LocalOfferOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/LocalOfferOutlined';
import ChatBubbleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/ChatBubbleOutline';
import LocalLibraryIcon from '@/lib/vendor/@material-ui/icons/src/LocalLibrary';

export interface SearchKind {
  type: SearchIndexCollectionName;
  label: string;
  Icon: typeof PersonIcon;
}

/** Content kinds in display order, shared by the header search and the search page. */
export const searchKinds: SearchKind[] = [
  { type: "Users", label: "User", Icon: PersonIcon },
  { type: "Posts", label: "Post", Icon: DescriptionIcon },
  { type: "Tags", label: "Wiki entry", Icon: LocalOfferOutlinedIcon },
  { type: "Comments", label: "Comment", Icon: ChatBubbleOutlineIcon },
  { type: "Sequences", label: "Sequence", Icon: LocalLibraryIcon },
];

export function toggleSearchKind(kinds: SearchIndexCollectionName[], type: SearchIndexCollectionName): SearchIndexCollectionName[] {
  return kinds.includes(type) ? kinds.filter(kind => kind !== type) : [...kinds, type];
}

const styles = defineStyles("SearchKindBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    gap: 4,
    padding: 4,
    overflowX: "auto",
  },
}));

/** An empty selection means every kind. */
const SearchKindBar = ({enabled, onToggle, onClear, className}: {
  enabled: SearchIndexCollectionName[],
  onClear?: () => void,
  onToggle: (type: SearchIndexCollectionName) => void,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, className)} role="group" aria-label="Search content kinds">
    {onClear && <SearchChip selected={!enabled.length || enabled.length === searchKinds.length} onToggle={onClear}>All</SearchChip>}
    {searchKinds.map(({type, label, Icon}) => <SearchChip
      key={type}
      Icon={Icon}
      selected={enabled.includes(type)}
      onToggle={() => onToggle(type)}
    >
      {label}
    </SearchChip>)}
  </div>;
};

export default SearchKindBar;
