import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "@/components/sequences/CollectionsPage";

const Books = () => {
  return <CollectionsPage documentId={'nmk3nLpQE89dMRzzN'} />
};

const BooksComponent = registerComponent('Books', Books);

declare global {
  interface ComponentTypes {
    Books: typeof BooksComponent
  }
}

export default BooksComponent;

