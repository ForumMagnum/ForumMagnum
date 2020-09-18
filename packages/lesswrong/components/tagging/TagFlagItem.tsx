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

const styles = theme => ({
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

const TagFlagItem = ({documentId, classes, showNumber = true, style = "grey" }) => {
  const { LWPopper, ContentItemBody } = Components;
  const {eventHandlers, hover, anchorEl, stopHover } = useHover();
  const { document: tagFlag } = useSingle({
    documentId,
    collection: TagFlags,
    fetchPolicy: "cache-first",
    fragmentName: "TagFlagFragment",
  })
  const { totalCount } = useMulti({
    terms: {
      view: "tagsByTagFlag",
      tagFlagId: tagFlag?._id
    },
    collection: Tags,
    fragmentName: "TagWithFlagsFragment",
    limit: 0,
    ssr: true,
    skip: !tagFlag || !showNumber,
    enableTotal: true
  });
  const rootStyles = classNames(classes.root, {[classes.black]: style === "black", [classes.white]: style === "white"});

  return <span {...eventHandlers} className={rootStyles}>
    <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        onMouseEnter={stopHover}
        placement="bottom-start"
      >
        {tagFlag && <AnalyticsContext pageElementContext="hoverPreview">
          <Card className={classes.hoverCard}>
            <ContentItemBody
              className={classes.highlight}
              dangerouslySetInnerHTML={{__html: tagFlag.contents?.html || "" }}
              description={`tagFlag ${tagFlag._id}`}
            />
          </Card>
        </AnalyticsContext>}
    </LWPopper>
    {tagFlag?.name}{showNumber ? `: ${totalCount}` : ``}
  </span>
}

const TagFlagItemComponent = registerComponent('TagFlagItem', TagFlagItem, { styles } );

declare global {
  interface ComponentTypes {
    TagFlagItem: typeof TagFlagItemComponent
  }
}
