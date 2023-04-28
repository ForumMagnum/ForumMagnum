import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { tagStyle, coreTagStyle } from './FooterTag';
import { isEAForum, taggingNameSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 8,
    display: "flex",
    flexWrap: "wrap"
  },
  checkbox: {
    padding: "0 8px 2px 0",
    '& svg': {
      height:14,
      width: 14
    }
  },
  tag: {
    ...tagStyle(theme),
    backgroundColor: "unset",
    color: theme.palette.grey[500],
    border: theme.palette.border.extraFaint,
    '&:hover': {
      border: theme.palette.border.grey300,
      color: theme.palette.grey[800]
    },
    ...(isEAForum
      ? {
        ...coreTagStyle(theme),
        opacity: 0.6,
      }
      : {}),
  },
  selectedTag: {
    display: 'inline-flex',
    alignItems: 'baseline',
    position: 'relative',
    columnGap: 4,
    ...tagStyle(theme),
    ...(isEAForum ? coreTagStyle(theme) : {}),
    cursor: 'default'
  },
  removeTag: {
    background: 'transparent',
    color: 'inherit',
    width: 15,
    '&:hover': {
      opacity: 0.5
    },
    '& svg': {
      position: 'absolute',
      top: 7,
      right: 6,
      width: 13,
      height: 13,
    },
  },
  loadMore: {
    marginLeft: 8,
    color: theme.palette.grey[500],
  },
});

interface TagsChecklistItem {
  tag: TagFragment,
  selected: boolean,
}

const TagsChecklist = ({
  onTagSelected = () => {},
  onTagRemoved = () => {},
  classes,
  selectedTagIds: selectedTagIds = [],
  tags,
  displaySelected = "hide",
  tooltips = true,
  truncate = false,
}: {
  onTagSelected?: (
    tag: { tagId: string; tagName: string; parentTagId?: string },
    existingTagIds: Array<string>
  ) => void;
  onTagRemoved?: (tag: { tagId: string; tagName: string; parentTagId?: string }, existingTagIds: Array<string>) => void;
  classes: ClassesType;
  selectedTagIds?: Array<string | undefined>;
  tags: TagFragment[];
  displaySelected?: "highlight" | "hide";
  tooltips?: boolean;
  truncate?: boolean;
}) => {
  const { LWTooltip, LoadMore, ForumIcon } = Components;
  const [loadMoreClicked, setLoadMoreClicked] = useState(false);

  const getTagsToDisplay = (): TagsChecklistItem[] => {
    if (displaySelected === "hide") {
      return tags.filter((tag) => !selectedTagIds.includes(tag._id)).map((tag) => ({ tag, selected: false }));
    } else {
      return tags.map((tag) => ({ tag, selected: selectedTagIds.includes(tag._id) }));
    }
  };

  const actuallyTruncate = truncate && !loadMoreClicked;

  const allRelevantTags = getTagsToDisplay();
  const selectedTags = allRelevantTags.filter((tag) => tag.selected);

  let tagsToDisplay = allRelevantTags;
  // The first 5 tags can always be displayed if the list is truncated.
  // If another tag beyonf this is selected, it should be added to the front of the list.
  if (actuallyTruncate) {
    const initialTagsToDisplay = allRelevantTags.slice(0, 5);
    const selectedHiddenTags = selectedTags.filter((tag) => !initialTagsToDisplay.includes(tag));

    // Add hidden tags to the front of the list
    tagsToDisplay = selectedHiddenTags.length > 0 ? selectedHiddenTags.concat(initialTagsToDisplay) : initialTagsToDisplay;
  }
  const shouldDisplayLoadMore = actuallyTruncate && tagsToDisplay.length < allRelevantTags.length;
  const numHidden = allRelevantTags.length - tagsToDisplay.length;

  const handleOnTagSelected = (tag: AnyBecauseTodo, existingTagIds: AnyBecauseTodo) => onTagSelected({ tagId: tag._id, tagName: tag.name, parentTagId: tag.parentTag?._id }, existingTagIds)
  const handleOnTagRemoved = (tag: AnyBecauseTodo, existingTagIds: AnyBecauseTodo) => onTagRemoved({ tagId: tag._id, tagName: tag.name, parentTagId: tag.parentTag?._id }, existingTagIds)

  return (
    <>
      {tagsToDisplay?.map((tagChecklistItem) =>
        tagChecklistItem.selected ? (
          <div className={classes.selectedTag} key={tagChecklistItem.tag._id}>
            {tagChecklistItem.tag.name}
            <button className={classes.removeTag} onClick={() => handleOnTagRemoved(tagChecklistItem.tag, selectedTagIds)}>
              <ForumIcon icon="Close" />
            </button>
          </div>
        ) : (
          <LWTooltip
            key={tagChecklistItem.tag._id}
            disabled={!tooltips}
            title={
              <div>
                Click to assign <em>{tagChecklistItem.tag.name}</em> {taggingNameSetting.get()}
                {!!tagChecklistItem.tag.parentTag && <span>. Its parent {taggingNameSetting.get()} <em>{tagChecklistItem.tag.parentTag.name}</em> will also be assigned automatically</span>}
              </div>
            }
          >
            <div className={classes.tag} onClick={() => handleOnTagSelected(tagChecklistItem.tag, selectedTagIds)}>
              {tagChecklistItem.tag.name}
            </div>
          </LWTooltip>
        )
      )}
      {shouldDisplayLoadMore && <LoadMore
        message={`${numHidden} more`}
        loadMore={() => setLoadMoreClicked(true)}
        className={classes.loadMore}
      />}
    </>
  );
};


const TagsChecklistComponent = registerComponent("TagsChecklist", TagsChecklist, {styles});

declare global {
  interface ComponentTypes {
    TagsChecklist: typeof TagsChecklistComponent
  }
}
