/**
 * Util class for lexing GraphQL fragments.
 */
class FragmentLexer {
  private name: string;
  private baseTypeName: string;
  private lines: string[];
  private position = 0;

  constructor(fragmentSrc: string) {
    const match = fragmentSrc.match(/\s*fragment\s+([a-zA-Z0-9-_]+)\s+on\s+([a-zA-Z0-9-_]+)\s*{(.*)}/s);
    if (match?.length !== 4) {
      throw new Error("Cannot parse fragment text");
    }

    this.name = match[1];
    this.baseTypeName = match[2];
    this.lines = match[3].split("\n").map((s) => s.trim()).filter((s) => s);
  }

  /**
   * The name of this fragment (eg; PostsMinimumInfo).
   */
  getName() {
    return this.name;
  }

  /**
   * The GraphQL type that this fragment is defined on (eg; Post).
   */
  getBaseTypeName() {
    return this.baseTypeName;
  }

  /**
   * Get the next line from the input. This is guaranteed to be a non-empty
   * string with all whitespace and comments trimmed from the beginning and end.
   * Returns null when we reach the end of the input text.
   */
  next(): string | null {
    while (this.position < this.lines.length) {
      const line = this.lines[this.position++];
      const trimmedLine = line.match(/\s*([^#]+)(#.*)?/)?.[1]?.trimEnd();
      if (!trimmedLine) {
        continue;
      }
      return trimmedLine;
    }
    return null;
  }

  /**
   * Whether or not the lexer has reached the end of the input text.
   */
  isFinished(): boolean {
    return this.position >= this.lines.length;
  }
}

export default FragmentLexer;
