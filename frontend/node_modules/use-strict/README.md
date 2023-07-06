# use-strict

Makes all modules in Node get loaded in strict mode.

## Usage

```javascript
require('use-strict')
// That's it, now everything is strict forever.
// in other words: FTFY, YOU'RE WELCOME.
```

## Downside

Strict mode in JavaScript is virtually always a great thing.  It
prevents accidental global leakage, turns silent mistakes into errors,
and removes `with` and `arguments.callee` and their sordid
complexities.  It's mostly a Good Thing.

Unfortunately, it also removes octal literals, which is kind of a
bummer.  You can pass octal strings to Node's functions that deal with
file modes, and they'll do the right thing, so it's not completely
horrible.

The implementation works by patching Node's internal `module.wrapper`
array, and then freezing it, so that further modifications are not
possible.

This means that error printouts that occur on the first line of a node
module will be off by a few characters, since Node does a bit of math
to account for its wrapper script, which will now be off by 13
characters.  This is probably not a big problem, and not really worth
working around.

Also, this means that the *current* module will not be affected.  You
should still `"use strict"` in the module that does
`require('use-strict')`.  This module applies strictness to all
*future* modules loaded by your program.

**Note** You can also run `node --use_strict` and get the same effect
without any of the caveats.
