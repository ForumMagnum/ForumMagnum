## Description of the PR

[Description here]

## Checklist for reviewing Pull Requests:

[ ] Reviewer has pulled branch and tried out functionality
[ ] Reviewer has mentally stepped through the code

*Checks for common errors:*

[ ] All variables are accessed in a null-safe way, or marked as required in the comments or prop-types
[ ] Loading states and exit conditions in methods and components are checked as early as possible and cause an early return
[ ] All calls to `collection.findOne` and `collection.find` or similar calls are prefixed by `await`
