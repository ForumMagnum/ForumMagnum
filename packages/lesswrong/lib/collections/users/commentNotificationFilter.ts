import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

const numberVariables = new TupleSet(["commentKarma", "commenterKarma"] as const);
const booleanVariables = new TupleSet([
  "commenterIsFollowed",
  "topLevelOnMyPost",
  "downthreadOnMyPost",
  "replyToMyComment",
] as const);
const comparisonOperators = new TupleSet([">=", "<=", ">", "<", "==", "!="] as const);

type NumberVariable = UnionOf<typeof numberVariables>;
type BooleanVariable = UnionOf<typeof booleanVariables>;
type ComparisonOperator = UnionOf<typeof comparisonOperators>;

export interface CommentNotificationFacts {
  commentKarma: number;
  commenterKarma: number;
  commenterIsFollowed: boolean;
  topLevelOnMyPost: boolean;
  downthreadOnMyPost: boolean;
  replyToMyComment: boolean;
}

export type CommentNotificationFilterNode =
  | { type: "and" | "or"; left: CommentNotificationFilterNode; right: CommentNotificationFilterNode }
  | { type: "not"; operand: CommentNotificationFilterNode }
  | { type: "boolean"; variable: BooleanVariable }
  | { type: "comparison"; variable: NumberVariable; operator: ComparisonOperator; value: number };

export type CommentNotificationFilterParseResult =
  | { valid: true; expression: CommentNotificationFilterNode }
  | { valid: false; error: string };

interface ParseStep {
  node: CommentNotificationFilterNode;
  position: number;
}

// Bounds the parser's recursion depth, since this parses user input on the server
const MAX_FILTER_LENGTH = 500;
const TOKEN_PATTERN = /-?\d+(?:\.\d+)?|[A-Za-z_]\w*|>=|<=|==|!=|>|<|[()]|\S/g;
const NUMBER_PATTERN = /^-?\d/;

const isKeyword = (token: string | undefined, keyword: "and" | "or" | "not") =>
  token?.toLowerCase() === keyword;

function parseComparison(variable: NumberVariable, tokens: string[], position: number): ParseStep {
  const operator = tokens[position];
  const valueToken = tokens[position + 1];
  if (!operator || !comparisonOperators.has(operator)) {
    throw new Error(`${variable} needs a comparison, like ${variable} >= 10`);
  }
  if (!valueToken || !NUMBER_PATTERN.test(valueToken)) {
    throw new Error(`Expected a number after ${variable} ${operator}`);
  }
  return {
    node: { type: "comparison", variable, operator, value: Number(valueToken) },
    position: position + 2,
  };
}

function parsePrimary(tokens: string[], position: number): ParseStep {
  const token = tokens[position];
  if (token === undefined) {
    throw new Error("The expression ended unexpectedly");
  }
  if (token === "(") {
    const inner = parseOr(tokens, position + 1);
    if (tokens[inner.position] !== ")") {
      throw new Error('Missing a closing ")"');
    }
    return { node: inner.node, position: inner.position + 1 };
  }
  if (numberVariables.has(token)) {
    return parseComparison(token, tokens, position + 1);
  }
  if (booleanVariables.has(token)) {
    return { node: { type: "boolean", variable: token }, position: position + 1 };
  }
  const availableNames = [...numberVariables, ...booleanVariables].join(", ");
  throw new Error(`Unexpected "${token}". Available names: ${availableNames}`);
}

function parseNot(tokens: string[], position: number): ParseStep {
  if (!isKeyword(tokens[position], "not")) {
    return parsePrimary(tokens, position);
  }
  const operand = parseNot(tokens, position + 1);
  return { node: { type: "not", operand: operand.node }, position: operand.position };
}

function parseAnd(tokens: string[], position: number): ParseStep {
  let left = parseNot(tokens, position);
  while (isKeyword(tokens[left.position], "and")) {
    const right = parseNot(tokens, left.position + 1);
    left = { node: { type: "and", left: left.node, right: right.node }, position: right.position };
  }
  return left;
}

function parseOr(tokens: string[], position: number): ParseStep {
  let left = parseAnd(tokens, position);
  while (isKeyword(tokens[left.position], "or")) {
    const right = parseAnd(tokens, left.position + 1);
    left = { node: { type: "or", left: left.node, right: right.node }, position: right.position };
  }
  return left;
}

export function parseCommentNotificationFilter(text: string): CommentNotificationFilterParseResult {
  if (text.length > MAX_FILTER_LENGTH) {
    return { valid: false, error: `Expressions can be at most ${MAX_FILTER_LENGTH} characters long` };
  }
  const tokens = text.match(TOKEN_PATTERN) ?? [];
  if (tokens.length === 0) {
    return { valid: false, error: "Enter an expression, like commentKarma >= 10" };
  }
  try {
    const { node, position } = parseOr(tokens, 0);
    if (position < tokens.length) {
      return { valid: false, error: `Expected "and" or "or" before "${tokens[position]}"` };
    }
    return { valid: true, expression: node };
  } catch (e) {
    if (e instanceof Error) {
      return { valid: false, error: e.message };
    }
    throw e;
  }
}

function compare(left: number, operator: ComparisonOperator, right: number): boolean {
  switch (operator) {
    case ">=": return left >= right;
    case "<=": return left <= right;
    case ">": return left > right;
    case "<": return left < right;
    case "==": return left === right;
    case "!=": return left !== right;
  }
}

export function evaluateCommentNotificationFilter(node: CommentNotificationFilterNode, facts: CommentNotificationFacts): boolean {
  switch (node.type) {
    case "and": return evaluateCommentNotificationFilter(node.left, facts) && evaluateCommentNotificationFilter(node.right, facts);
    case "or": return evaluateCommentNotificationFilter(node.left, facts) || evaluateCommentNotificationFilter(node.right, facts);
    case "not": return !evaluateCommentNotificationFilter(node.operand, facts);
    case "boolean": return facts[node.variable];
    case "comparison": return compare(facts[node.variable], node.operator, node.value);
  }
}

export function parseStoredCommentNotificationFilter(text: string): CommentNotificationFilterNode {
  const result = parseCommentNotificationFilter(text);
  if (!result.valid) {
    throw new Error(`Invalid comment notification filter "${text}": ${result.error}`);
  }
  return result.expression;
}
