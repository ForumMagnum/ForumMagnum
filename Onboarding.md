# Getting started on LessWrong 2.0

### Understanding the nova package system

### 

### General JS tips

#### Writing "pure" code
* Prefer `_.range(n).forEach(i => my_function())` over `for (var i=0; i<n; i++)...`
* If the body of a for loop performs a stateful action (i.e. modifies a variable outside the scope of the for body), use `forEach`. Else, use `map`. 
* Use underscore.js when possible.
* Prefer `const` over `var` or `let`.

#### Style 

### Troubleshooting 

> My files aren't reloading

Do `rm -rf .meteor/local` and then re-run `meteor`