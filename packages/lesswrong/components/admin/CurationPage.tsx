import React, { useState } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import { userCanDo, userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { filterNonnull, filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';
import { unflattenComments } from '@/lib/utils/unflatten';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
  curated: {
    position: "absolute",
    right: 0,
    top: 65,
    width: 210,
    [theme.breakpoints.down('md')]: {
      display: "none"
    }
  }
});

export const CurationPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()

  const { SunshineCuratedSuggestionsList, SingleColumnSection, BasicFormStyles, WrappedSmartForm, SectionTitle, ErrorAccessDenied, CurationNoticesItem, CommentsList } = Components

  const [post, setPost] = useState<PostsList|null>(null)

  const { results: curationNotices = [], loading } = useMulti({
    collectionName: 'CurationNotices',
    fragmentName: 'CurationNoticesFragment',
    terms: {
      view: "curationNoticesPage",
      limit: 20
    }
  });

  const curationNoticesList = curationNotices.filter(notice => !notice.comment);
  const curationCommentsList = filterWhereFieldsNotNull(curationNotices, 'comment', 'post')
  const curationCommentsAndPostsList = curationCommentsList.map(({comment, post}) => ({comment: unflattenComments([comment]), post}));
  
  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return <ErrorAccessDenied/>
  }

  return <div>
    <SingleColumnSection>
      <SectionTitle title={'New Curation Notice'} />
          <div>
            {post &&
              <BasicFormStyles>
                {post.title}
                <WrappedSmartForm
                  collectionName="CurationNotices"
                  mutationFragment={getFragment('CurationNoticesFragment')}
                  prefilledProps={{userId: currentUser._id, postId: post._id}}
                />
              </BasicFormStyles>
            }
            <h2>Draft Curation Notices</h2>
            {curationNoticesList?.map((curationNotice) => <CurationNoticesItem curationNotice={curationNotice} key={curationNotice._id}/>)}
            <h2>Published Curation Notices</h2>
            {curationCommentsAndPostsList.map(({comment, post}) => (
              <CommentsList
                key={comment[0].item._id}
                comments={comment}
                treeOptions={{
                  showCollapseButtons: true,
                  highlightDate: undefined,
                  post,
                  postPage: false,
                }}
              />
            ))}
          </div>
    </SingleColumnSection>
    {<div className={classes.curated}>
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}} belowFold setCurationPost={setPost}/>
    </div>}
  </div>;
}

const CurationPageComponent = registerComponent('CurationPage', CurationPage, {styles});

declare global {
  interface ComponentTypes {
    CurationPage: typeof CurationPageComponent
  }
}
