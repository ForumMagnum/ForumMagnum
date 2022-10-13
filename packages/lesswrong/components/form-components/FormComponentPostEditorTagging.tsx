import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import toDictionary from '../../lib/utils/toDictionary';
import mapValues from 'lodash/mapValues';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';

/**
 * Edit tags on the new or edit post form. If it's the new form, use
 * TagMultiSelect; a server-side callback will convert tags to tag-relevances.
 * If it's the edit form, instead use FooterTagList, which has the same
 * voting-on-tag-relevance as the post page. Styling doesn't match between these
 * two, which is moderately unfortunate.
 */
const FormComponentPostEditorTagging = ({value, path, document, label, placeholder, formType, updateCurrentValues}: {
  value: any,
  path: string,
  document: any,
  label?: string,
  placeholder?: string,
  formType: "edit"|"new",
  updateCurrentValues: any,
}) => {
  const { CoreTagsChecklist, TagMultiselect, FooterTagList } = Components
  if (formType === "edit") {
    return <FooterTagList
      post={document}
      hideScore
      hidePostTypeTag
      showCoreTags
    />
  } else {
    return <div>
      <CoreTagsChecklist existingTagIds={Object.keys(value||{})} onTagSelected={(tag)=> {
        updateCurrentValues(
          mapValues(
            {tagRelevance:[tag.tagId]},
            (arrayOfTagIds: string[]) => toDictionary(
              arrayOfTagIds, tagId=>tagId, tagId=>1
            )
          )
        )
      }}/>
      <TagMultiselect
        path={path}
        placeholder={`+ Add ${taggingNamePluralCapitalSetting.get()}`}
        
        value={Object.keys(value||{})}
        updateCurrentValues={(changes) => {
          updateCurrentValues(
            mapValues(
              changes,
              (arrayOfTagIds: string[]) => toDictionary(
                arrayOfTagIds, tagId=>tagId, tagId=>1
              )
            )
          )
        }}
      />
    </div>
  }
}

const FormComponentPostEditorTaggingComponent = registerComponent("FormComponentPostEditorTagging", FormComponentPostEditorTagging);

declare global {
  interface ComponentTypes {
    FormComponentPostEditorTagging: typeof FormComponentPostEditorTaggingComponent
  }
}


