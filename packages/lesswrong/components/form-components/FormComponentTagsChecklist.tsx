import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  heading: {
    ...theme.typography.uiSecondary,
  },
});

const FormComponentTagsChecklist = ({
  document,
  path,
  label,
  value,
  updateCurrentValues,
  classes,
}: {
  document: any;
  path: string;
  label?: string;
  value: any;
  updateCurrentValues: any;
  classes: ClassesType;
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "coreAndSubforumTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
  });

  const { Loading, TagsChecklist } = Components;

  // TODO; ideally would not be hard-coded to be dependent on only being show on
  // shortform comments
  if (!document.shortform) {
    return null;
  }

  if (loading) return <Loading />;
  if (!results) return null;

  const onTagSelected = (
    tag: { tagId: string; tagName: string; parentTagId?: string },
    existingTagIds: Array<string>
  ) => {
    const newValue = Array.from(new Set([...existingTagIds, tag.tagId, tag.parentTagId])).filter((id) => !!id);
    updateCurrentValues({
      [path]: newValue,
    });
  };

  const onTagRemoved = (
    tag: { tagId: string; tagName: string; parentTagId?: string },
    existingTagIds: Array<string>
  ): void => {
    const newValue = existingTagIds.filter((id) => id !== tag.tagId);
    updateCurrentValues({
      [path]: newValue,
    });
  };

  return (
    <div>
      <h3 className={classes.heading}>{label}</h3>
      <TagsChecklist
        tags={results}
        displaySelected="highlight"
        selectedTagIds={value ?? []}
        onTagSelected={onTagSelected}
        onTagRemoved={onTagRemoved}
        tooltips={false}
        truncate={!!document.shortform}
      />
    </div>
  );
};

const FormComponentTagsChecklistComponent = registerComponent("FormComponentTagsChecklist", FormComponentTagsChecklist, {styles});

declare global {
  interface ComponentTypes {
    FormComponentTagsChecklist: typeof FormComponentTagsChecklistComponent
  }
}
