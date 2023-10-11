import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useQuickTakesTags } from "../quickTakes/useQuickTakesTags";

const FormComponentQuickTakesTags = ({
  value,
  path,
  document,
  formType,
  updateCurrentValues,
  placeholder,
  classes,
}: FormComponentProps<AnyBecauseTodo> & {
  classes: ClassesType,
}) => {
  const {
    loading,
    frontpage,
    selectedTagIds,
    tags,
    frontpageTagId,
    onTagSelected,
    onTagRemoved,
  } = useQuickTakesTags();

  const {TagsChecklist, Loading} = Components;
  return loading
    ? (
      <Loading />
    )
    :(
      <TagsChecklist
        tags={tags}
        displaySelected="highlight"
        selectedTagIds={[
          ...(frontpage ? [frontpageTagId] : []),
          ...selectedTagIds,
        ]}
        onTagSelected={onTagSelected}
        onTagRemoved={onTagRemoved}
        tooltips={false}
        truncate
        smallText
      />
    );
}

const FormComponentQuickTakesTagsComponent = registerComponent(
  "FormComponentQuickTakesTags",
  FormComponentQuickTakesTags,
);

declare global {
  interface ComponentTypes {
    FormComponentQuickTakesTags: typeof FormComponentQuickTakesTagsComponent
  }
}
