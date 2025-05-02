import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { isEAForum, taggingNameCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { useUpdate } from '@/lib/crud/withUpdate';
import { slugify } from '@/lib/utils/slugify';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { useTagBySlug } from './useTag';

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
  const { SingleColumnSection, SectionTitle, WrappedSmartForm, NewTagInfoBox, Loading } = Components;
  const {mutate: updateTag} = useUpdate({
    collectionName: "Tags",
    fragmentName: "TagEditFragment",
  });

  const { query } = useLocation();
  const createdType = ["tag","wiki"].includes(query.type) ? query.type : "tag";
  const prefillName = query.name ?? null;

  const { tag: existingTag, loading: loadingExistingTag } = useTagBySlug(
    slugify(prefillName),
    'TagEditFragment',
    { skip: !prefillName }
  );
  
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
      {loadingExistingTag && <Loading/>}
      
      {existingTag?.isPlaceholderPage &&
        <p>Some pages already link to this page.</p>
      }

      {createdType === "tag"
        ? <SectionTitle title={`New ${taggingNameCapitalSetting.get()}`}/>
        : <SectionTitle title={`New Wiki Page`}/>
      }
      {!loadingExistingTag && <WrappedSmartForm
        collectionName="Tags"
        documentId={existingTag?._id}
        queryFragmentName={'TagEditFragment'}
        mutationFragmentName={'TagWithFlagsFragment'}
        successCallback={async (tag: any) => {
          if (existingTag) {
            await updateTag({
              selector: { _id: existingTag._id },
              data: { isPlaceholderPage: false },
            });
          }
          navigate({pathname: tagGetUrl(tag)});
        }}
        prefilledProps={{
          name: prefillName,
          wikiOnly: (createdType === "wiki"),
          isPlaceholderPage: false,
        }}
      />}
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
