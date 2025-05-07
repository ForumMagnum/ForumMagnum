import React from "react"
import { useMulti } from "../../lib/crud/withMulti";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import classNames from 'classnames';
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import Card from "@/lib/vendor/@material-ui/core/src/Card";
import { useCurrentUser } from "../common/withUser";
import { taggingNameIsSet, taggingNamePluralCapitalSetting } from "../../lib/instanceSettings";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const TagFlagFragmentQuery = gql(`
  query TagFlagItem($documentId: String) {
    tagFlag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagFlagFragment
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 4,
    margin: 4,
    borderRadius: 5,
    backgroundColor: theme.palette.panelBackground.tenPercent,
    display: 'inline-block'
  },
  black: {
    color: theme.palette.text.invertedBackgroundText,
    backgroundColor: theme.palette.greyAlpha(0.8),
  },
  white: {
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.slightlyIntense3,
    color: theme.palette.text.dim60,
  },
  hoverCard: {
    maxWidth: 350,
    padding: theme.spacing.unit,
  }
})

type ItemTypeName = "tagFlagId"|"allPages"|"userPages"

const TagFlagItem = ({documentId, itemType = "tagFlagId", showNumber = true, style = "grey", classes }: {
  documentId?: string,
  itemType?: ItemTypeName,
  showNumber?: boolean,
  style?: "white"|"grey"|"black",
  classes: ClassesType<typeof styles>,
}) => {
  const { LWPopper, ContentItemBody, ContentStyles } = Components;
  const {eventHandlers, hover, anchorEl } = useHover();
  const currentUser = useCurrentUser();
  const { data } = useQuery(TagFlagFragmentQuery, {
    variables: { documentId: documentId },
    fetchPolicy: "cache-first",
  });
  const tagFlag = data?.tagFlag?.result;
  
  
  const TagFlagItemTerms: Record<ItemTypeName,TagsViewTerms> = {
    allPages: {view: "allPagesByNewest"},
    userPages: {view: "userTags", userId: currentUser?._id},
    tagFlagId: {view: "tagsByTagFlag", tagFlagId: tagFlag?._id}
  }
  
  const { totalCount, loading } = useMulti({
    terms: TagFlagItemTerms[itemType],
    collectionName: "Tags",
    fragmentName: "TagWithFlagsFragment",
    limit: 0,
    skip: !showNumber,
    enableTotal: true
  });
  
  const rootStyles = classNames(classes.root, {[classes.black]: style === "black", [classes.white]: style === "white"});
  
  const tagsNameAlt = taggingNameIsSet.get() ? taggingNamePluralCapitalSetting.get() : 'Wiki-Tags'
  
  const tagFlagDescription = {
    tagFlagId:`tagFlag ${tagFlag?._id}`,
    allPages:"All Pages",
    userPages: `User ${tagsNameAlt}`
  }
  const tagFlagText = {
    tagFlagId: tagFlag?.name,
    allPages: `All ${tagsNameAlt}`,
    userPages: `My ${tagsNameAlt}`
  }
  const hoverText = {
    tagFlagId: tagFlag?.contents?.html || "",
    allPages: `All ${tagsNameAlt} sorted by most recently created, including those with no flags set.`,
    userPages: `${tagsNameAlt} you created, including those with no flags set.`
  }
    
  return <span {...eventHandlers} className={rootStyles}>
    <LWPopper
      open={hover}
      anchorEl={anchorEl}
      placement="bottom-start"
    >
        {(["allPages", "userPages"].includes(itemType) || tagFlag) && <AnalyticsContext pageElementContext="hoverPreview">
          <Card className={classes.hoverCard}>
            <ContentStyles contentType="comment">
              <ContentItemBody
                dangerouslySetInnerHTML={{__html: hoverText[itemType]}}
                description={tagFlagDescription[itemType]}
              />
            </ContentStyles>
          </Card>
        </AnalyticsContext>}
    </LWPopper>
    {tagFlagText[itemType]}{(!loading && showNumber)? `: ${totalCount}` : ``}
  </span>
}

const TagFlagItemComponent = registerComponent('TagFlagItem', TagFlagItem, { styles } );

declare global {
  interface ComponentTypes {
    TagFlagItem: typeof TagFlagItemComponent
  }
}
