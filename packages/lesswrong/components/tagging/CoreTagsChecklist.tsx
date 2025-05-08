import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { tagStyle } from './FooterTag';
import { taggingNameSetting } from '../../lib/instanceSettings';
import { TagsChecklist } from "./TagsChecklist";
import { Loading } from "../vulcan-core/Loading";

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
    }
  }
}); 

const CoreTagsChecklistInner = ({onTagSelected, classes, existingTagIds=[] }: {
  onTagSelected?: (tag: {tagId: string, tagName: string}, existingTagIds: Array<string>) => void,
  classes: ClassesType<typeof styles>,
  existingTagIds?: Array<string|undefined>
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "coreTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
  });
  if (loading) return <Loading/>
  if (!results) return null
  
  return <TagsChecklist tags={results} onTagSelected={onTagSelected} selectedTagIds={existingTagIds}/>
}


export const CoreTagsChecklist = registerComponent("CoreTagsChecklist", CoreTagsChecklistInner, {styles});

declare global {
  interface ComponentTypes {
    CoreTagsChecklist: typeof CoreTagsChecklist
  }
}
