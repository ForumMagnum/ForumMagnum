import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const EAIntroCurriculum = () => {
  return <Components.CollectionsPage documentId={'MobebwWs2o86cS9Rd'} />
};

const EAIntroCurriculumComponent = registerComponent('EAIntroCurriculum', EAIntroCurriculum);

declare global {
  interface ComponentTypes {
    EAIntroCurriculum: typeof EAIntroCurriculumComponent
  }
}

