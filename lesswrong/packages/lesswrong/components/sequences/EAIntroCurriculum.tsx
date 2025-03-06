import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "@/components/sequences/CollectionsPage";

const EAIntroCurriculum = () => {
  return <CollectionsPage documentId={'MobebwWs2o86cS9Rd'} />
};

const EAIntroCurriculumComponent = registerComponent('EAIntroCurriculum', EAIntroCurriculum);

declare global {
  interface ComponentTypes {
    EAIntroCurriculum: typeof EAIntroCurriculumComponent
  }
}

export default EAIntroCurriculumComponent;

