import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { tagPostTerms } from './TagPageUtils';
import { truncate } from '../../lib/editor/ellipsize';
import { useTracking } from "../../lib/analyticsEvents";
import { preferredHeadingCase } from '../../themes/forumTheme';
import UsersName from "@/components/users/UsersName";
import FormatDate from "@/components/common/FormatDate";
import PostsList2 from "@/components/posts/PostsList2";
import ContentItemBody from "@/components/common/ContentItemBody";
import TagDiscussionButton from "@/components/tagging/TagDiscussionButton";
import { ContentStyles } from "@/components/common/ContentStyles";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    padding: 12,
    borderRadius:3,
    marginBottom: 16,
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
  },
  metadata: {
    color: theme.palette.grey[800],
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    marginBottom: 24,
  },
  discussionButtonPositioning: {
    display: "flex",
  }
});

const NewTagItem = ({tag, classes}: {
  tag: TagCreationHistoryFragment,
  classes: ClassesType<typeof styles>,
}) => {
  const tagUrl = tagGetUrl(tag);
  const [truncated, setTruncated] = useState(true);
  const { captureEvent } =  useTracking()
  
  const postSearchTerms = {
    ...tagPostTerms(tag, {}),
    limit: 10
  };

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const readMore = preferredHeadingCase("Read More");
  const suffix = `<span>...<p><a>(${readMore})</a></p></span>`;
  const description = truncated
    ? truncate(tag.description?.html, tag.descriptionTruncationCount || 4, "paragraphs", suffix)
    : tag.description?.html;

  return <div className={classes.root}>
    <Link to={tagUrl} className={classes.title}>
      {tag.name}
    </Link>
    
    <div className={classes.metadata}>
      New {tag.wikiOnly ? "wiki page" : "tag"} created by <UsersName user={tag.user}/>
      {" "}at <FormatDate date={tag.createdAt}/>
    </div>
    
    <div onClick={clickReadMore}>
      <ContentStyles contentType="tag">
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: description||""}}
          description={`tag ${tag.name}`}
        />
      </ContentStyles>
    </div>
    
    {!tag.wikiOnly && <PostsList2
      terms={postSearchTerms}
      enableTotal
      tagId={tag._id}
      itemsPerPage={20}
    />}
    
    <div className={classes.discussionButtonPositioning}>
      <TagDiscussionButton tag={tag} text={`Discuss this ${tag.wikiOnly ? "wiki" : "tag"}`}/>
    </div>
  </div>;
}

const NewTagItemComponent = registerComponent("NewTagItem", NewTagItem, {styles});

declare global {
  interface ComponentTypes {
    NewTagItem: typeof NewTagItemComponent
  }
}

export default NewTagItemComponent;
