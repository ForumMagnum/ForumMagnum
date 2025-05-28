import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { tagStyle } from './FooterTag';
import { taggingNameSetting } from '../../lib/instanceSettings';
import TagsChecklist from "./TagsChecklist";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const TagFragmentMultiQuery = gql(`
  query multiTagCoreTagsChecklistQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagFragment
      }
      totalCount
    }
  }
`);

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

const CoreTagsChecklist = ({onTagSelected, classes, existingTagIds=[] }: {
  onTagSelected?: (tag: {tagId: string, tagName: string}, existingTagIds: Array<string>) => void,
  classes: ClassesType<typeof styles>,
  existingTagIds?: Array<string|undefined>
}) => {
  const { data, loading } = useQuery(TagFragmentMultiQuery, {
    variables: {
      selector: { coreTags: {} },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.tags?.results;
  if (loading) return <Loading/>
  if (!results) return null
  
  return <TagsChecklist tags={results} onTagSelected={onTagSelected} selectedTagIds={existingTagIds}/>
}


export default registerComponent("CoreTagsChecklist", CoreTagsChecklist, {styles});


