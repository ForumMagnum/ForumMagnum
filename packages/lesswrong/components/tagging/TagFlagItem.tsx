import React from "react"
import { useMulti } from "../../lib/crud/withMulti";
import { useSingle } from "../../lib/crud/withSingle";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from 'classnames';
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import Card from "@material-ui/core/Card";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 4,
    margin: 4,
    borderRadius: 5,
    backgroundColor: theme.palette.panelBackground.tenPercent,
    display: 'inline-block'
  },
  black: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  white: {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.4)',
    color: 'rgba(0,0,0,0.6)'
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
  classes: ClassesType,
}) => {
  const { LWPopper, ContentItemBody, ContentStyles } = Components;
  const {eventHandlers, hover, anchorEl } = useHover();
  const currentUser = useCurrentUser();
  const { document: tagFlag } = useSingle({
    documentId,
    collectionName: "TagFlags",
    fetchPolicy: "cache-first",
    fragmentName: "TagFlagFragment",
  })
  
  
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
  
  
  
  const tagFlagDescription = {
    tagFlagId:`tagFlag ${tagFlag?._id}`,
    allPages:"All Pages",
    userPages: "User Wiki-Tags"
  }
  const tagFlagText = {
    tagFlagId: tagFlag?.name,
    allPages: "All Wiki-Tags",
    userPages: "My Wiki-Tags"
  }
  const hoverText = {
    tagFlagId: tagFlag?.contents?.html || "",
    allPages: "All Wiki-Tags sorted by most recently created, including those with no flags set.",
    userPages: "Wiki-Tags you created, including those with no flags set."
  } 
    
  return <span {...eventHandlers} className={rootStyles}>
    <LWPopper
      open={hover}
      anchorEl={anchorEl}
      clickable={false}
      placement="bottom-start"
    >
        {(["allPages", "userPages"].includes(itemType) || tagFlag) && <AnalyticsContext pageElementContext="hoverPreview">
          <Card className={classes.hoverCard}>
            <ContentStyles contentType="comment">
              <ContentItemBody
                className={classes.highlight}
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
