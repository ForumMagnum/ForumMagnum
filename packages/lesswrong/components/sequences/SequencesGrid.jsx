import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection.js';

const SequencesGrid = ({sequences, showAuthor, listMode}) =>
  <div className='sequences-grid'>
    <div className="sequences-grid-content">
      {sequences.map(sequence => {
        return (
          <Components.SequencesGridItem
            sequence={sequence}
            key={sequence._id}
            showAuthor={showAuthor}/>
        );
      })}
    </div>
  </div>

const options = {
  collection: Sequences,
  queryName: 'SequencesGridQuery',
  fragmentName: 'SequencesPageFragment',
  enableTotal: false,
  enableCache: true,
  ssr: true,
}


registerComponent('SequencesGrid', SequencesGrid, [withList, options]);
