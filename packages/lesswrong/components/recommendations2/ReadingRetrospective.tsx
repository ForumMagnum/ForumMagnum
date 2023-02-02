import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
});

const ReadingRetrospective = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SectionTitle, Loading, WrappedLoginForm } = Components;
  const currentUser = useCurrentUser();
  
  const { results } = useMulti({
    collectionName: "UserPostEngagements",
    terms: {
      view: "readingRetrospective",
      limit: 20,
    },
    itemsPerPage: 20,
    fragmentName: "ReadingRetrospectivePostEngagement",
    skip: !currentUser?._id,
  });
  
  if (!currentUser) {
    return (<WrappedLoginForm />);
  }
  
  return <SingleColumnSection>
    <SectionTitle title="Reading Retrospective"/>
    
    <Loading/>
  </SingleColumnSection>
}

const ReadingRetrospectiveComponent = registerComponent("ReadingRetrospective", ReadingRetrospective, {styles});

declare global {
  interface ComponentTypes {
    ReadingRetrospective: typeof ReadingRetrospectiveComponent
  }
}
