import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { SunshineNewUserPostItem } from "./SunshineNewUserPostItem";

const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    marginTop: 12,
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  },
  vote: {
    marginRight: 10
  },
  rejectButton: {
    marginLeft: 'auto',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: "8px",
    backgroundColor: theme.palette.grey[200],
    padding: 10,
    marginTop: 8,
    borderRadius: 4,
  },
  llmScore: {
    cursor: 'pointer',
  },
  automatedContentEvaluations: {
    display: 'flex',
    marginTop: 8,
    gap: "8px",
    alignItems: 'center',
  },
  aiOutput: {
    fontSize: '0.9em',
    textWrap: 'pretty',
  },
  expandCollapseButton: {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 8,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
  rejection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: theme.palette.grey[200],
  },
})


const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  // Calculate newPosts early for rendering
  const newPosts = React.useMemo(() => {
    if (!posts) return [];
    return user.reviewedAt ? posts.filter(post => post.postedAt > user.reviewedAt!) : posts;
  }, [posts, user.reviewedAt]);

  if (!posts) return null;

  return (
    <div>
      {newPosts.map(post => <SunshineNewUserPostItem key={post._id} post={post} />)}
    </div>
  )
}

export default registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});


