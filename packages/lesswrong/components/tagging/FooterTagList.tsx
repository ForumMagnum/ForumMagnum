import React, { useState }  from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { TagRels } from '../../lib/collections/tagRels/collection';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';

const styles = theme => ({
  root: {
    marginTop: 16,
    marginBottom: 16,
  },
  addTagButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    display: "inline-block",
    height: 26,
    textAlign: "center",
    padding: 4
  },
});

const FooterTagList = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAwaiting, setIsAwaiting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);

  const currentUser = useCurrentUser();
  
  const { results, loading, refetch } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collection: TagRels,
    fragmentName: "TagRelMinimumFragment",
    limit: 100,
    ssr: true,
  });
  
  const [mutate] = useMutation(gql`
    mutation addOrUpvoteTag($tagId: String, $postId: String) {
      addOrUpvoteTag(tagId: $tagId, postId: $postId) {
        ...TagRelFragment
      }
    }
    ${getFragment("TagRelFragment")}
  `, {
    update: (store, mutationResult) => {
      updateEachQueryResultOfType({
        func: handleUpdateMutation,
        document: mutationResult.data.addOrUpvoteTag,
        store, typeName: "TagRel",
      });
    }
  });

  const onTagSelected = async (tagId) => {
    setAnchorEl(null);
    setIsOpen(false);
    setIsAwaiting(true)
    await mutate({
      variables: {
        tagId: tagId,
        postId: post._id,
      },
    });
    setIsAwaiting(false)
    refetch()
  }
  
  const { Loading, FooterTag, LWPopper, AddTag } = Components
  if (loading || !results)
    return <Loading/>;
  
  return <div className={classes.root}>
    {results.map((result, i) => {
      // currently only showing the "Coronavirus" tag to most users
      if ((result.tag._id === "tNsqhzTibgGJKPEWB") || userCanManageTags(currentUser)) {
        return <FooterTag key={result._id} tagRel={result} tag={result.tag}/>
      }
    })}
    {userCanManageTags(currentUser) && <a
      onClick={(ev) => {setAnchorEl(ev.currentTarget); setIsOpen(true)}}
      className={classes.addTagButton}
    >
      {"+ Add Tag"}
      
      <LWPopper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={{
          flip: {
            enabled: false
          }
        }}
      >
        <ClickAwayListener
          onClickAway={() => setIsOpen(false)}
        >
          <Paper>
            <AddTag post={post} onTagSelected={onTagSelected} />
          </Paper>
        </ClickAwayListener>
      </LWPopper>
    </a>}
    { isAwaiting && <Loading/>}
  </div>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
