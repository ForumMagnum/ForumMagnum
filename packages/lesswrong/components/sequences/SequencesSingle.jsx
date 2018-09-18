import { Components, registerComponent} from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';
import SequencesPage from './SequencesPage';

const SequencesSingle = (props, context) => {
  return <SequencesPage documentId={props.params._id} />
};

export default defineComponent({
  name: 'SequencesSingle',
  component: SequencesSingle,
  register: false
});
