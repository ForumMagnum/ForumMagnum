import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const DraftsPage = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components;
  const currentUser = useCurrentUser();
  
  if (!currentUser) {
    return <SingleColumnSection>
      Log in to access drafts.
    </SingleColumnSection>
  }
  
  const draftTerms: PostsViewTerms = {
    view: "drafts",
    userId: currentUser._id,
    limit: 50,
    sortDraftsBy: currentUser?.sortDraftsBy || "modifiedAt"
  };
  
  return <SingleColumnSection>
    <SectionTitle title="My Drafts"/>
    
    <PostsList2 hideAuthor showDraftTag={false} terms={draftTerms}/>
  </SingleColumnSection>
}

const DraftsPageComponent = registerComponent('DraftsPage', DraftsPage);

declare global {
  interface ComponentTypes {
    DraftsPage: typeof DraftsPageComponent
  }
}
