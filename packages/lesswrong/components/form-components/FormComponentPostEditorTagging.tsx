import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import toDictionary from '../../lib/utils/toDictionary';
import mapValues from 'lodash/mapValues';
import { forumTypeSetting, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { shouldHideTag } from '../../lib/collections/tags/permissions';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: 8,
    paddingRight: 8,
  },
  header: {
    marginTop: 6,
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
  const { TagsChecklist, TagMultiselect, FooterTagList, Loading } = Components
  const showSubforumSection = forumTypeSetting.get() === "EAForum";
  const currentUser = useCurrentUser();
  
  const { results, loading } = useMulti({
    terms: {
      view: "coreAndSubforumTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
  });

  if (loading) return <Loading/>
  if (!results) return null
  
  const subforumTags = results.filter(tag =>
    tag.isSubforum && !shouldHideTag(currentUser, tag)
  );
  const coreTags = results.filter(tag =>
    (!tag.isSubforum || !showSubforumSection) && tag.core && !shouldHideTag(currentUser, tag)
  );
  
  const selectedTagIds = Object.keys(value||{})
  const selectedSubforumTagIds = showSubforumSection ? selectedTagIds.filter(tagId => subforumTags.find(tag => tag._id === tagId)) : [] // inefficient but we don't expect many subforums
  
  /**
   * post tagRelevance field needs to look like {string: number}
   */
  const updateValuesWithArray = (arrayOfTagIds: string[]) => {
    updateCurrentValues(
      mapValues(
        { tagRelevance: arrayOfTagIds },
        (arrayOfTagIds: string[]) => toDictionary(
          arrayOfTagIds, tagId=>tagId, tagId=>1
        )
      )
    );
  }
  
  const onMultiselectUpdate = (changes: { tagRelevance: string[] }) => {
    updateValuesWithArray([...changes.tagRelevance, ...selectedSubforumTagIds]);
  };
  
  /**
   * When a tag is selected, add both it and its parent to the list of tags.
   */
  const onTagSelected = async (tag: {tagId: string, tagName: string, parentTagId?: string}, existingTagIds: Array<string>) => {
    updateValuesWithArray(
      [
        tag.tagId,
        tag.parentTagId === undefined || existingTagIds.includes(tag.parentTagId) ? undefined : tag.parentTagId,
        ...existingTagIds,
      ].filter((tagId) => tagId) as string[]
    );
  }

  /**
   * When a tag is removed, remove only that tag and not its parent.
   */
  const onTagRemoved = (tag: {tagId: string, tagName: string, parentTagId?: string}, existingTagIds: Array<string>) => {
    updateValuesWithArray(existingTagIds.filter((thisTagId) => thisTagId !== tag.tagId))
  }

  if (!document.draft && formType === "edit") {
    return <FooterTagList
      post={document}
      hideScore
      hidePostTypeTag
      showCoreTags
      link={false}
    />
  } else {
    return (
      <div className={classes.root}>
        {showSubforumSection && (
          <>
            <h3 className={classNames(classes.subforumHeader, classes.header)}>Topics with subforums</h3>
            <p className={classes.subforumExplanation}>
              Your post is more likely to be seen by the right people if you post it in the relevant subforum. Subforums
              are broad topics with a dedicated community and space for general discussion.
            </p>
            <TagsChecklist
              tags={subforumTags}
              selectedTagIds={selectedTagIds}
              onTagSelected={onTagSelected}
              onTagRemoved={onTagRemoved}
              displaySelected={"highlight"}
            />
            <h3 className={classes.header}>Other topics</h3>
          </>
        )}
        <TagsChecklist tags={coreTags} selectedTagIds={selectedTagIds} onTagSelected={onTagSelected} />
        <TagMultiselect
          path={path}
          placeholder={placeholder ?? `+ Add ${taggingNamePluralCapitalSetting.get()}`}
          value={selectedTagIds.filter((tagId) => !selectedSubforumTagIds.includes(tagId))}
          updateCurrentValues={onMultiselectUpdate}
        />
      </div>
    );
  }
}

const FormComponentPostEditorTaggingComponent = registerComponent("FormComponentPostEditorTagging", FormComponentPostEditorTagging, {styles});

declare global {
  interface ComponentTypes {
    FormComponentPostEditorTagging: typeof FormComponentPostEditorTaggingComponent
  }
}


