"use client";
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import LocalGroupPage from "./LocalGroupPage";

const LocalGroupSingle = () => {
  const { params } = useLocation();
  return <LocalGroupPage documentId={params.groupId}/>
}

export default LocalGroupSingle;



