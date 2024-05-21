import React from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { taggingNameCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { useNavigate } from '../../lib/reactRouterWrapper';

const NewTagPage = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { SingleColumnSection, SectionTitle, WrappedSmartForm } = Components;
  
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
    <SingleColumnSection>
      <SectionTitle title={`New ${taggingNameCapitalSetting.get()}`}/>
      <WrappedSmartForm
        collectionName="Tags"
        mutationFragment={getFragment('TagFragment')}
        successCallback={(tag: any) => {
          navigate({pathname: tagGetUrl(tag)});
        }}
      />
    </SingleColumnSection>
  );
}

const NewTagPageComponent = registerComponent('NewTagPage', NewTagPage);

declare global {
  interface ComponentTypes {
    NewTagPage: typeof NewTagPageComponent
  }
}
