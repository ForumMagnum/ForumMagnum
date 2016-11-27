const schema = {
  _id: {
    type: String,
    optional: true,
  },
  name: {
    label: 'Name',
    type: String,
    insertableIf: ['default'],
  },
  createdAt: {
    type: Date,
    autoValue: (documentOrModifier) => {
      if (documentOrModifier && !documentOrModifier.$set) return new Date() // if this is an insert, set createdAt to current timestamp  
    }
  },
  year: {
    label: 'Year',
    type: String,
    optional: true,
    insertableIf: ['default'],
  },
  review: {
    label: 'Review',
    type: String,
    insertableIf: ['default'],
  },
  userId: {
    type: String,
    optional: true,
  }
};

export default schema;