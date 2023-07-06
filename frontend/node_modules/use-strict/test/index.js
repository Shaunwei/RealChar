require('../index.js')
var assert = require('assert')
var fs = require('fs')
var n = 0
fs.readdirSync(__dirname).forEach(function (file) {
  if (file === 'index.js' || !file.match(/\.js$/))
    return
  assert.throws(function() {
    require('./' + file)
  })
  console.log('ok %d - %s throws', ++n, file)
})
console.log('0..%d', n)
