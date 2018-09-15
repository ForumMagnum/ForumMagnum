import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection.js';
import defineComponent from '../../lib/defineComponent';

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
  totalResolver: false,
  enableCache: true,
}


export default defineComponent({
  name: 'SequencesGrid',
  component: SequencesGrid,
  hocs: [ [withList, options] ]
});
