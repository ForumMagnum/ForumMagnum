import { addCallback } from 'meteor/vulcan:core';
import { Tags, tagDescriptionEditableOptions } from '../../lib/collections/tags/collection.js';
import { addEditableCallbacks } from '../editor/make_editable_callbacks.js'

function isValidTagName(name) {
  // Name must be nonempty and use only a restricted set of characters
  if (!/^#?[a-zA-Z0-9-]+$/.test(name))
    return false;
  
  return true;
}

function normalizeTagName(name) {
  // If the name starts with a hash, strip it off
  if (name.startsWith("#"))
    return name.substr(1);
  else
    return name;
}

addCallback("tags.create.validate", ({ document: tag }) => {
  console.log(`Validating tag ${tag.name}`);
  if (!isValidTagName(tag.name))
    throw new Error("Invalid tag name (use only letters, digits and dash)");
  
  // If the name starts with a hash, strip it off
  const normalizedName = normalizeTagName(tag.name);
  if (tag.name !== normalizedName) {
    tag = {
      ...tag,
      name: normalizedName,
    };
  }
  
  // Name must be unique
  const existing = Tags.find({name: normalizedName, deleted:false}).fetch();
  if (existing.length > 0)
    throw new Error("A tag by that name already exists");
  
  return tag;
});

addCallback("tags.update.validate", ({ oldDocument, newDocument }) => {
  const newName = normalizeTagName(newDocument.name);
  if (oldDocument.name !== newName) { // Tag renamed?
    if (!isValidTagName(newDocument.name))
      throw new Error("Invalid tag name (use only letters, digits and dash)");
    
    const existing = Tags.find({name: newName, deleted:false}).fetch();
    if (existing.length > 0)
      throw new Error("A tag by that name already exists");
  }
  
  if (newDocument.name !== newName) {
    newDocument = {
      ...newDocument, name: newName
    }
  }
  
  return newDocument;
});

addEditableCallbacks({
  collection: Tags,
  options: tagDescriptionEditableOptions,
});
