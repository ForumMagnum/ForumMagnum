import { validateCrosspostingKarmaThreshold } from "../../fmCrosspost/helpers";
import { connectCrossposterToken } from "../crosspostingToken";
import { CrosspostingHandler } from "./crosspostingHandler";
import { z } from "zod";

export const crosspostTokenHandler = new CrosspostingHandler({
  routeName: "crosspostToken",
  requestSchema: z.any(),
  responseSchema: z.object({ token: z.string().nonempty() }),
  requestHandler: async (user, _body) => {
    validateCrosspostingKarmaThreshold(user);
    const token = await connectCrossposterToken.create({
      userId: user._id,
    });
    return { token };
  },
});
