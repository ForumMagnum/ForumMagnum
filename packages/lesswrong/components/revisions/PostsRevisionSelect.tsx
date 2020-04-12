import React, { useState, useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import classNames from 'classnames';

const styles = theme => ({
  revisionList: {
  },
  revisionRow: {
  },
  radio: {
    padding: 4,
  },
  radioDisabled: {
    color: "rgba(0,0,0,0) !important",
  },
});

const PostsRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, FormatDate, Loading } = Components;
  const { params } = useLocation();
  const { history } = useNavigation();
  const postId = params._id;
  
  const [beforeRevisionIndex, setBeforeRevisionIndex] = useState(1);
  const [afterRevisionIndex, setAfterRevisionIndex] = useState(0);
  
  const { document: post, loading } = useSingle({
    documentId: postId,
    collection: Posts,
    fragmentName: "PostsDetailsAndRevisionsList",
  });
  
  const compareRevs = useCallback(() => {
    if (!post?.revisions) return;
    const beforeVersion = post.revisions[beforeRevisionIndex].version;
    const afterVersion = post.revisions[afterRevisionIndex].version;
    history.push(`/compare/post/${post._id}/${post.slug}?before=${beforeVersion}&after=${afterVersion}`);
  }, [post, history, beforeRevisionIndex, afterRevisionIndex]);
  
  return <SingleColumnSection>
    {loading && <Loading/>}
    
    <h1>{post && post.title}</h1>
    
    <div className={classes.revisionList}>
      {post?.revisions.map((rev,i) => {
        const beforeDisabled = i<=afterRevisionIndex;
        const afterDisabled = i>=beforeRevisionIndex;
        return (
          <div key={rev.version} className={classes.revisionRow}>
            <Radio
              className={classNames(classes.radio, {[classes.radioDisabled]: beforeDisabled})}
              disabled={beforeDisabled}
              checked={i===beforeRevisionIndex}
              onChange={(ev, checked) => {
                if (checked) {
                  setBeforeRevisionIndex(i);
                }
              }}
            />
            <Radio
              className={classNames(classes.radio, {[classes.radioDisabled]: afterDisabled})}
              disabled={afterDisabled}
              checked={i===afterRevisionIndex}
              onChange={(ev, checked) => {
                if (checked) {
                  setAfterRevisionIndex(i);
                }
              }}
            />
            <Link to={`${Posts.getPageUrl(post)}?revision=${rev.version}`}>
              {rev.version}{" "}
              <FormatDate format={"LLL z"} date={rev.editedAt}/>
            </Link>
          </div>
        )
      })}
    </div>
    
    <Button onClick={compareRevs}>Compare selected revisions</Button>
  </SingleColumnSection>
}

const PostsRevisionSelectComponent = registerComponent("PostsRevisionSelect", PostsRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionSelectComponent: typeof PostsRevisionSelect
  }
}
