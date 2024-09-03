// TODO: Import component in components.ts
import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import { userCanDo } from '@/lib/vulcan-users';

const styles = (theme: ThemeType) => ({
  root: {

  },
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
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const currentUser = useCurrentUser()

  const { SunshineCuratedSuggestionsList, SingleColumnSection, BasicFormStyles, WrappedSmartForm, SectionTitle, ErrorAccessDenied, CurationNoticesItem, CommentsList } = Components

  const [ post, setPost ] = useState<PostsList|null>(null)

  const { results: curationNotices = [], loading } = useMulti({
    collectionName: 'CurationNotices',
    fragmentName: 'CurationNoticesFragment',
    terms: {
      view: "curationNoticesPage",
      limit: 20
    }
  });
  console.log(curationNotices.map((notice) => ({title: notice.post?.title, commentId: notice.commentId})))

  const curationNoticesList = curationNotices.filter(notice => !notice.comment);
  const curationCommentsList = curationNotices.filter(notice => notice.comment).map(notice => notice.comment!);

  const commentTreeNodes = curationCommentsList.map(comment => ({
    item: comment,
    children: []
  }));

  if (!currentUser || !userCanDo(currentUser, 'curationNotices.edit.all')) {
    return <ErrorAccessDenied/>
  }

  return <div className={classes.root}>

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
              // successCallback={(a) => console.log(a)}
            />
          </BasicFormStyles>
          }
          <h2>Draft Curation Notices</h2>
          {curationNoticesList?.map((curationNotice) => <CurationNoticesItem curationNotice={curationNotice} key={curationNotice._id}/>)}
          <h2>Published Curation Notices</h2>
          <CommentsList
            comments={commentTreeNodes}
            treeOptions={{
              // You can customize these options as needed
              showCollapseButtons: true,
              highlightDate: undefined,
              post: undefined,
              postPage: false,
            }}
          />
        </div>

  </SingleColumnSection>

    {currentUser?.isAdmin && <div className={classes.curated}>
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
