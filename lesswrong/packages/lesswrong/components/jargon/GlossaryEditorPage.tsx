import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '@/lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { userCanPassivelyGenerateJargonTerms } from '@/lib/betas';
import { useLocation } from '@/lib/routeUtil';
import GlossaryEditForm from "@/components/jargon/GlossaryEditForm";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import PostsTitle from "@/components/posts/PostsTitle";
import LoadMore from "@/components/common/LoadMore";
import { SectionTitle } from "@/components/common/SectionTitle";
import { ContentStyles } from "@/components/common/ContentStyles";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import Row from "@/components/common/Row";
import UsersNameDisplay from "@/components/users/UsersNameDisplay";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle
  },
  glossary: {
    marginTop: 4,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 4,
  },
  post: {
    marginBottom: theme.spacing.unit * 4,
  }
});

export const GlossaryEditorPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const { query } = useLocation();
  const limit = query.limit ? parseInt(query.limit) : 5;
  const showAll = query.all === 'true' && currentUser?.isAdmin;
  const view: PostsViewName = ["new", "top"].includes(query.view ?? '') ? query.view as PostsViewName : 'new'

  const { results: posts = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "top",
      userId: showAll ? undefined : currentUser?._id,
      limit: limit
    },
    itemsPerPage: 50,
    collectionName: "Posts",
    fragmentName: 'PostsEditQueryFragment',
  })
  if (!currentUser) {
    return <SingleColumnSection><ErrorAccessDenied/></SingleColumnSection>;
  }
  if (!userCanPassivelyGenerateJargonTerms(currentUser)) {
    return <SingleColumnSection>
      Currently, the Glossary Editor is only available to users with over 100 karma.
    </SingleColumnSection>;
  }

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Glossary Editor" />
      <ContentStyles contentType="post">
        <><p>Edit the glossary for your posts.</p><br/><br/></>
      </ContentStyles>
      {posts.map(post => <div key={post._id} className={classes.post}>
        <Row justifyContent="space-between">
          <PostsTitle post={post} showIcons={false}/>
          {showAll && <UsersNameDisplay user={post.user}/>}
        </Row>
        <div className={classes.glossary}>
          <GlossaryEditForm document={post} showTitle={false}/>
        </div>
      </div>)}
      {posts.length === 0 && <div>No posts found</div>}
      <LoadMore {...loadMoreProps} />
    </SingleColumnSection>
  </div>;
}

const GlossaryEditorPageComponent = registerComponent('GlossaryEditorPage', GlossaryEditorPage, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditorPage: typeof GlossaryEditorPageComponent
  }
}

export default GlossaryEditorPageComponent;
