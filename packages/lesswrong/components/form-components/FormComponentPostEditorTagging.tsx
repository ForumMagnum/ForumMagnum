import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import toDictionary from '../../lib/utils/toDictionary';
import mapValues from 'lodash/mapValues';
import { isEAForum, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  header: {
    marginTop: 6,
  },
  coreTagHeader: {
    marginBottom: 10,
  },
});

/**
 * Split a single array of tag ids into separate arrays based on boolean
 * predicates
 */
const splitBy = (
  predicates: ((tagId: string) => boolean)[],
  tagIds: string[],
): string[][] => {
  const result = predicates.map(() => [] as string[]);
  for (const tagId of tagIds) {
    for (let i = 0; i < predicates.length; i++) {
      if (predicates[i](tagId)) {
        result[i].push(tagId);
        break;
      }
    }
  }
  return result;
}

/**
 * Edit tags on the new or edit post form. If it's the new form, use
 * TagMultiSelect; a server-side callback will convert tags to tag-relevances.
 * If it's the edit form, instead use FooterTagList, which has the same
 * voting-on-tag-relevance as the post page. Styling doesn't match between these
 * two, which is moderately unfortunate.
 */
const FormComponentPostEditorTagging = ({value, path, document, formType, updateCurrentValues, placeholder, classes}: FormComponentProps<any> & {
  classes: ClassesType,
}) => {
  const { TagsChecklist, TagMultiselect, FooterTagList, Loading } = Components
  const showCoreAndTypesTopicSections = isEAForum;

  const coreTagResult = useMulti({
    terms: {
      view: "coreTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
    skip: !showCoreAndTypesTopicSections,
  });

  const postTypeResult = useMulti({
    terms: {
      view: "postTypeTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
    skip: !showCoreAndTypesTopicSections,
  });

  const loading = coreTagResult.loading || postTypeResult.loading;

  const coreTags = coreTagResult.results ?? [];
  const postTypeTags = postTypeResult.results ?? [];

  if (loading) {
    return <Loading/>;
  }

  const selectedTagIds = Object.keys(value||{});

  const [
    selectedCoreTagIds,
    selectedPostTypeTagIds,
    selectedOtherTagIds,
  ] = splitBy([
    (tagId: string) => !!coreTags?.find((tag) => tag._id === tagId),
    (tagId: string) => !!postTypeTags?.find((tag) => tag._id === tagId),
    () => true,
  ], selectedTagIds);

  /**
   * post tagRelevance field needs to look like {string: number}
   */
  const updateValuesWithArray = (arrayOfTagIds: string[]) => {
    void updateCurrentValues(
      mapValues(
        { tagRelevance: arrayOfTagIds },
        (arrayOfTagIds: string[]) => toDictionary(
          arrayOfTagIds, tagId=>tagId, tagId=>1
        )
      )
    );
  }

  const onMultiselectUpdate = (changes: { tagRelevance: string[] }) => {
    updateValuesWithArray([
      ...changes.tagRelevance,
      ...selectedCoreTagIds,
      ...selectedPostTypeTagIds,
    ]);
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
        {showCoreAndTypesTopicSections && (
          <>
            <h3 className={classNames(classes.coreTagHeader, classes.header)}>Core topics</h3>
            <TagsChecklist
              tags={coreTags}
              selectedTagIds={selectedTagIds}
              onTagSelected={onTagSelected}
              onTagRemoved={onTagRemoved}
              displaySelected="highlight"
            />
            <h3 className={classNames(classes.coreTagHeader, classes.header)}>Common post types</h3>
            <TagsChecklist
              tags={postTypeTags}
              selectedTagIds={selectedTagIds}
              onTagSelected={onTagSelected}
              onTagRemoved={onTagRemoved}
              displaySelected="highlight"
            />
            <h3 className={classes.header}>Other topics</h3>
          </>
        )}
        <TagMultiselect
          path={path}
          placeholder={placeholder ?? `+ Add ${taggingNamePluralCapitalSetting.get()}`}
          value={selectedOtherTagIds}
          updateCurrentValues={onMultiselectUpdate}
          isVotingContext
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
