import React, { useEffect } from "react";
import { Components } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useQuickTakesTags } from "../quickTakes/useQuickTakesTags";
import type { TypedFieldApi } from "@/components/tanstack-form-components/BaseAppForm";

const styles = defineStyles('FormComponentQuickTakesTags', (_theme: ThemeType) => ({
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
}));

export const FormComponentQuickTakesTags = ({ field }: {
  field: TypedFieldApi<string[] | null>;
}) => {
  const classes = useStyles(styles);
  
  const {
    loading,
    frontpage,
    selectedTagIds,
    tags,
    frontpageTagId,
    onTagSelected,
    onTagRemoved,
  } = useQuickTakesTags(field.state.value ?? []);

  useEffect(() => {
    field.handleChange(selectedTagIds ?? null);
  }, [field, selectedTagIds])

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
