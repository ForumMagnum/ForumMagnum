"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useCurrentUser } from '../common/withUser';
import { useNavigate } from '../../lib/routeUtil';
import Loading from "../vulcan-core/Loading";
import { NEW_SEQUENCE_TITLE } from "../sequenceEditor/SequenceEditHeader";

const CreateSequenceMutation = gql(`
  mutation createSequenceSequencesNewForm($data: CreateSequenceDataInput!) {
    createSequence(data: $data) {
      data {
        _id
      }
    }
  }
`);

/**
 * Creates a draft sequence and opens it in the sequence editor, the way
 * /newPost does for posts. The editor saves changes as they're made, so the
 * sequence has to exist before anything can be added to it.
 */
const SequencesNewForm = () => {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [createSequence] = useMutation(CreateSequenceMutation);
  const [error, setError] = useState<string | null>(null);
  const attemptedToCreateRef = useRef(false);

  useEffect(() => {
    if (!currentUser || attemptedToCreateRef.current) return;
    attemptedToCreateRef.current = true;
    void (async () => {
      try {
        const { data } = await createSequence({
          variables: { data: { title: NEW_SEQUENCE_TITLE, draft: true } },
        });
        const sequenceId = data?.createSequence?.data?._id;
        if (!sequenceId) throw new Error("Couldn't create the sequence");
        navigate(`/s/${sequenceId}?edit=true`, { replace: true });
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [currentUser, createSequence, navigate]);

  if (!currentUser) {
    return <h3>You must be logged in to create a new sequence.</h3>;
  }
  if (error) {
    return <h3>{error}</h3>;
  }
  return <Loading />;
}

export default SequencesNewForm;
