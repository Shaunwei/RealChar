var x = 17;
var obj = { x : 100 }
with (obj) // !!! syntax error
{
  // If this weren't strict mode, would this be var x, or
  // would it instead be obj.x?  It's impossible in general
  // to say without running the code, so the name can't be
  // optimized.
  x;
}
