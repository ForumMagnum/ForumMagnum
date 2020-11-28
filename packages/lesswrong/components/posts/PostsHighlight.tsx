import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React, {useState, useCallback} from 'react';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...postHighlightStyles(theme),
  },
  highlightContinue: {
    marginTop:theme.spacing.unit*2
  },
  maxHeight: {
    maxHeight: 1000,
  },
})

const PostsHighlight = ({post, maxLengthWords, classes}: {
  post: PostsList,
  maxLengthWords: number,
  classes: ClassesType,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {}
  const [expanded, setExpanded] = useState(false);
  const {document: expandedDocument, loading} = useSingle({
    skip: !expanded,
    documentId: post._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsExpandedHighlight",
  });
  
  const clickExpand = useCallback((ev) => {
    setExpanded(true);
    ev.preventDefault();
  }, []);
  
  return <div className={classNames(classes.root, {[classes.maxHeight]: !expanded})}>
    <Components.LinkPostMessage post={post} />
    <Components.ContentItemTruncated
      maxLengthWords={maxLengthWords}
      graceWords={20}
      rawWordCount={wordCount}
      expanded={expanded}
      getTruncatedSuffix={({wordsLeft}: {wordsLeft:number}) => <div className={classes.highlightContinue}>
        {wordsLeft > 1000
          ? <Link to={postGetPageUrl(post)}>
              (Continue Reading – {wordsLeft} more words)
            </Link>
          : <Link to={postGetPageUrl(post)} onClick={clickExpand}>
              (See More – {wordsLeft} more words)
            </Link>
        }
      </div>}
      dangerouslySetInnerHTML={{__html: expandedDocument?.contents?.html || htmlHighlight}}
      description={`post ${post._id}`}
    />
    {loading && <Components.Loading/>}
  </div>
};

const PostsHighlightComponent = registerComponent('PostsHighlight', PostsHighlight, {styles});

declare global {
  interface ComponentTypes {
    PostsHighlight: typeof PostsHighlightComponent
  }
}

