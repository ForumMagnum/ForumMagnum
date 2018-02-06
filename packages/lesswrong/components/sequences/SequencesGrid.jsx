import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';
import Sequences from '../../lib/collections/sequences/collection.js';

const SequencesGrid = ({sequences, showAuthor, listMode}) =>
  <div className='sequences-grid'>
    <div className="sequences-grid-content">
      {sequences.map(sequence => {
        return (
          <Link key={sequence._id} className="sequences-grid-item-link" to={"/sequences/"+sequence._id}>
            <Components.SequencesGridItem
              sequence={sequence}
              key={sequence._id}
              showAuthor={showAuthor}/>
          </Link>
        );
      })}
    </div>
  </div>

const options = {
  collection: Sequences,
  queryName: 'SequencesGridQuery',
  fragmentName: 'SequencesPageFragment',
  totalResolver: false,
  enableCache: true,
}


registerComponent('SequencesGrid', SequencesGrid, [withList, options]);
