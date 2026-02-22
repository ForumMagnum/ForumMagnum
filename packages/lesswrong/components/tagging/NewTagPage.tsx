"use client";
import { gql } from "@/lib/generated/gql-codegen";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { slugify } from '@/lib/utils/slugify';
import { useMutation } from "@apollo/client/react";
import { getTagMinimumKarmaPermissions, tagGetUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { taggingNameCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import { useCurrentUser } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import Loading from "../vulcan-core/Loading";
import { TagForm } from './TagForm';
import { useTagBySlug } from './useTag';

const TagEditFragmentUpdateMutation = gql(`
  mutation updateTagNewTagPage($selector: SelectorInput!, $data: UpdateTagDataInput!) {
    updateTag(selector: $selector, data: $data) {
      data {
        ...TagEditFragment
      }
    }
  }
`);

export const styles = defineStyles("NewTagPage", (_theme: ThemeType) => ({
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
}));

const NewTagPage = () => {
  const classes = useStyles(styles);
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
          at least {getTagMinimumKarmaPermissions().new} karma.
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
      {false
      }
    </SingleColumnSection>
  );
}

export default NewTagPage;
