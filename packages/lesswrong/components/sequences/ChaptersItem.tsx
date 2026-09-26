import React from 'react';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import ChapterTitle from "./ChapterTitle";
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import PostsItem from "../posts/PostsItem";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ChaptersItem', (theme: ThemeType) => ({
  description: {
    marginLeft: 10,
    marginBottom: 24,
    marginTop: 16
  },
  posts: {
      paddingLeft: 8,
      paddingRight: 8
  },
  title: {
    display: "flex",
    justifyContent: "space-between"
  }
}));

const ChaptersItem = ({chapter}: {
  chapter: ChaptersFragment,
}) => {
  const classes = useStyles(styles);
  const html = chapter.contents?.html || ""

  return (
    <div>
      <div className={classes.title}>
        {chapter.title && <ChapterTitle title={chapter.title} large/>}
      </div>
      {html && <ContentStyles contentType="post" className={classes.description}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: html}}
          description={`chapter ${chapter._id}`}
        />
      </ContentStyles>}
      <div className={classes.posts}>
        <AnalyticsContext chapter={chapter._id} capturePostItemOnMount>
          {chapter.posts.map(post => {
            return <div key={chapter._id + post._id}>
              <PostsItem sequenceId={chapter.sequenceId ?? undefined} post={post} showReadCheckbox/>
            </div>
          })}
        </AnalyticsContext>
      </div>
    </div>
  )
}

export default ChaptersItem
