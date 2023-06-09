import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { ChecklistTag } from '../tagging/TagsChecklist';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "baseline",
    [theme.breakpoints.down("xs")]: {
      flexWrap: "wrap",
    },
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  heading: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    marginRight: 4,
  },
});

const FRONTPAGE_TAG_ID = "frontpage";
const FRONTPAGE_DUMMY_TAG: ChecklistTag = {
  _id: FRONTPAGE_TAG_ID,
  name: "Frontpage",
  shortName: null,
}

const FormComponentTagsChecklist = ({
  document,
  path,
  label,
  value,
  updateCurrentValues,
  classes,
}: FormComponentProps<any> & {
  classes: ClassesType,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "coreAndSubforumTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
  });
  const isShortform = !!document.shortform;

  const { Loading, TagsChecklist } = Components;

  if (loading) return <Loading />;
  if (!results) return null;

  const onTagSelected = (
    tag: { tagId: string; tagName: string; parentTagId?: string },
    existingTagIds: Array<string>
  ) => {
    if (tag.tagId === FRONTPAGE_TAG_ID) {
      void updateCurrentValues({
        shortformFrontpage: true,
      });
      return;
    }

    const newValue = Array.from(new Set([
      ...existingTagIds,
      tag.tagId,
      tag.parentTagId,
    ])).filter((id) => !!id);
    void updateCurrentValues({
      [path]: newValue,
    });
  };

  const onTagRemoved = (
    tag: { tagId: string; tagName: string; parentTagId?: string },
    existingTagIds: Array<string>
  ): void => {
    if (tag.tagId === FRONTPAGE_TAG_ID) {
      void updateCurrentValues({
        shortformFrontpage: false,
      });
      return;
    }

    const newValue = existingTagIds.filter((id) => id !== tag.tagId);
    void updateCurrentValues({
      [path]: newValue,
    });
  };

  const tags = isShortform ? [FRONTPAGE_DUMMY_TAG, ...results] : results;
  const selectedTagIds = isShortform ?
    [...(document.shortformFrontpage ? [FRONTPAGE_TAG_ID] : []), ...value]
    : value;

  return (
    <div className={classes.root}>
      <h3 className={classes.heading}>{label}</h3>
      <div className={classes.tags}>
        <TagsChecklist
          tags={tags}
          displaySelected="highlight"
          selectedTagIds={selectedTagIds ?? []}
          onTagSelected={onTagSelected}
          onTagRemoved={onTagRemoved}
          tooltips={false}
          // TODO: Ideally should be getting this from the a form prop
          truncate={isShortform}
          smallText
        />
      </div>
    </div>
  );
};

const FormComponentTagsChecklistComponent = registerComponent(
  "FormComponentTagsChecklist",
  FormComponentTagsChecklist,
  {styles},
);

declare global {
  interface ComponentTypes {
    FormComponentTagsChecklist: typeof FormComponentTagsChecklistComponent
  }
}
