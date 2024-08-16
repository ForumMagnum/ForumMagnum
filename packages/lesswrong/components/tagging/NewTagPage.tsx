import React from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { isEAForum, taggingNameCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { useNavigate } from '../../lib/reactRouterWrapper';

export const styles = (_theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  guide: {
    position: "absolute",
    top: -50,
    right: -300,
    "@media (max-width: 1400px)": {
      right: -240,
    },
  },
});

const NewTagPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const {
    SingleColumnSection, SectionTitle, WrappedSmartForm, NewTagInfoBox,
  } = Components;

  if (!currentUser) {
    return (
      <SingleColumnSection>
        <SectionTitle title={`New ${taggingNameCapitalSetting.get()}`}/>
        <div>
          You must be logged in to define new {taggingNamePluralSetting.get()}.
        </div>
      </SingleColumnSection>
    );
  }
  
  if (!tagUserHasSufficientKarma(currentUser, "new")) {
    return (
      <SingleColumnSection>
        <SectionTitle title={`New ${taggingNameCapitalSetting.get()}`}/>
        <div>
          You do not have enough karma to define new {taggingNamePluralSetting.get()}. You must have
          at least {tagMinimumKarmaPermissions.new} karma.
        </div>
      </SingleColumnSection>
    );
  }
  
  return (
    <SingleColumnSection className={classes.root}>
      <SectionTitle title={`New ${taggingNameCapitalSetting.get()}`}/>
      <WrappedSmartForm
        collectionName="Tags"
        mutationFragment={getFragment('TagFragment')}
        successCallback={(tag: any) => {
          navigate({pathname: tagGetUrl(tag)});
        }}
      />
      {isEAForum &&
        <div className={classes.guide}>
          <NewTagInfoBox />
        </div>
      }
    </SingleColumnSection>
  );
}

const NewTagPageComponent = registerComponent('NewTagPage', NewTagPage, {styles});

declare global {
  interface ComponentTypes {
    NewTagPage: typeof NewTagPageComponent
  }
}
