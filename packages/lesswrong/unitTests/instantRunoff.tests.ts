import { instantRunoffResults, IRVote } from "@/lib/givingSeason/instantRunoff";

describe('instantRunoffResults', () => {
  it('should return the correct winner when there is a clear majority', () => {
    const votes = [
      { 'A': 1, 'B': 2, 'C': 3 },
      { 'A': 1, 'C': 2, 'B': 3 },
      { 'B': 1, 'A': 2, 'C': 3 },
      { 'A': 1, 'B': 2, 'C': 3 }
    ];

    // Expected results after each elimination round:
    // Round 1: {'A': 3, 'B': 1}
    // Round 2: {'A': 4}

    const winners = 1;
    const result = instantRunoffResults({ votes, winners });
    expect(result).toEqual({ 'A': 4 });
  });

  it('should handle tie-breaking in a stable manner', () => {
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2 },
      { 'B': 1, 'A': 2 },
      { 'C': 1, 'A': 2 }
    ];

    // Expected results after each elimination round:
    // Round 1: {'A': 1, 'B': 1, 'C': 1}
    // Round 2: {'B': 2, 'C': 1} ('A' happens to be the one that is randomly eliminated, the point is that this is the same on every run)
    // Round 2: {'B': 2} (the vote for 'C' didn't rank 'B', so 'B' gains no votes here)

    const winners = 1;
    const result = instantRunoffResults({ votes, winners });
    expect(result).toEqual({ 'B': 2 });
  });

  it('should return multiple winners if specified', () => {
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2, 'C': 3 },
      { 'A': 1, 'C': 2, 'B': 3 },
      { 'A': 1, 'C': 2, 'B': 3 },
      { 'B': 1, 'A': 2, 'C': 3 },
      { 'B': 1, 'A': 3, 'C': 2 },
      { 'C': 1, 'A': 2, 'B': 3 },
    ];

    // Expected results after each elimination round:
    // Round 1: {'A': 3, 'B': 2, 'C': 1}
    // Round 2: {'A': 4, 'B': 2}

    const winners = 2;
    const result = instantRunoffResults({ votes, winners });
    expect(result).toEqual({ 'A': 4, 'B': 2 });
  });

  it('should handle no votes', () => {
    const votes: IRVote[] = [];
    const winners = 1;
    const result = instantRunoffResults({ votes, winners });
    expect(result).toEqual({});
  });

  it('should handle empty votes', () => {
    const votes: IRVote[] = [
      {},
      { 'A': 1, 'B': 2 },
      {},
      { 'B': 1, 'A': 2 }
    ];
    const winners = 2;
    const result = instantRunoffResults({ votes, winners });
    expect(result).toEqual({ 'A': 1, 'B': 1 });
  });
});
