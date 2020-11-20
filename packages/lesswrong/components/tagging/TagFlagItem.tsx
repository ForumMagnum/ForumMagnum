import React from "react"
import { TagFlags } from "../../lib";
import { Tags } from "../../lib/collections/tags/collection";
import { useMulti } from "../../lib/crud/withMulti";
import { useSingle } from "../../lib/crud/withSingle";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from 'classnames';
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import Card from "@material-ui/core/Card";
import { commentBodyStyles } from "../../themes/stylePiping";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 4,
    margin: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    ...commentBodyStyles(theme)
  }
})

const TagFlagItem = ({documentId, showNumber = true, allPages = false, style = "grey", classes }: {
  documentId?: string,
  showNumber?: boolean,
  allPages?: boolean, 
  style?: "white"|"grey"|"black",
  classes: ClassesType,
}) => {
  const { LWPopper, ContentItemBody } = Components;
  const {eventHandlers, hover, anchorEl, stopHover } = useHover();
  const { document: tagFlag } = useSingle({
    documentId,
    collection: TagFlags,
    fetchPolicy: "cache-first",
    fragmentName: "TagFlagFragment",
  })
  const multiTerms = allPages ? {view: "allPagesByNewest"} : { view: "tagsByTagFlag", tagFlagId: tagFlag?._id}
  const { totalCount, loading } = useMulti({
    terms: multiTerms,
    collection: Tags,
    fragmentName: "TagWithFlagsFragment",
    limit: 0,
    skip: !showNumber,
    enableTotal: true
  });
  const rootStyles = classNames(classes.root, {[classes.black]: style === "black", [classes.white]: style === "white"});
  const tagFlagDescription = allPages ? "All Pages" : `tagFlag ${tagFlag?._id}`
  const tagFlagText = allPages ? "All Wiki-Tags" : tagFlag?.name
  const innerHTML = {
    __html: allPages
      ? "All Wiki-Tags sorted by most recently created, including those with no flags set."
      : tagFlag?.contents?.html || "" 
  }
    
  return <span {...eventHandlers} className={rootStyles}>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        onMouseEnter={stopHover}
        placement="bottom-start"
      >
        {(allPages || tagFlag) && <AnalyticsContext pageElementContext="hoverPreview">
          <Card className={classes.hoverCard}>
            <ContentItemBody
              className={classes.highlight}
              dangerouslySetInnerHTML={innerHTML}
              description={tagFlagDescription}
            />
          </Card>
        </AnalyticsContext>}
    </LWPopper>
    {tagFlagText}{(!loading && showNumber)? `: ${totalCount}` : ``}
  </span>
}

const TagFlagItemComponent = registerComponent('TagFlagItem', TagFlagItem, { styles } );

declare global {
  interface ComponentTypes {
    TagFlagItem: typeof TagFlagItemComponent
  }
}
