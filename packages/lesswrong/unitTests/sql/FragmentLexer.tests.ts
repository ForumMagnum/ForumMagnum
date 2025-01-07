import FragmentLexer from "@/server/sql/FragmentLexer";

describe("FragmentLexer", () => {
  it("can lex GraphQL fragments", () => {
    const lexer = new FragmentLexer(`
      fragment TestFragment on TestCollection {
        _id
        a # with a comment
        ...SomeOtherFragment
        b {
          c
          yetAnotherFragment
        }
      }
    `);
    expect(lexer.getName()).toBe("TestFragment");
    expect(lexer.getBaseTypeName()).toBe("TestCollection");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("_id");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("a");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("...SomeOtherFragment");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("b {");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("c");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("yetAnotherFragment");
    expect(lexer.isFinished()).toBe(false);
    expect(lexer.next()).toBe("}");
    expect(lexer.isFinished()).toBe(true);
  });
});
