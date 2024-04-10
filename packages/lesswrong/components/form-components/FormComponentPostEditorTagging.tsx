import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import toDictionary from '../../lib/utils/toDictionary';
import mapValues from 'lodash/mapValues';
import { isEAForum, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';

const styles = (_theme: ThemeType): JssStyles => ({
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

  const coreTags = useMemo(
    () => coreTagResult.results ?? [],
    [coreTagResult.results],
  );
  const postTypeTags = useMemo(
    () => postTypeResult.results ?? [],
    [postTypeResult.results],
  );

  // Filter out core tags that are also post type tags (only show them as post types)
  const filteredCoreTags = useMemo(() => {
    const postTypeTagIds = new Set(postTypeTags.map(tag => tag._id));
    return coreTags.filter(tag => !postTypeTagIds.has(tag._id));
  }, [coreTags, postTypeTags]);

  const selectedTagIds = Object.keys(value || {});

  const [
    selectedCoreTagIds,
    selectedPostTypeTagIds,
    selectedOtherTagIds,
  ] = splitBy([
    (tagId: string) => !!filteredCoreTags.find((tag) => tag._id === tagId),
    (tagId: string) => !!postTypeTags.find((tag) => tag._id === tagId),
    () => true,
  ], selectedTagIds);

  /**
   * post tagRelevance field needs to look like {string: number}
   */
  const updateValuesWithArray = useCallback((arrayOfTagIds: string[]) => {
    void updateCurrentValues(
      mapValues(
        {tagRelevance: arrayOfTagIds},
        (arrayOfTagIds: string[]) => toDictionary(
          arrayOfTagIds, tagId=>tagId, _tagId=>1
        ),
      ),
    );
  }, [updateCurrentValues]);

  const onMultiselectUpdate = useCallback((changes: {tagRelevance: string[]}) => {
    updateValuesWithArray([
      ...changes.tagRelevance,
      ...selectedCoreTagIds,
      ...selectedPostTypeTagIds,
    ]);
  }, [selectedCoreTagIds, selectedPostTypeTagIds, updateValuesWithArray]);

  /**
   * When a tag is selected, add both it and its parent to the list of tags.
   */
  const onTagSelected = useCallback(async (
    tag: {tagId: string, tagName: string, parentTagId?: string},
    existingTagIds: string[],
  ) => {
    updateValuesWithArray(
      [
        tag.tagId,
        tag.parentTagId === undefined || existingTagIds.includes(tag.parentTagId) ? undefined : tag.parentTagId,
        ...existingTagIds,
      ].filter((tagId) => tagId) as string[],
    );
  }, [updateValuesWithArray]);

  /**
   * When a tag is removed, remove only that tag and not its parent.
   */
  const onTagRemoved = useCallback((
    tag: {tagId: string, tagName: string, parentTagId?: string},
    existingTagIds: string[],
  ) => {
    updateValuesWithArray(existingTagIds.filter((thisTagId) => thisTagId !== tag.tagId))
  }, [updateValuesWithArray]);

  const postCategory = useRef(document.postCategory);

  useEffect(() => {
    if (document.postCategory === postCategory.current) {
      return;
    }
    postCategory.current = document.postCategory;
    const threadsTag = postTypeTags.find((tag) => tag.name === "Threads");
    if (!threadsTag) {
      return;
    }
    const tagValue = {
      tagId: threadsTag._id,
      tagName: threadsTag.name,
      parentTagId: threadsTag.parentTag?._id,
    } as const;
    if (document.postCategory === "question") {
      void onTagSelected(tagValue, selectedTagIds);
    } else {
      void onTagRemoved(tagValue, selectedTagIds);
    }
  }, [document.postCategory, onTagRemoved, onTagSelected, postTypeTags, selectedTagIds]);

  const {TagsChecklist, TagMultiselect, FooterTagList, Loading} = Components;

  if (loading) {
    return <Loading/>;
  }

  if (!document.draft && formType === "edit") {
    return <FooterTagList
      post={document}
      hideScore
      hidePostTypeTag
      showCoreTags
      link={false}
    />
  }

  return (
    <div className={classes.root}>
      {showCoreAndTypesTopicSections && (
        <>
          {!!filteredCoreTags.length &&
            <>
              <h3 className={classNames(classes.coreTagHeader, classes.header)}>Core topics</h3>
              <TagsChecklist
                tags={filteredCoreTags}
                selectedTagIds={selectedTagIds}
                onTagSelected={onTagSelected}
                onTagRemoved={onTagRemoved}
                displaySelected="highlight"
              />
            </>
          }
          {!!postTypeTags.length &&
            <>
              <h3 className={classNames(classes.coreTagHeader, classes.header)}>Common post types</h3>
              <TagsChecklist
                tags={postTypeTags}
                selectedTagIds={selectedTagIds}
                onTagSelected={onTagSelected}
                onTagRemoved={onTagRemoved}
                displaySelected="highlight"
                shortNames
              />
            </>
          }
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

const FormComponentPostEditorTaggingComponent = registerComponent("FormComponentPostEditorTagging", FormComponentPostEditorTagging, {styles});

declare global {
  interface ComponentTypes {
    FormComponentPostEditorTagging: typeof FormComponentPostEditorTaggingComponent
  }
}
