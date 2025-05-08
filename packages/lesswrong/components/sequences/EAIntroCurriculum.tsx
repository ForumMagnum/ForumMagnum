import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const EAIntroCurriculumInner = () => {
  return <Components.CollectionsPage documentId={'MobebwWs2o86cS9Rd'} />
};

export const EAIntroCurriculum = registerComponent('EAIntroCurriculum', EAIntroCurriculumInner);

declare global {
  interface ComponentTypes {
    EAIntroCurriculum: typeof EAIntroCurriculum
  }
}

