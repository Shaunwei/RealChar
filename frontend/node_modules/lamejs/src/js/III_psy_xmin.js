var Encoder = require('./Encoder.js');
var common = require('./common.js');
var System = common.System;
var VbrMode = common.VbrMode;
var Float = common.Float;
var ShortBlock = common.ShortBlock;
var Util = common.Util;
var Arrays = common.Arrays;
var new_array_n = common.new_array_n;
var new_byte = common.new_byte;
var new_double = common.new_double;
var new_float = common.new_float;
var new_float_n = common.new_float_n;
var new_int = common.new_int;
var new_int_n = common.new_int_n;
var assert = common.assert;

function III_psy_xmin() {
    this.l = new_float(Encoder.SBMAX_l);
    this.s = new_float_n([Encoder.SBMAX_s, 3]);

    var self = this;
    this.assign = function (iii_psy_xmin) {
        System.arraycopy(iii_psy_xmin.l, 0, self.l, 0, Encoder.SBMAX_l);
        for (var i = 0; i < Encoder.SBMAX_s; i++) {
            for (var j = 0; j < 3; j++) {
                self.s[i][j] = iii_psy_xmin.s[i][j];
            }
        }
    }
}

module.exports = III_psy_xmin;
