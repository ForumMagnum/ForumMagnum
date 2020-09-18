import { schemaDefaultValue } from '../../collectionUtils'
import { arrayOfForeignKeysField, denormalizedCountOfReferences, foreignKeyField, SchemaType } from '../../utils/schemaUtils';
import SimpleSchema from 'simpl-schema';
import { Utils } from '../../vulcan-lib';
import { useMulti } from '../../crud/withMulti';

const formGroups = {
  advancedOptions: {
    name: "advancedOptions",
    order: 20,
    label: "Advanced Options",
    startCollapsed: true,
  },
};
  
export const schema: SchemaType<DbTag> = {
  createdAt: {
    optional: true,
    type: Date,
    canRead: ['guests'],
    onInsert: (document, currentUser) => new Date(),
  },
  name: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    order: 1,
  },
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    onInsert: tag => {
      const basicSlug = Utils.slugify(tag.name);
      return Utils.getUnusedSlugByCollectionName('Tags', basicSlug, true);
    },
    onUpdate: async ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug) {
        const slugIsUsed = await Utils.slugIsUsed("Tags", data.slug)
        if (slugIsUsed) {
          throw Error(`Specified slug is already used: ${data.slug}`)
        }
      } else if (data.name && data.name !== oldDocument.name) {
        return Utils.getUnusedSlugByCollectionName("Tags", Utils.slugify(data.name), true, oldDocument._id)
      }
    }
  },
  oldSlugs: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    onUpdate: ({data, oldDocument}) => {
      if ((data.slug && data.slug !== oldDocument.slug) || (data.name && data.name !== oldDocument.name))  {
        return [...(oldDocument.oldSlugs || []), oldDocument.slug]
      } 
    }
  },
  'oldSlugs.$': {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  core: {
    label: "Core Tag (moderators check whether it applies when reviewing new posts)",
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(false),
  },
  suggestedAsFilter: {
    label: "Suggested Filter (appears as a default option in filter settings without having to use the search box)",
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(false),
  },
  defaultOrder: {
    type: Number,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(0),
  },
  descriptionTruncationCount: {
    // number of paragraphs to display above-the-fold
    type: Number,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(0),
  },
  postCount: {
    ...denormalizedCountOfReferences({
      fieldName: "postCount",
      collectionName: "Tags",
      foreignCollectionName: "TagRels",
      foreignTypeName: "TagRel",
      foreignFieldName: "tagId",
      //filterFn: tagRel => tagRel.baseScore > 0, //TODO: Didn't work with filter; votes are bypassing the relevant callback?
    }),
    viewableBy: ['guests'],
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    onCreate: ({currentUser}) => currentUser._id,
    viewableBy: ['guests'],
    optional: true
  },
  adminOnly: {
    label: "Admin Only",
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(false),
  },
  charsAdded: {
    type: Number,
    viewableBy: ['guests'],
  },
  charsRemoved: {
    type: Number,
    viewableBy: ['guests'],
  },
  deleted: {
    type: Boolean,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(false),
  },
  needsReview: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(true)
  },
  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
  // What grade is the current tag? See the wikiGradeDefinitions variable defined below for details.
  wikiGrade: {
    type: SimpleSchema.Integer, 
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    control: 'select',
    ...schemaDefaultValue(2),
    options: () => Object.entries(wikiGradeDefinitions).map(([grade, name]) => ({
      value: parseInt(grade),
      label: name
    })),
    group: formGroups.advancedOptions,
  },

  wikiOnly: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
    group: formGroups.advancedOptions
  },

  tagFlagsIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "tagFlagsIds",
      resolverName: "tagFlags",
      collectionName: "TagFlags",
      type: "TagFlag",
    }),
    control: 'TagFlagToggleList',
    label: "Flags: ",
    optional: true,
    order: 30,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins']
  },
  'tagFlagsIds.$': {
    type: String,
    foreignKey: 'TagFlags',
    optional: true
  },
  // Populated by the LW 1.0 wiki import, with the revision number
  // that has the last full state of the imported post
  lesswrongWikiImportRevision: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  lesswrongWikiImportSlug: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  lesswrongWikiImportCompleted: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests']
  }
}

export const wikiGradeDefinitions = {
  0: "Uncategorized",
  1: "Flagged",
  2: "Stub",
  3: "C-Class",
  4: "B-Class",
  5: "A-Class"
}
