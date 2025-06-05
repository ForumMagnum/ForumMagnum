import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";
import Loading from "../vulcan-core/Loading";

const TagRelFragmentQuery = gql(`
  query TagRelNotificationItem($documentId: String) {
    tagRel(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagRelFragment
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  meta: {
    fontSize: ".9rem",
    color: theme.palette.text.dim45,
  },
  title: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  }
});

export const TagRelNotificationItem = ({classes, tagRelId}: {
  classes: ClassesType<typeof styles>,
  tagRelId: string
}) => {
  const { loading, data } = useQuery(TagRelFragmentQuery, {
    variables: { documentId: tagRelId },
  });
  const tagRel = data?.tagRel?.result;

  if (loading) return <Loading/>
  if (!tagRel) {return null;}

  return <div>
    <div className={classes.meta}>New post tagged <em>{tagRel.tag?.name}</em>:</div>
    <div className={classes.title}>{tagRel.post?.title}</div>
  </div>;
}

export default registerComponent('TagRelNotificationItem', TagRelNotificationItem, {styles});



