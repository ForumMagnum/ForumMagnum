"use client";
import React from 'react';
import LocalGroupPage from "./LocalGroupPage";

const LocalGroupSingle = ({groupId}: {groupId: string}) => {
  return <LocalGroupPage documentId={groupId}/>
}

export default LocalGroupSingle;



