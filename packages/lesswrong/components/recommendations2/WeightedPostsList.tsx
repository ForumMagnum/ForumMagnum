import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
});

const WeightedPostsList = ({posts, setPosts, classes}: {
  posts: Array<{postId: string, weight: number}>,
  setPosts: (newPosts: Array<{postId: string, weight: number}>)=>void,
  classes: ClassesType,
}) => {
  const {PostsSearchAutoComplete} = Components;
  
  function addPost(postId: string) {
    setPosts([...posts, {postId, weight: 1}]);
  }
  function removePost(postId: string) {
    setPosts(posts.filter(p=>p.postId !== postId));
  }
  function setPostWeight(postId: string, weight: number) {
    setPosts(posts.map(p => p.postId===postId ? {...p, weight} : p));
  }
  
  return <div>
    {posts.map(({postId,weight}) => <WeightedPostsListEditorItem
      key={postId}
      postId={postId}
      remove={()=>removePost(postId)}
      weight={weight}
      setWeight={(newWeight)=>setPostWeight(postId,newWeight)}
    />)}
    
    <PostsSearchAutoComplete clickAction={addPost}/>
  </div>
}

const WeightedPostsListEditorItem = ({postId, remove, weight, setWeight}: {
  postId: string,
  remove: ()=>void,
  weight: number,
  setWeight: (newWeight: number)=>void,
}) => {
  const {document: post, loading} = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsList",
  });
  const {Loading} = Components;
  
  if (loading || !post) {
    return <Loading/>
  }
  
  return <div>
    {post.title}
    <Input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))}/>
    <span onClick={remove}>X</span>
  </div>
}

const WeightedPostsListComponent = registerComponent("WeightedPostsList", WeightedPostsList, {styles});
const WeightedPostsListEditorItemComponent = registerComponent("WeightedPostsListEditorItem", WeightedPostsListEditorItem, {styles});

declare global {
  interface ComponentTypes {
    WeightedPostsList: typeof WeightedPostsListComponent
    WeightedPostsListEditorItem: typeof WeightedPostsListEditorItemComponent
  }
}

