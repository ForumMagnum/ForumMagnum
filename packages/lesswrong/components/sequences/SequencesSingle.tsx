"use client";
import React from 'react';
import SequencesPage from "./SequencesPage";

const SequencesSingle = ({_id}: {_id: string}) => {
  return <SequencesPage documentId={_id} />
};

export default SequencesSingle;
