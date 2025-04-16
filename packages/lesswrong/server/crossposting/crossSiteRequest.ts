import { ZodType, z } from "zod"
import { FMCrosspostRoute } from "@/lib/fmCrosspost/routes"
import { combineUrls } from "@/lib/vulcan-lib/utils.ts";
import { fmCrosspostBaseUrlSetting } from "@/lib/instanceSettings";
import { crosspostUserAgent } from "@/lib/apollo/links";
import { ApiError } from "@/server/fmCrosspost/errors";
import {
  fmCrosspostTimeoutMsSetting,
} from "../fmCrosspost/resolvers";
import { TOS_NOT_ACCEPTED_ERROR, TOS_NOT_ACCEPTED_REMOTE_ERROR } from "@/lib/collections/posts/constants";

export const makeV2CrossSiteRequest = async <
  RequestSchema extends ZodType,
  ResponseSchema extends ZodType,
  RequestData extends z.infer<RequestSchema>,
  ResponseData extends z.infer<ResponseSchema>,
>(
  route: FMCrosspostRoute<RequestSchema, ResponseSchema, RequestData, ResponseData>,
  body: RequestData,
  onErrorMessage: string,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    fmCrosspostTimeoutMsSetting.get(),
  );

  const url = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", route.getPath());

  let result: Response;
  try {
    result = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": crosspostUserAgent,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);

    if (e.name === "AbortError") {
      throw new ApiError(500, "Crosspost request timed out");
    }

    if (e.cause?.code === "ECONNREFUSED" && e.cause?.port === 4000) {
      // We're testing locally, and the x-post server isn't running
      // eslint-disable-next-line no-console
      console.warn("Dev crosspost server is not running");
      return {document: {}};
    } else {
      throw new Error("Failed to make cross-site request", {cause: e});
    }
  }

  clearTimeout(timeoutId);

  const rawBody = await result.json();
  const parsedBody = route.getResponseSchema().safeParse(rawBody);
  if (!parsedBody.success || parsedBody.data.error) {
    // eslint-disable-next-line no-console
    console.error("Cross-site request failed:", rawBody);
    const errorMessage =
      "error" in rawBody && rawBody.error === TOS_NOT_ACCEPTED_ERROR
        ? TOS_NOT_ACCEPTED_REMOTE_ERROR
        : onErrorMessage;
    throw new ApiError(500, errorMessage);
  }
  return parsedBody.data;
}
