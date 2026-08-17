import { getPangramEvaluationForText } from "@/server/collections/automatedContentEvaluations/helpers";

const PANGRAM_V3_URL = "https://text.api.pangram.com/v3";
const PANGRAM_TASK_URL = "https://text.external-api.pangram.com/task";
const originalPangramApiKey = process.env.PANGRAM_API_KEY;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function pangramResponse(text: string, prediction: "AI" | "AI-Assisted" | "Human" | "Mixed" = "Mixed") {
  return {
    text,
    fraction_human: 0.25,
    fraction_ai: 0.5,
    fraction_ai_assisted: 0.25,
    prediction_short: prediction,
    windows: [{
      text,
      ai_assistance_score: 0.75,
      start_index: 0,
      end_index: text.length,
      label: "AI-Assisted",
      confidence: "High",
      word_count: text.split(/\s+/).length,
    }],
  };
}

function fiftyWordText(): string {
  return Array.from({ length: 50 }, (_, index) => `word${index}`).join(" ");
}

beforeEach(() => {
  process.env.PANGRAM_API_KEY = "test-api-key";
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

afterAll(() => {
  if (originalPangramApiKey === undefined) {
    delete process.env.PANGRAM_API_KEY;
  } else {
    process.env.PANGRAM_API_KEY = originalPangramApiKey;
  }
});

describe("getPangramEvaluationForText", () => {
  it("keeps Pangram 3 on the synchronous endpoint by default", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(pangramResponse("Text returned by Pangram 3")),
    );

    const result = await getPangramEvaluationForText("Text submitted to Pangram 3");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      PANGRAM_V3_URL,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "Text submitted to Pangram 3" }),
      }),
    );
    expect(result.pangramApiVersion).toBe("v3");
    expect(result.analyzedText).toBe("Text returned by Pangram 3");
    expect(result.pangramScore).toBe(0.75);
  });

  it("submits and polls Pangram 4, using its normalized returned text", async () => {
    const submittedText = fiftyWordText();
    const normalizedText = submittedText.replace("word0", "normalized");
    const fetchMock = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ task_id: "task-123" }))
      .mockResolvedValueOnce(jsonResponse({
        stage: "STAGE_SUCCESS",
        ...pangramResponse(normalizedText),
      }));

    const result = await getPangramEvaluationForText(submittedText, "pangram4");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      PANGRAM_TASK_URL,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: submittedText, model: "pangram-4" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${PANGRAM_TASK_URL}/task-123`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.pangramApiVersion).toBe("pangram-4");
    expect(result.analyzedText).toBe(normalizedText);
  });

  it("accepts the documented AI-Assisted prediction", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(pangramResponse("AI-assisted response", "AI-Assisted")),
    );

    const result = await getPangramEvaluationForText("Submitted response");

    expect(result.pangramPrediction).toBe("AI-Assisted");
  });

  it("wraps aborted requests with Pangram request context", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation was aborted", "AbortError"),
    );

    await expect(getPangramEvaluationForText("Submitted response"))
      .rejects.toThrow("Pangram API request failed: The operation was aborted");
  });

  it("surfaces the documented failed-task headline", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ task_id: "task-123" }))
      .mockResolvedValueOnce(jsonResponse({
        stage: "STAGE_FAILED",
        headline: "Input text contains no valid text after preprocessing",
      }));

    await expect(getPangramEvaluationForText(fiftyWordText(), "pangram4"))
      .rejects.toThrow("Input text contains no valid text after preprocessing");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed task responses instead of polling until timeout", async () => {
    jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ task_id: "task-123" }))
      .mockResolvedValueOnce(jsonResponse({ task_id: "task-123" }));

    await expect(getPangramEvaluationForText(fiftyWordText(), "pangram4"))
      .rejects.toThrow("Invalid Pangram task response");
  });

  it("rejects Pangram 4 inputs shorter than its documented minimum", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch");

    await expect(getPangramEvaluationForText("too short", "pangram4"))
      .rejects.toThrow("Pangram 4 requires at least 50 words");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
