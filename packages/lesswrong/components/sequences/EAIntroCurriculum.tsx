import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { CollectionsPage } from "./CollectionsPage";

const EAIntroCurriculumInner = () => {
  return <CollectionsPage documentId={'MobebwWs2o86cS9Rd'} />
};

export const EAIntroCurriculum = registerComponent('EAIntroCurriculum', EAIntroCurriculumInner);

declare global {
  interface ComponentTypes {
    EAIntroCurriculum: typeof EAIntroCurriculum
  }
}

