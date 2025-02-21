import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const Books = () => {
  return <Components.CollectionsPage documentId={'nmk3nLpQE89dMRzzN'} />
};

const BooksComponent = registerComponent('Books', Books);

declare global {
  interface ComponentTypes {
    Books: typeof BooksComponent
  }
}

