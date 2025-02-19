import React, { useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useQuickTakesTags } from "../quickTakes/useQuickTakesTags";

const styles = (_theme: ThemeType) => ({
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: "4px",
    alignItems: "center",
    marginTop: 16,
    marginLeft: 8,
  },
  tagLabel: {
    fontWeight: 600,
    fontSize: 13,
    marginRight: 8,
  },
})

const FormComponentQuickTakesTags = ({
  value,
  path,
  updateCurrentValues,
  classes,
}: FormComponentProps<AnyBecauseTodo> & {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    loading,
    frontpage,
    selectedTagIds,
    tags,
    frontpageTagId,
    onTagSelected,
    onTagRemoved,
  } = useQuickTakesTags(value);

  useEffect(() => {
    void updateCurrentValues({[path]: selectedTagIds})
  }, [updateCurrentValues, path, selectedTagIds])

  const {TagsChecklist, Loading} = Components;
  return <div className={classes.tagContainer}>
    <span className={classes.tagLabel}>Set topic</span>
    {loading
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
    )}
  </div>
}

const FormComponentQuickTakesTagsComponent = registerComponent(
  "FormComponentQuickTakesTags",
  FormComponentQuickTakesTags,
  {styles}
);

declare global {
  interface ComponentTypes {
    FormComponentQuickTakesTags: typeof FormComponentQuickTakesTagsComponent
  }
}
