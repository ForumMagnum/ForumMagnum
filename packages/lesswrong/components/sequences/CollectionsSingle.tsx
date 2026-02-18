"use client";
import React from 'react';
import CollectionsPage from "./CollectionsPage";

const CollectionsSingle = ({_id}: {_id: string}) => {
  return <CollectionsPage documentId={_id} />
};

export default CollectionsSingle;
