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

var MeanBits = require('./MeanBits.js');
var Encoder = require('./Encoder.js');
var L3Side = require('./L3Side.js');
var LameInternalFlags = require('./LameInternalFlags.js');

function CBRNewIterationLoop(_quantize)  {
    var quantize = _quantize;
    this.quantize = quantize;
	this.iteration_loop = function(gfp, pe, ms_ener_ratio, ratio) {
		var gfc = gfp.internal_flags;
        var l3_xmin = new_float(L3Side.SFBMAX);
		var xrpow = new_float(576);
		var targ_bits = new_int(2);
		var mean_bits = 0, max_bits;
		var l3_side = gfc.l3_side;

		var mb = new MeanBits(mean_bits);
		this.quantize.rv.ResvFrameBegin(gfp, mb);
		mean_bits = mb.bits;

		/* quantize! */
		for (var gr = 0; gr < gfc.mode_gr; gr++) {

			/*
			 * calculate needed bits
			 */
			max_bits = this.quantize.qupvt.on_pe(gfp, pe, targ_bits, mean_bits,
					gr, gr);

			if (gfc.mode_ext == Encoder.MPG_MD_MS_LR) {
				this.quantize.ms_convert(gfc.l3_side, gr);
				this.quantize.qupvt.reduce_side(targ_bits, ms_ener_ratio[gr],
						mean_bits, max_bits);
			}

			for (var ch = 0; ch < gfc.channels_out; ch++) {
				var adjust, masking_lower_db;
				var cod_info = l3_side.tt[gr][ch];

				if (cod_info.block_type != Encoder.SHORT_TYPE) {
					// NORM, START or STOP type
					adjust = 0;
					masking_lower_db = gfc.PSY.mask_adjust - adjust;
				} else {
					adjust = 0;
					masking_lower_db = gfc.PSY.mask_adjust_short - adjust;
				}
				gfc.masking_lower =  Math.pow(10.0,
						masking_lower_db * 0.1);

				/*
				 * init_outer_loop sets up cod_info, scalefac and xrpow
				 */
				this.quantize.init_outer_loop(gfc, cod_info);
				if (this.quantize.init_xrpow(gfc, cod_info, xrpow)) {
					/*
					 * xr contains energy we will have to encode calculate the
					 * masking abilities find some good quantization in
					 * outer_loop
					 */
					this.quantize.qupvt.calc_xmin(gfp, ratio[gr][ch], cod_info,
							l3_xmin);
					this.quantize.outer_loop(gfp, cod_info, l3_xmin, xrpow, ch,
							targ_bits[ch]);
				}

				this.quantize.iteration_finish_one(gfc, gr, ch);
				assert (cod_info.part2_3_length <= LameInternalFlags.MAX_BITS_PER_CHANNEL);
				assert (cod_info.part2_3_length <= targ_bits[ch]);
			} /* for ch */
		} /* for gr */

		this.quantize.rv.ResvFrameEnd(gfc, mean_bits);
	}
}
module.exports = CBRNewIterationLoop;
