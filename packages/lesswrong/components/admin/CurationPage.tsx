// TODO: Import component in components.ts
import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';

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

//   const commentQueryResult = useMulti({
//     terms: {view: "curationComments"},
//     collectionName: "Comments",
//     fragmentName: 'CommentsList',
//   });

  const { SunshineCuratedSuggestionsList, SingleColumnSection, BasicFormStyles, WrappedSmartForm, SectionTitle } = Components

  const [ post, setPost ] = useState<PostsList|null>(null)

  return <div className={classes.root}>

  <SingleColumnSection>
    <SectionTitle title={'New Curation Notice'} />
        <div>
          {post &&
          <BasicFormStyles>
            <WrappedSmartForm
              collectionName="CurationNotices"
              mutationFragment={getFragment('CurationNoticesFragment')}
              prefilledProps={{post: post}}
            />
          </BasicFormStyles>
          }
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
