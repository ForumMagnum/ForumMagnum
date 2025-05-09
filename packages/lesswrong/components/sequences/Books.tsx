import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { CollectionsPage } from "./CollectionsPage";

const BooksInner = () => {
  return <CollectionsPage documentId={'nmk3nLpQE89dMRzzN'} />
};

export const Books = registerComponent('Books', BooksInner);



