import React, { Ref, useCallback, useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { QuoteLocator } from '@/lib/voting/namesAttachedReactions';
import { Paper } from '@/components/widgets/Paper';
import { PredictionGraph } from '@/components/contents/ElicitBlock';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation } from '@apollo/client/react';
import { ProbabilityGraphIcon } from '@/components/icons/ProbabilityGraphIcon';
import { TooltipRef } from '@/components/common/FMTooltip';
import { useCurrentUser } from '@/components/common/withUser';
import { createInlinePredictionKarmaRequirement } from '@/lib/collections/inlinePredictions/constants';
import classNames from 'classnames';

const styles = defineStyles("AddClaimProbabilityButton", (theme: ThemeType) => ({
  tooltip: {
  },
  icon: {
    fill: theme.palette.greyAlpha(0.7),
    borderRadius: 8,
    "&:hover": {
      background: theme.palette.panelBackground.darken08,
    },
    width: 40,
    height: 40,
    padding: 8,
    cursor: "pointer",
  },
  disabled: {
    opacity: 0.4,
  },
  dialog: {
    padding: 12,
    position: "absolute",
    width: 600,
  },
  dialogText: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.normal,
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
}))

const CreateInlinePredictionMutation = gql(`
  mutation createInlinePrediction($data: CreateInlinePredictionDataInput!) {
    createInlinePrediction(data: $data) {
      ...InlinePredictionsFragment
    }
  }
`);

export const AddClaimProbabilityButton = ({onClick}: {
  onClick: () => void,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const sufficientKarma = currentUser && currentUser.karma >= createInlinePredictionKarmaRequirement;
  const disabled = !currentUser || !sufficientKarma;

  return <TooltipRef
    className={classes.tooltip}
    title={<>
      <p>Click to mark the selected text as a claim and register your probability estimate</p>
      {!currentUser && <p>You must be logged in to do this.</p>}
      {currentUser && !sufficientKarma && <p>You need at least {createInlinePredictionKarmaRequirement} karma to do this.</p>}
    </>}
  >
    {(ref: Ref<HTMLSpanElement>) => <span ref={ref} onMouseDown={!disabled ? onClick : undefined}>
      <InlinePredictionIcon variant="create" disabled={disabled} />
    </span>}
  </TooltipRef>
}

export const InlinePredictionIcon = ({variant, disabled}: {
  variant: "existing"|"create"
  disabled?: boolean
}) => {
  const classes = useStyles(styles);
  return <ProbabilityGraphIcon className={classNames(classes.icon, disabled && classes.disabled)}/>
}

export const AddClaimDialog = ({collectionName, documentId, quote, inlinePredictionOps, onClose}: {
  collectionName: CollectionNameString,
  documentId: string,
  quote: QuoteLocator,
  inlinePredictionOps: InlinePredictionOps,
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const [createInlinePrediction] = useMutation(CreateInlinePredictionMutation);

  async function makePrediction(probability: number|null) {
    if (probability) {
      const { data, error } = await createInlinePrediction({
        variables: {
          data: {
            collectionName, documentId, quote,
            probability,
          },
        },
      });
      const createdPrediction = data?.createInlinePrediction
      if (createdPrediction) {
        inlinePredictionOps.addInlinePrediction(createdPrediction);
      }
      onClose();
    }
  }

  return <Paper className={classes.dialog}>
    <div className={classes.dialogText}>
      Click to mark this as a claim and register a probability
    </div>
    <PredictionGraph
      title={quote}
      loading={false}
      allPredictions={[]}
      makePrediction={makePrediction}
    />
  </Paper>
}

export type InlinePredictionOps = {
  addInlinePrediction: (inlinePrediction: InlinePredictionsFragment) => void,
  removeInlinePrediction: (predictionId: string) => void
};

export const useAddInlinePredictions = () => {
  const [addedInlinePredictions, setAddedInlinePredictions] = useState<InlinePredictionsFragment[]>([]);
  
  const addInlinePrediction = useCallback((inlinePrediction: InlinePredictionsFragment) => {
    setAddedInlinePredictions(prevPredictions => [...prevPredictions, inlinePrediction]);
  }, []);
  const removeInlinePrediction = useCallback((predictionId: string) => {
    setAddedInlinePredictions(prevPredictions => prevPredictions.filter(p =>p._id !== predictionId));
  }, []);
  const inlinePredictionOps = useMemo(() => ({
    addInlinePrediction,
    removeInlinePrediction
  }), [addInlinePrediction, removeInlinePrediction]);
  return {addedInlinePredictions, inlinePredictionOps};
}
