import React, { MouseEvent, useCallback, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../../hooks/useStyles";
import { useTracking } from "@/lib/analyticsEvents";
import { useNotifyMe } from "../../hooks/useNotifyMe";
import ForumIcon from "../../common/ForumIcon";
import Loading from "../../vulcan-core/Loading";

const styles = defineStyles("MarginalFundingSubscribeButton", (theme) => ({
  loading: {
    transform: "translateY(-6px)",
    "& > *": {
      backgroundColor: `${theme.palette.text.alwaysBlack} !important`,
    },
  },
}));

export const MarginalFundingSubscribeButton = ({sequence, className}: {
  sequence: SequencesPageWithChaptersFragment,
  className?: string,
}) => {
  const [subscribing, setSubscribing] = useState(false);
  const {captureEvent} = useTracking()
  const {
    isSubscribed,
    onSubscribe: subscribe,
  } = useNotifyMe({document: sequence});
  const onSubscribe = useCallback(async (ev: MouseEvent<HTMLButtonElement>) => {
    captureEvent("marginalFundingSubscribeClick");
    setSubscribing(true);
    try {
      await subscribe?.(ev);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error subscribing", e);
    } finally {
      setSubscribing(false);
    }
  }, [captureEvent, subscribe]);
  const label = isSubscribed ? "Unsubscribe" : "Subscribe";
  const classes = useStyles(styles);
  return (
    <button type="button" onClick={onSubscribe} className={className} disabled={subscribing || !subscribe}>
      <ForumIcon icon="Envelope" />{" "}
      {subscribing ? <Loading className={classes.loading} /> : label}
    </button>
  );
}

export default registerComponent(
  "MarginalFundingSubscribeButton",
  MarginalFundingSubscribeButton,
);
