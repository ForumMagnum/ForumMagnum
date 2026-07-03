import {
  collectAskUserQuestionAnswers,
  extractAskUserQuestion,
  toolResultToolUseId,
} from "../components/research/researchAskUserQuestion";

// Payloads mirror real Claude Code stream-json lines (2.1.198): the tool_use
// arrives as an assistant message content block; the answer comes back as a
// user-role tool_result line with a top-level tool_use_result carrying answers.
const askEvent = {
  kind: "assistant",
  payload: {
    type: "assistant",
    message: {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "toolu_q1",
          name: "AskUserQuestion",
          input: {
            questions: [
              {
                question: "Pick a fruit",
                header: "Fruit",
                multiSelect: false,
                options: [
                  { label: "Apple", description: "A red or green fruit" },
                  { label: "Banana", description: "A yellow fruit" },
                ],
              },
              {
                question: "Pick colors",
                header: "Colors",
                multiSelect: true,
                options: [{ label: "Red" }, { label: "Green" }, { label: "Blue" }],
              },
            ],
          },
        },
      ],
    },
  },
};

const answerEvent = {
  kind: "tool_result",
  payload: {
    type: "user",
    message: {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "toolu_q1",
          content: 'Your questions have been answered: "Pick a fruit"="Apple", "Pick colors"="Red, Green, MyCustomThing".',
        },
      ],
    },
    tool_use_result: {
      answers: { "Pick a fruit": "Apple", "Pick colors": "Red, Green, MyCustomThing" },
    },
  },
};

describe("researchAskUserQuestion", () => {
  it("extracts questions from an AskUserQuestion tool_use event", () => {
    const prompt = extractAskUserQuestion(askEvent);
    expect(prompt).not.toBeNull();
    expect(prompt!.toolUseId).toBe("toolu_q1");
    expect(prompt!.questions.map((q) => q.question)).toEqual(["Pick a fruit", "Pick colors"]);
    expect(prompt!.questions[0].multiSelect).toBe(false);
    expect(prompt!.questions[1].multiSelect).toBe(true);
    expect(prompt!.questions[0].options.map((o) => o.label)).toEqual(["Apple", "Banana"]);
  });

  it("ignores non-AskUserQuestion tool_use events", () => {
    const bash = {
      kind: "assistant",
      payload: { message: { content: [{ type: "tool_use", id: "t", name: "Bash", input: { command: "ls" } }] } },
    };
    expect(extractAskUserQuestion(bash)).toBeNull();
    expect(extractAskUserQuestion({ kind: "assistant", payload: { message: { content: [{ type: "text", text: "hi" }] } } })).toBeNull();
  });

  it("collects answers keyed by tool_use_id", () => {
    const answers = collectAskUserQuestionAnswers([askEvent, answerEvent]);
    expect(answers.get("toolu_q1")).toEqual({
      "Pick a fruit": "Apple",
      "Pick colors": "Red, Green, MyCustomThing",
    });
  });

  it("reads the tool_use_id a tool_result answers", () => {
    expect(toolResultToolUseId(answerEvent)).toBe("toolu_q1");
    expect(toolResultToolUseId(askEvent)).toBeNull();
  });

  it("returns no answers before the question is answered", () => {
    expect(collectAskUserQuestionAnswers([askEvent]).size).toBe(0);
  });
});
