import qs from "qs";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";
import { useCurrentUser } from "../../common/withUser";
import DropdownItem from "../DropdownItem";

const PostAnalyticsDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  return null;

  const link = `/postAnalytics?${qs.stringify({postId: post._id})}`;
  return (
    <DropdownItem
      title="Analytics"
      to={link}
      icon="Analytics"
    />
  );
}

export default PostAnalyticsDropdownItem;


