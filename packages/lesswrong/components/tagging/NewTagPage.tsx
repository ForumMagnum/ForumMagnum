import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { isEAForum, taggingNameCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { slugify } from '@/lib/utils/slugify';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { useTagBySlug } from './useTag';
import { TagForm } from './TagForm';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import NewTagInfoBox from "./NewTagInfoBox";
import Loading from "../vulcan-core/Loading";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const TagEditFragmentUpdateMutation = gql(`
  mutation updateTagNewTagPage($selector: SelectorInput!, $data: UpdateTagDataInput!) {
    updateTag(selector: $selector, data: $data) {
      data {
        ...TagEditFragment
      }
    }
  }
`);

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
  const [updateTag] = useMutation(TagEditFragmentUpdateMutation);

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
      {!loadingExistingTag && (
        <TagForm
          initialData={existingTag ?? undefined}
          prefilledProps={{
            name: prefillName,
            wikiOnly: (createdType === "wiki"),
          }}
          onSuccess={async (tag) => {
            if (existingTag) {
              await updateTag({
                variables: {
                  selector: { _id: existingTag._id },
                  data: { isPlaceholderPage: false }
                }
              });
            }
            navigate({pathname: tagGetUrl(tag)});
          }}
        />
      )}
      {isEAForum &&
        <div className={classes.guide}>
          <NewTagInfoBox />
        </div>
      }
    </SingleColumnSection>
  );
}

export default registerComponent('NewTagPage', NewTagPage, {styles});


