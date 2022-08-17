import { accessFilterMultiple, addFieldsDict, foreignKeyField, resolverOnlyField } from "../../utils/schemaUtils";
import Tags from "./collection";
import { formGroups } from "./formGroups";


addFieldsDict(Tags, {
  parentTagId: {
    ...foreignKeyField({
      idFieldName: "parentTagId",
      resolverName: "parentTag",
      collectionName: "Tags",
      type: "Tag",
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    label: "Parent Tag",
    tooltip: "Parent tag which will also be applied whenever this tag is applied to a post for the first time",
    group: formGroups.advancedOptions,
    control: 'TagSelect',
    onInsert: async (tag) => {
      if (tag.parentTagId) {
        // don't allow chained parent tag relationships
        if ((await Tags.find({parentTagId: tag._id}).count())) {
          throw Error(`Tag ${tag.name} is a parent tag of another tag.`);
        }
      }
      return tag.parentTagId
    },
    onUpdate: async ({data, oldDocument}) => {
      if (data.parentTagId) {
        if (data.parentTagId === oldDocument._id) {
          throw Error(`Can't set self as parent tag.`);
        }
        // don't allow chained parent tag relationships
        if ((await Tags.find({parentTagId: oldDocument._id}).count())) {
          throw Error(`Tag ${oldDocument.name} is a parent tag of another tag.`);
        }
      }
      return data.parentTagId
    },
  },
  subTags: resolverOnlyField({
    type: Array,
    graphQLtype: "[Tag]",
    viewableBy: ['guests'],
    resolver: async (tag, args: void, context: ResolverContext) => {
      const { currentUser, Tags } = context;

      const tags = await Tags.find({
        parentTagId: tag._id
      }, {
        sort: {name: 1}
      }).fetch();
      return await accessFilterMultiple(currentUser, Tags, tags, context);
    }
  }),
  'subTags.$': {
    type: Object,
    foreignKey: 'Tags',
  },
});