var module = require('module')
module.wrapper[0] += '"use strict";'
Object.freeze(module.wrap)
