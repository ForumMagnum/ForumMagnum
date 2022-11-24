import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { tagStyle } from './FooterTag';
import { taggingNameSetting } from '../../lib/instanceSettings';

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
    }
  },
  selectedTag: {
    display: 'inline-flex',
    alignItems: 'baseline',
    columnGap: 4,
    ...tagStyle(theme),
    cursor: 'default'
  },
  removeTag: {
    background: 'transparent',
    color: 'inherit',
    '&:hover': {
      opacity: 0.5
    }
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
}) => {
  const { LWTooltip } = Components;

  const getTagsToDisplay = (): TagsChecklistItem[] => {
    if (displaySelected === "hide") {
      return tags.filter((tag) => !selectedTagIds.includes(tag._id)).map((tag) => ({ tag, selected: false }));
    } else {
      return tags.map((tag) => ({ tag, selected: selectedTagIds.includes(tag._id) }));
    }
  };
  const tagsToDisplay = getTagsToDisplay();

  const handleOnTagSelected = (tag, existingTagIds) => onTagSelected({ tagId: tag._id, tagName: tag.name, parentTagId: tag.parentTag?._id }, existingTagIds)
  const handleOnTagRemoved = (tag, existingTagIds) => onTagRemoved({ tagId: tag._id, tagName: tag.name, parentTagId: tag.parentTag?._id }, existingTagIds)

  return (
    <>
      {tagsToDisplay?.map((tagChecklistItem) =>
        tagChecklistItem.selected ? (
          <div className={classes.selectedTag} key={tagChecklistItem.tag._id}>
            {tagChecklistItem.tag.name}
            <button className={classes.removeTag} onClick={() => handleOnTagRemoved(tagChecklistItem.tag, selectedTagIds)}>x</button>
          </div>
        ) : (
          <LWTooltip
            key={tagChecklistItem.tag._id}
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
    </>
  );
};


const TagsChecklistComponent = registerComponent("TagsChecklist", TagsChecklist, {styles});

declare global {
  interface ComponentTypes {
    TagsChecklist: typeof TagsChecklistComponent
  }
}
