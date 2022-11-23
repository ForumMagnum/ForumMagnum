import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import toDictionary from '../../lib/utils/toDictionary';
import mapValues from 'lodash/mapValues';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: 8,
    paddingRight: 8,
  },
  subforumHeader: {
    marginBottom: 0,
  },
  subforumExplanation: {
    marginTop: 4,
    fontStyle: "italic",
    color: theme.palette.grey[700],
  }
});

/**
 * Edit tags on the new or edit post form. If it's the new form, use
 * TagMultiSelect; a server-side callback will convert tags to tag-relevances.
 * If it's the edit form, instead use FooterTagList, which has the same
 * voting-on-tag-relevance as the post page. Styling doesn't match between these
 * two, which is moderately unfortunate.
 */
const FormComponentPostEditorTagging = ({value, path, document, formType, updateCurrentValues, placeholder, classes}: {
  value: any,
  path: string,
  document: any,
  label?: string,
  placeholder?: string,
  formType: "edit"|"new",
  updateCurrentValues: any,
  classes: ClassesType,
}) => {
  const { TagsChecklist, TagMultiselect, FooterTagList, LWTooltip } = Components
  
  /**
   * When a tag is selected, add both it and its parent to the list of tags.
   */
  const onTagSelected = (tag: {tagId: string, tagName: string, parentTagId?: string}, existingTagIds: Array<string>) => {
    updateCurrentValues(
      mapValues(
        {
          tagRelevance: [
            tag.tagId,
            tag.parentTagId === undefined || existingTagIds.includes(tag.parentTagId) ? undefined : tag.parentTagId,
            ...existingTagIds,
          ].filter((tagId) => tagId),
        },
        (arrayOfTagIds: string[]) =>
          toDictionary(
            arrayOfTagIds,
            (tagId) => tagId,
            (tagId) => 1
          )
      )
    );
  }

  // What is special about posting into a subforum:
  // Subforums are broad, high level topics with a dedicated community. We ensure that subforums contain relevant posts through active curation.
  // Posting into a subforum targets your post at a more niche audience, who may have more context, enabling you to get more useful feedback and discussion. If you want your post to only appear in the subforum and not on the frontpage you can also uncheck the "Frontpage" checkbox at the bottom of the page.
  if (formType === "edit") {
    return <FooterTagList
      post={document}
      hideScore
      hidePostTypeTag
      showCoreTags
      link={false}
    />
  } else {
    return <div className={classes.root}>
      <h2 className={classes.subforumHeader}>Subforums</h2>
      <p className={classes.subforumExplanation}>Subforums are broad topics with a dedicated community and space for general discussion. We ensure that they contain relevant posts by including posts from sub-topics automatically, and through active curation.</p>
      <TagsChecklist core={undefined} isSubforum={true} existingTagIds={Object.keys(value||{})} onTagSelected={onTagSelected}/>
      <h2>Other topics</h2>
      <TagsChecklist core={true} isSubforum={false} existingTagIds={Object.keys(value||{})} onTagSelected={onTagSelected}/>
      <TagMultiselect
        path={path}
        placeholder={placeholder ?? `+ Add ${taggingNamePluralCapitalSetting.get()}`}
        
        value={Object.keys(value||{})}
        updateCurrentValues={(changes) => {
          // post tagRelevance field needs to look like {string: /
          // number}, so even though it's extra work both here and in 
          // the callback, we need to maintain that structure.
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

const FormComponentPostEditorTaggingComponent = registerComponent("FormComponentPostEditorTagging", FormComponentPostEditorTagging, {styles});

declare global {
  interface ComponentTypes {
    FormComponentPostEditorTagging: typeof FormComponentPostEditorTaggingComponent
  }
}


