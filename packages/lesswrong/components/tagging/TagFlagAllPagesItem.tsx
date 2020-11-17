import React from "react"
import { Tags } from "../../lib/collections/tags/collection";
import { useMulti } from "../../lib/crud/withMulti";
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

const TagFlagAllPagesItem = ({ showNumber = true, style = "grey", classes }: {
  showNumber?: boolean,
  style?: "white"|"grey"|"black",
  classes: ClassesType,
}) => {
  const { LWPopper, ContentItemBody } = Components;
  const {eventHandlers, hover, anchorEl, stopHover } = useHover();
  const { totalCount } = useMulti({
    terms: {
      view: "allPagesByNewest",
    },
    collection: Tags,
    fragmentName: "TagWithFlagsFragment",
    limit: 0,
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
      <AnalyticsContext pageElementContext="hoverPreview">
        <Card className={classes.hoverCard}>
          <ContentItemBody
            className={classes.highlight}
            dangerouslySetInnerHTML={{__html: "All Tag and Wiki pages sorted by most recent, regardless of tag flag status" }}
            description={"All Pages"}
          />
        </Card>
      </AnalyticsContext>
    </LWPopper>
    All Tags & Wikis {showNumber ? `: ${totalCount}` : ``}
  </span>
}

const TagFlagAllPagesItemComponent = registerComponent('TagFlagAllPagesItem', TagFlagAllPagesItem, { styles } );

declare global {
  interface ComponentTypes {
    TagFlagAllPagesItem: typeof TagFlagAllPagesItemComponent
  }
}
