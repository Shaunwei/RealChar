//package mp3;
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

var L3Side = require('./L3Side.js');

function GrInfo() {
    //float xr[] = new float[576];
    this.xr = new_float(576);
    //int l3_enc[] = new int[576];
    this.l3_enc = new_int(576);
    //int scalefac[] = new int[L3Side.SFBMAX];
    this.scalefac = new_int(L3Side.SFBMAX);
    this.xrpow_max = 0.;

    this.part2_3_length = 0;
    this.big_values = 0;
    this.count1 = 0;
    this.global_gain = 0;
    this.scalefac_compress = 0;
    this.block_type = 0;
    this.mixed_block_flag = 0;
    this.table_select = new_int(3);
    this.subblock_gain = new_int(3 + 1);
    this.region0_count = 0;
    this.region1_count = 0;
    this.preflag = 0;
    this.scalefac_scale = 0;
    this.count1table_select = 0;

    this.part2_length = 0;
    this.sfb_lmax = 0;
    this.sfb_smin = 0;
    this.psy_lmax = 0;
    this.sfbmax = 0;
    this.psymax = 0;
    this.sfbdivide = 0;
    this.width = new_int(L3Side.SFBMAX);
    this.window = new_int(L3Side.SFBMAX);
    this.count1bits = 0;
    /**
     * added for LSF
     */
    this.sfb_partition_table = null;
    this.slen = new_int(4);

    this.max_nonzero_coeff = 0;

    var self = this;
    function clone_int(array) {
        return new Int32Array(array);
    }
    function clone_float(array) {
        return new Float32Array(array);
    }
    this.assign = function (other) {
        self.xr = clone_float(other.xr); //.slice(0); //clone();
        self.l3_enc = clone_int(other.l3_enc); //.slice(0); //clone();
        self.scalefac = clone_int(other.scalefac);//.slice(0); //clone();
        self.xrpow_max = other.xrpow_max;

        self.part2_3_length = other.part2_3_length;
        self.big_values = other.big_values;
        self.count1 = other.count1;
        self.global_gain = other.global_gain;
        self.scalefac_compress = other.scalefac_compress;
        self.block_type = other.block_type;
        self.mixed_block_flag = other.mixed_block_flag;
        self.table_select = clone_int(other.table_select);//.slice(0); //clone();
        self.subblock_gain = clone_int(other.subblock_gain); //.slice(0); //.clone();
        self.region0_count = other.region0_count;
        self.region1_count = other.region1_count;
        self.preflag = other.preflag;
        self.scalefac_scale = other.scalefac_scale;
        self.count1table_select = other.count1table_select;

        self.part2_length = other.part2_length;
        self.sfb_lmax = other.sfb_lmax;
        self.sfb_smin = other.sfb_smin;
        self.psy_lmax = other.psy_lmax;
        self.sfbmax = other.sfbmax;
        self.psymax = other.psymax;
        self.sfbdivide = other.sfbdivide;
        self.width = clone_int(other.width); //.slice(0); //.clone();
        self.window = clone_int(other.window); //.slice(0); //.clone();
        self.count1bits = other.count1bits;

        self.sfb_partition_table = other.sfb_partition_table.slice(0); //.clone();
        self.slen = clone_int(other.slen); //.slice(0); //.clone();
        self.max_nonzero_coeff = other.max_nonzero_coeff;
    }
}

module.exports = GrInfo;
