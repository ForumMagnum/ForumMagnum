import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const BooksInner = () => {
  return <Components.CollectionsPage documentId={'nmk3nLpQE89dMRzzN'} />
};

export const Books = registerComponent('Books', BooksInner);

declare global {
  interface ComponentTypes {
    Books: typeof Books
  }
}

