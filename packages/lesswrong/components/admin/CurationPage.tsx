import { filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';
import { unflattenComments } from '@/lib/utils/unflatten';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import React, { useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { CurationNoticesForm } from './CurationNoticesForm';
import SunshineCuratedSuggestionsList from "../sunshineDashboard/SunshineCuratedSuggestionsList";
import SingleColumnSection from "../common/SingleColumnSection";
import BasicFormStyles from "../form-components/BasicFormStyles";
import SectionTitle from "../common/SectionTitle";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import CurationNoticesItem from "./CurationNoticesItem";
import CommentsList from "../comments/CommentsList";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CurationNoticesFragmentMultiQuery = gql(`
  query multiCurationNoticeCurationPageQuery($selector: CurationNoticeSelector, $limit: Int, $enableTotal: Boolean) {
    curationNotices(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CurationNoticesFragment
      }
      totalCount
    }
  }
`);

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
  const [post, setPost] = useState<PostsList|null>(null)

  const { data, loading } = useQuery(CurationNoticesFragmentMultiQuery, {
    variables: {
      selector: { curationNoticesPage: {} },
      limit: 20,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const curationNotices = data?.curationNotices?.results ?? [];

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
                <CurationNoticesForm
                  currentUser={currentUser}
                  postId={post._id}
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
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}} atBottom setCurationPost={setPost}/>
    </div>}
  </div>;
}

export default registerComponent('CurationPage', CurationPage, {styles});


