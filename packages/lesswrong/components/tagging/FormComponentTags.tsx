import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import PropTypes from 'prop-types';
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagByID = ({tagId, onRemoved}: {
  tagId: string,
  onRemoved: ()=>void,
}) => {
  const {document: tag, loading} = useSingle({
    documentId: tagId,
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
  });
  const {FooterTag, Loading} = Components;
  
  if (tag) {
    return <FooterTag tag={tag} removeButton={true} onRemoved={onRemoved}/>
  } else {
    return <Loading/>
  }
}

// Widget for applying tags to new posts as they're being created, or from the
// edit form.
//
// When creating a new post, this populates `tagRelevance` which is then used
// by callbacks to create some `tagRel` objects. When editing an existing post,
// this forwards to the same tag-voting UI as on the regular post page.
const FormComponentTags = ({ document, path, value, formType, classes }: {
  document: any,
  path: string,
  value: any,
  formType: "new"|"edit",
  classes: ClassesType
}, context) => {
  const { AddTagButton } = Components;
  const isEventForm = document.isEvent;
  
  if (formType !== "new") {
    return <div/>;
  }
  
  const onTagSelected = ({tagId, tagName}: {tagId: string, tagName: string}) => {
    context.updateCurrentValues({
      [path]: {
        ...value,
        [tagId]: 1,
      }
    });
  }
  
  return <div>
    {Object.keys(value||{}).map(tagId =>
      <TagByID
        key={tagId}
        tagId={tagId}
        onRemoved={() => {
          // TODO
          console.log(`You clicked the remove button on tag ${tagId}`);
        }}
      />
    )}
    <AddTagButton onTagSelected={onTagSelected} onlyCoreTags={isEventForm} />
  </div>
}

(FormComponentTags as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

const FormComponentTagsComponent = registerComponent("FormComponentTags", FormComponentTags, {styles});

declare global {
  interface ComponentTypes {
    FormComponentTags: typeof FormComponentTagsComponent
  }
}
