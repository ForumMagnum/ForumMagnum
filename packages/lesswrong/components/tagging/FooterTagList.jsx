import React, { useState }  from 'react';
import { Components, registerComponent, useMulti, getFragment, updateEachQueryResultOfType, handleUpdateMutation } from 'meteor/vulcan:core';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

const styles = theme => ({
  root: {
    marginTop: 16,
    marginBottom: 16,
  },
  addTagButton: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    height: 26,
    textAlign: "center",
    padding: 4
  },
});

const FooterTagList = ({post, classes}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { results, loading } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collection: TagRels,
    queryName: "postFooterTagsQuery",
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
  
  if (loading || !results)
    return <Components.Loading/>;
  
  return <div className={classes.root}>    
    {results.map((result, i) => <span key={result._id}>
      <Components.FooterTag tagRel={result} tag={result.tag}/>
    </span>)}
    <a
      onClick={(ev) => {setAnchorEl(ev.currentTarget); setIsOpen(true)}}
      className={classes.addTagButton}
    >
      {"+ Add Tag"}
      
      <Components.LWPopper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
      >
        <ClickAwayListener
          onClickAway={() => setIsOpen(false)}
        >
          <Paper>
            <Components.AddTag
              post={post}
              onTagSelected={tag => {
                setAnchorEl(null);
                setIsOpen(false);
                mutate({
                  variables: {
                    tagId: tag._id,
                    postId: post._id,
                  },
                });
              }}
            />
          </Paper>
        </ClickAwayListener>
      </Components.LWPopper>
    </a>
  </div>
};

registerComponent("FooterTagList", FooterTagList,
  withStyles(styles, { name: "FooterTagList" })
);
