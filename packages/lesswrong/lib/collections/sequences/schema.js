import { Components } from 'meteor/vulcan:core';

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
    insertableBy: ['admin'],
    editableBy: ['admin'],
    hidden: false,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (sequence, args, context) => {
        return context.Users.findOne({ _id: sequence.userId }, { fields: context.Users.getViewableFields(context.currentUser, context.Users)})
      },
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
    optional: false,
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
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    label: "Banner Image",
    control: "ImageUpload",
  },

  curated: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: "checkbox"
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
      resolver: (sequence, args, context) => {
        if (!sequence.canonicalCollectionSlug) return null;
        return context.Collections.findOne({slug: sequence.canonicalCollectionSlug})
      }
    }
  }
}


export default schema;
