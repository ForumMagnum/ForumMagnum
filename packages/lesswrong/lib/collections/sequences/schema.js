import { Components } from 'meteor/vulcan:core';
import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'

const schema = {

  // default properties

  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: () => {
      return new Date();
    },
  },

  userId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['admin'],
    hidden:  true,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true,
    }
  },

  // Custom Properties

  title: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    order: 10,
    placeholder: "Sequence Title",
    control: 'EditSequenceTitle',
  },

  description: {
    order:20,
    type: Object,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: 'EditorFormComponent',
    blackbox: true,
    placeholder:"Sequence Description (Supports Markdown and LaTeX)"
  },

  descriptionPlaintext: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  htmlDescription: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  commentCount:{
    type: Number,
    optional: true,
    viewableBy: ['guests'],
  },

  baseScore: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  score: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  color: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  chaptersDummy: {
    type: Array,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: 'chapters',
      type: '[Chapter]',
      resolver: (sequence, args, context) => {
        const books = context.Chapters.find({sequenceId: sequence._id}, {fields: context.Users.getViewableFields(context.currentUser, context.Chapters), sort: {number: 1}}).fetch();
        return books;
      }
    }
  },

  'chaptersDummy.$': {
    type: String,
    optional: true,
  },

  //Cloudinary image id for the grid Image

  gridImageId: {
    type: String,
    optional: true,
    order:25,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: "ImageUpload",
    label: "Card Image"
  },

  //Cloudinary image id for the banner image (high resolution)

  bannerImageId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    label: "Banner Image",
    control: "ImageUpload",
  },

  curatedOrder: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  draft: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: "checkbox"
  },

  isDeleted: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
    control: "checkbox"
  },

  algoliaIndexAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
  },

  canonicalCollectionSlug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    hidden: false,
    control: "text",
    order: 30,
    label: "Collection Slug",
    resolveAs: {
      fieldName: 'canonicalCollection',
      addOriginalField: true,
      type: "Collection",
      // TODO: Make sure we run proper access checks on this. Using slugs means it doesn't
      // work out of the box with the id-resolver generators
      resolver: (sequence, args, context) => {
        if (!sequence.canonicalCollectionSlug) return null;
        return context.Collections.findOne({slug: sequence.canonicalCollectionSlug})
      }
    }
  },

  hidden: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment'],
    insertableBy: ['sunshineRegiment']
  }
}


export default schema;
