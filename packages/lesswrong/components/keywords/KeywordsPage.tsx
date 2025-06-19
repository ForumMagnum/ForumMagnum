import React, { FormEvent, useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useNavigate } from "@/lib/routeUtil";
import SingleColumnSection from "../common/SingleColumnSection";
import HeadTags from "../common/HeadTags";
import SectionTitle from "../common/SectionTitle";
import EAOnboardingInput from "../ea-forum/onboarding/EAOnboardingInput";

const KeywordsPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const onSubmit = useCallback((ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (keyword) {
      navigate(`/keywords/${keyword}`);
    }
  }, [navigate, keyword]);
  return (
    <SingleColumnSection>
      <HeadTags />
      <SectionTitle title="Keyword alerts" />
      <form onSubmit={onSubmit}>
        <EAOnboardingInput
          value={keyword}
          setValue={setKeyword}
          placeholder="Enter keyword..."
        />
      </form>
    </SingleColumnSection>
  );
}

export default registerComponent("KeywordsPage", KeywordsPage);
