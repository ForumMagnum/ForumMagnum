/**
 * This file is a vendored and edited version of github.com/tjmehta/graphql-date
 * The changes allow us to serialize dates that are returned as strings because
 * they were deep inside a Postgres JSON blob.
 */

import { GraphQLError, GraphQLScalarType, Kind, ValueNode } from "graphql";

const assertErr = <T extends any[]>(
  condition: boolean,
  ErrorConstructor: {new(...args: T): Error},
  ...args: T
) => {
  if (!condition) {
    throw new ErrorConstructor(...args);
  }
}

const GraphQLDate = new GraphQLScalarType({
  name: "Date",

  /**
   * Serialize date value into string
   */
  serialize: (value: Date | string): string => {
    if (typeof value === "string") {
      return value; // Assume the format is valid
    }
    assertErr(
      value instanceof Date,
      TypeError,
      "Field error: value is not an instance of Date",
    );
    assertErr(
      !isNaN(value.getTime()),
      TypeError,
      "Field error: value is an invalid Date",
    );
    return value.toJSON();
  },

  /**
   * Parse value into date
   */
  parseValue: (value: AnyBecauseIsInput): Date => {
    const date = new Date(value);
    assertErr(
      !isNaN(date.getTime()),
      TypeError,
      "Field error: value is an invalid Date",
    );
    return date;
  },

  /**
   * Parse ast literal to date
   */
  parseLiteral: (ast: ValueNode): Date => {
    assertErr(
      ast.kind === Kind.STRING,
      GraphQLError,
      "Query error: Can only parse strings to dates but got a: " + ast.kind,
      [ast],
    );

    const value = (ast as AnyBecauseHard).value;
    const result = new Date(value);
    assertErr(
      !isNaN(result.getTime()),
      GraphQLError,
      "Query error: Invalid date",
      [ast],
    );
    assertErr(
      value === result.toJSON(),
      GraphQLError,
      "Query error: Invalid date format, only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ",
      [ast],
    );

    return result;
  }
});

export default GraphQLDate;
