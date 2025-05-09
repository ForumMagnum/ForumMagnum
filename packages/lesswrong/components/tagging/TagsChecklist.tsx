import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { tagStyle, coreTagStyle, smallTagTextStyle } from './FooterTag';
import { taggingNameSetting } from '../../lib/instanceSettings';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { LWTooltip } from "../common/LWTooltip";
import { LoadMore } from "../common/LoadMore";
import { ForumIcon } from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
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
    ...(isFriendlyUI
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
    ...(isFriendlyUI ? coreTagStyle(theme) : {}),
    cursor: 'default'
  },
  smallTag: {
    ...smallTagTextStyle(theme),
    "& .TagsChecklist-removeTag svg": {
      top: 2
    },
  },
  finalTag: {
    marginRight: 8,
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
    color: theme.palette.grey[500],
    whiteSpace: "nowrap",
  },
  smallLoadMore: {
    fontSize: 13,
    fontWeight: 600,
  },
});

export interface ChecklistTag {
  _id: string;
  name: string;
  shortName: string | null;
  parentTag?: ChecklistTag;
}

interface TagsChecklistItem {
  tag: ChecklistTag,
  selected: boolean,
}

const TagsChecklistInner = ({
  onTagSelected = () => {},
  onTagRemoved = () => {},
  classes,
  selectedTagIds: selectedTagIds = [],
  tags,
  displaySelected = "hide",
  tooltips = true,
  truncate = false,
  smallText = false,
  shortNames = false,
}: {
  onTagSelected?: (
    tag: { tagId: string; tagName: string; parentTagId?: string },
    existingTagIds: Array<string>
  ) => void;
  onTagRemoved?: (tag: { tagId: string; tagName: string; parentTagId?: string }, existingTagIds: Array<string>) => void;
  classes: ClassesType<typeof styles>;
  selectedTagIds?: Array<string | undefined>;
  tags: Pick<TagFragment, "_id" | "name" | "shortName">[];
  displaySelected?: "highlight" | "hide";
  tooltips?: boolean;
  truncate?: boolean;
  smallText?: boolean,
  shortNames?: boolean,
}) => {
  const [loadMoreClicked, setLoadMoreClicked] = useState(false);

  const getTagsToDisplay = (): TagsChecklistItem[] => {
    if (displaySelected === "hide") {
      return tags
        .filter((tag) => !selectedTagIds.includes(tag._id))
        .map((tag) => ({ tag, selected: false }));
    } else {
      return tags.map((tag) => ({ tag, selected: selectedTagIds.includes(tag._id) }));
    }
  };

  const actuallyTruncate = truncate && !loadMoreClicked;

  const allRelevantTags = getTagsToDisplay();
  const selectedTags = allRelevantTags.filter((tag) => tag.selected);

  let tagsToDisplay = allRelevantTags;
  // The first 5 tags can always be displayed if the list is truncated.
  // If another tag beyond this is selected, it should be added to the front of the list.
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

  const getTagName = ({tag}: TagsChecklistItem) => smallText || shortNames
    ? tag.shortName ?? tag.name
    : tag.name;

  return (
    <>
      {tagsToDisplay?.map((tagChecklistItem, i) =>
        tagChecklistItem.selected ? (
          <div
            key={tagChecklistItem.tag._id}
            className={classNames(classes.selectedTag, {
              [classes.smallTag]: smallText,
              [classes.finalTag]: i === tagsToDisplay.length - 1,
            })}
          >
            {getTagName(tagChecklistItem)}
            <button
              className={classes.removeTag} 
              onClick={() => handleOnTagRemoved(tagChecklistItem.tag, selectedTagIds)}
            >
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
            hideOnTouchScreens
          >
            <div
              className={classNames(classes.tag, {
                [classes.smallTag]: smallText,
                [classes.finalTag]: i === tagsToDisplay.length - 1,
              })}
              onClick={() => handleOnTagSelected(tagChecklistItem.tag, selectedTagIds)}
            >
              {getTagName(tagChecklistItem)}
            </div>
          </LWTooltip>
        )
      )}
      {shouldDisplayLoadMore && <LoadMore
        message={`${numHidden} more`}
        loadMore={() => setLoadMoreClicked(true)}
        className={classNames(classes.loadMore, {
          [classes.smallLoadMore]: smallText,
        })}
      />}
    </>
  );
};


export const TagsChecklist = registerComponent("TagsChecklist", TagsChecklistInner, {styles});


