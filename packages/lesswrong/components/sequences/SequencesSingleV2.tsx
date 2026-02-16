"use client";
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import SequencesPageV2 from "./SequencesPageV2";

const SequencesSingleV2 = () => {
  const { params } = useLocation();
  return <SequencesPageV2 documentId={params._id} />
};

export default SequencesSingleV2;
