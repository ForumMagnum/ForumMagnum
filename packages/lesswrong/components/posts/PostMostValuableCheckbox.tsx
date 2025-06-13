import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import ForumIcon from "../common/ForumIcon";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";

const UserMostValuablePostInfoMultiQuery = gql(`
  query multiUserMostValuablePostPostMostValuableCheckboxQuery($selector: UserMostValuablePostSelector, $limit: Int, $enableTotal: Boolean) {
    userMostValuablePosts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserMostValuablePostInfo
      }
      totalCount
    }
  }
`);

const UserMostValuablePostInfoUpdateMutation = gql(`
  mutation updateUserMostValuablePostPostMostValuableCheckbox($selector: SelectorInput!, $data: UpdateUserMostValuablePostDataInput!) {
    updateUserMostValuablePost(selector: $selector, data: $data) {
      data {
        ...UserMostValuablePostInfo
      }
    }
  }
`);

const UserMostValuablePostInfoMutation = gql(`
  mutation createUserMostValuablePostPostMostValuableCheckbox($data: CreateUserMostValuablePostDataInput!) {
    createUserMostValuablePost(data: $data) {
      data {
        ...UserMostValuablePostInfo
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.text.alwaysWhite,
    fontSize: 32,
    padding: 6,
    "&:hover": {
      opacity: 0.5,
    },
  },
});

/**
 * This is used by the EA Forum Wrapped page, to let users indicate which posts
 * they found particularly valuable.
 */
export const PostMostValuableCheckbox = ({post, classes}: {
  post: Pick<PostsBase, "_id">,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const { data, loading } = useQuery(UserMostValuablePostInfoMultiQuery, {
    variables: {
      selector: { currentUserPost: { postId: post._id } },
      limit: 1,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.userMostValuablePosts?.results;
  const userVote = results?.length ? results[0] : null
  
  const [createMostValuable, { loading: createMostValuableLoading }] = useMutation(UserMostValuablePostInfoMutation);
  const [setMostValuable, { loading: setMostValuableLoading }] = useMutation(UserMostValuablePostInfoUpdateMutation);
  
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    // This is for the initial state - after that it should be managed by toggleChecked()
    setChecked(!!userVote && !userVote.deleted)
  }, [userVote])
  
  const toggleChecked = () => {
    if (loading || createMostValuableLoading || setMostValuableLoading || !currentUser) return
    
    if (userVote) {
      setChecked(!!userVote.deleted)
      void setMostValuable({
        variables: {
          selector: {
            _id: userVote._id
          },
          data: {
            deleted: !userVote.deleted
          }
        },
        optimisticResponse: {
          updateUserMostValuablePost: {
            __typename: "UserMostValuablePostOutput",
            data: {
              __typename: "UserMostValuablePost",
              ...{
                ...userVote,
                deleted: !userVote.deleted
              }
            }
          }
        }
      })
    } else {
      setChecked(true)
      void createMostValuable({
        variables: {
          data: {
            userId: currentUser._id,
            postId: post._id
          }
        }
      })
    }
  }
  
  if (!currentUser || loading || !results) return null
  
  return <ForumIcon
    onClick={toggleChecked}
    icon={checked ? "Heart" : "HeartOutline"}
    className={classes.root}
  />
}

export default registerComponent('PostMostValuableCheckbox', PostMostValuableCheckbox, {styles});



