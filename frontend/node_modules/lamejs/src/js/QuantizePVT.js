/*
 *      quantize_pvt source file
 *
 *      Copyright (c) 1999-2002 Takehiro Tominaga
 *      Copyright (c) 2000-2002 Robert Hegemann
 *      Copyright (c) 2001 Naoki Shibata
 *      Copyright (c) 2002-2005 Gabriel Bouvigne
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */

/* $Id: QuantizePVT.java,v 1.24 2011/05/24 20:48:06 kenchis Exp $ */
var ScaleFac = require('./ScaleFac.js');
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

var Encoder = require('./Encoder.js');
var MeanBits = require('./MeanBits.js');
var LameInternalFlags = require('./LameInternalFlags.js');

QuantizePVT.Q_MAX = (256 + 1);
QuantizePVT.Q_MAX2 = 116;
QuantizePVT.LARGE_BITS = 100000;
QuantizePVT.IXMAX_VAL = 8206;

function QuantizePVT() {

    var tak = null;
    var rv = null;
    var psy = null;

    this.setModules = function (_tk, _rv, _psy) {
        tak = _tk;
        rv = _rv;
        psy = _psy;
    };

    function POW20(x) {
        assert(0 <= (x + QuantizePVT.Q_MAX2) && x < QuantizePVT.Q_MAX);
        return pow20[x + QuantizePVT.Q_MAX2];
    }

    this.IPOW20 = function (x) {
        assert(0 <= x && x < QuantizePVT.Q_MAX);
        return ipow20[x];
    }

    /**
     * smallest such that 1.0+DBL_EPSILON != 1.0
     */
    var DBL_EPSILON = 2.2204460492503131e-016;

    /**
     * ix always <= 8191+15. see count_bits()
     */
    var IXMAX_VAL = QuantizePVT.IXMAX_VAL;

    var PRECALC_SIZE = (IXMAX_VAL + 2);

    var Q_MAX = QuantizePVT.Q_MAX;


    /**
     * <CODE>
     * minimum possible number of
     * -cod_info.global_gain + ((scalefac[] + (cod_info.preflag ? pretab[sfb] : 0))
     * << (cod_info.scalefac_scale + 1)) + cod_info.subblock_gain[cod_info.window[sfb]] * 8;
     *
     * for long block, 0+((15+3)<<2) = 18*4 = 72
     * for short block, 0+(15<<2)+7*8 = 15*4+56 = 116
     * </CODE>
     */
    var Q_MAX2 = QuantizePVT.Q_MAX2;

    var LARGE_BITS = QuantizePVT.LARGE_BITS;


    /**
     * Assuming dynamic range=96dB, this value should be 92
     */
    var NSATHSCALE = 100;

    /**
     * The following table is used to implement the scalefactor partitioning for
     * MPEG2 as described in section 2.4.3.2 of the IS. The indexing corresponds
     * to the way the tables are presented in the IS:
     *
     * [table_number][row_in_table][column of nr_of_sfb]
     */
    this.nr_of_sfb_block = [
        [[6, 5, 5, 5], [9, 9, 9, 9], [6, 9, 9, 9]],
        [[6, 5, 7, 3], [9, 9, 12, 6], [6, 9, 12, 6]],
        [[11, 10, 0, 0], [18, 18, 0, 0], [15, 18, 0, 0]],
        [[7, 7, 7, 0], [12, 12, 12, 0], [6, 15, 12, 0]],
        [[6, 6, 6, 3], [12, 9, 9, 6], [6, 12, 9, 6]],
        [[8, 8, 5, 0], [15, 12, 9, 0], [6, 18, 9, 0]]];

    /**
     * Table B.6: layer3 preemphasis
     */
    var pretab = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        2, 2, 3, 3, 3, 2, 0];
    this.pretab = pretab;

    /**
     * Here are MPEG1 Table B.8 and MPEG2 Table B.1 -- Layer III scalefactor
     * bands. <BR>
     * Index into this using a method such as:<BR>
     * idx = fr_ps.header.sampling_frequency + (fr_ps.header.version * 3)
     */
    this.sfBandIndex = [
        // Table B.2.b: 22.05 kHz
        new ScaleFac([0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464,
                522, 576],
            [0, 4, 8, 12, 18, 24, 32, 42, 56, 74, 100, 132, 174, 192]
            , [0, 0, 0, 0, 0, 0, 0] //  sfb21 pseudo sub bands
            , [0, 0, 0, 0, 0, 0, 0] //  sfb12 pseudo sub bands
        ),
        /* Table B.2.c: 24 kHz */ /* docs: 332. mpg123(broken): 330 */
        new ScaleFac([0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 114, 136, 162, 194, 232, 278, 332, 394, 464,
                540, 576],
            [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 136, 180, 192]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* Table B.2.a: 16 kHz */
        new ScaleFac([0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464,
                522, 576],
            [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 134, 174, 192]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* Table B.8.b: 44.1 kHz */
        new ScaleFac([0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 52, 62, 74, 90, 110, 134, 162, 196, 238, 288, 342, 418,
                576],
            [0, 4, 8, 12, 16, 22, 30, 40, 52, 66, 84, 106, 136, 192]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* Table B.8.c: 48 kHz */
        new ScaleFac([0, 4, 8, 12, 16, 20, 24, 30, 36, 42, 50, 60, 72, 88, 106, 128, 156, 190, 230, 276, 330, 384,
                576],
            [0, 4, 8, 12, 16, 22, 28, 38, 50, 64, 80, 100, 126, 192]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* Table B.8.a: 32 kHz */
        new ScaleFac([0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 54, 66, 82, 102, 126, 156, 194, 240, 296, 364, 448, 550,
                576],
            [0, 4, 8, 12, 16, 22, 30, 42, 58, 78, 104, 138, 180, 192]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* MPEG-2.5 11.025 kHz */
        new ScaleFac([0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464,
                522, 576],
            [0 / 3, 12 / 3, 24 / 3, 36 / 3, 54 / 3, 78 / 3, 108 / 3, 144 / 3, 186 / 3, 240 / 3, 312 / 3,
                402 / 3, 522 / 3, 576 / 3]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* MPEG-2.5 12 kHz */
        new ScaleFac([0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464,
                522, 576],
            [0 / 3, 12 / 3, 24 / 3, 36 / 3, 54 / 3, 78 / 3, 108 / 3, 144 / 3, 186 / 3, 240 / 3, 312 / 3,
                402 / 3, 522 / 3, 576 / 3]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        ),
        /* MPEG-2.5 8 kHz */
        new ScaleFac([0, 12, 24, 36, 48, 60, 72, 88, 108, 132, 160, 192, 232, 280, 336, 400, 476, 566, 568, 570,
                572, 574, 576],
            [0 / 3, 24 / 3, 48 / 3, 72 / 3, 108 / 3, 156 / 3, 216 / 3, 288 / 3, 372 / 3, 480 / 3, 486 / 3,
                492 / 3, 498 / 3, 576 / 3]
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb21 pseudo sub bands */
            , [0, 0, 0, 0, 0, 0, 0] /*  sfb12 pseudo sub bands */
        )
    ];

    var pow20 = new_float(Q_MAX + Q_MAX2 + 1);
    var ipow20 = new_float(Q_MAX);
    var pow43 = new_float(PRECALC_SIZE);

    var adj43 = new_float(PRECALC_SIZE);
    this.adj43 = adj43;

    /**
     * <PRE>
     * compute the ATH for each scalefactor band cd range: 0..96db
     *
     * Input: 3.3kHz signal 32767 amplitude (3.3kHz is where ATH is smallest =
     * -5db) longblocks: sfb=12 en0/bw=-11db max_en0 = 1.3db shortblocks: sfb=5
     * -9db 0db
     *
     * Input: 1 1 1 1 1 1 1 -1 -1 -1 -1 -1 -1 -1 (repeated) longblocks: amp=1
     * sfb=12 en0/bw=-103 db max_en0 = -92db amp=32767 sfb=12 -12 db -1.4db
     *
     * Input: 1 1 1 1 1 1 1 -1 -1 -1 -1 -1 -1 -1 (repeated) shortblocks: amp=1
     * sfb=5 en0/bw= -99 -86 amp=32767 sfb=5 -9 db 4db
     *
     *
     * MAX energy of largest wave at 3.3kHz = 1db AVE energy of largest wave at
     * 3.3kHz = -11db Let's take AVE: -11db = maximum signal in sfb=12. Dynamic
     * range of CD: 96db. Therefor energy of smallest audible wave in sfb=12 =
     * -11 - 96 = -107db = ATH at 3.3kHz.
     *
     * ATH formula for this wave: -5db. To adjust to LAME scaling, we need ATH =
     * ATH_formula - 103 (db) ATH = ATH * 2.5e-10 (ener)
     * </PRE>
     */
    function ATHmdct(gfp, f) {
        var ath = psy.ATHformula(f, gfp);

        ath -= NSATHSCALE;

        /* modify the MDCT scaling for the ATH and convert to energy */
        ath = Math.pow(10.0, ath / 10.0 + gfp.ATHlower);
        return ath;
    }

    function compute_ath(gfp) {
        var ATH_l = gfp.internal_flags.ATH.l;
        var ATH_psfb21 = gfp.internal_flags.ATH.psfb21;
        var ATH_s = gfp.internal_flags.ATH.s;
        var ATH_psfb12 = gfp.internal_flags.ATH.psfb12;
        var gfc = gfp.internal_flags;
        var samp_freq = gfp.out_samplerate;

        for (var sfb = 0; sfb < Encoder.SBMAX_l; sfb++) {
            var start = gfc.scalefac_band.l[sfb];
            var end = gfc.scalefac_band.l[sfb + 1];
            ATH_l[sfb] = Float.MAX_VALUE;
            for (var i = start; i < end; i++) {
                var freq = i * samp_freq / (2 * 576);
                var ATH_f = ATHmdct(gfp, freq);
                /* freq in kHz */
                ATH_l[sfb] = Math.min(ATH_l[sfb], ATH_f);
            }
        }

        for (var sfb = 0; sfb < Encoder.PSFB21; sfb++) {
            var start = gfc.scalefac_band.psfb21[sfb];
            var end = gfc.scalefac_band.psfb21[sfb + 1];
            ATH_psfb21[sfb] = Float.MAX_VALUE;
            for (var i = start; i < end; i++) {
                var freq = i * samp_freq / (2 * 576);
                var ATH_f = ATHmdct(gfp, freq);
                /* freq in kHz */
                ATH_psfb21[sfb] = Math.min(ATH_psfb21[sfb], ATH_f);
            }
        }

        for (var sfb = 0; sfb < Encoder.SBMAX_s; sfb++) {
            var start = gfc.scalefac_band.s[sfb];
            var end = gfc.scalefac_band.s[sfb + 1];
            ATH_s[sfb] = Float.MAX_VALUE;
            for (var i = start; i < end; i++) {
                var freq = i * samp_freq / (2 * 192);
                var ATH_f = ATHmdct(gfp, freq);
                /* freq in kHz */
                ATH_s[sfb] = Math.min(ATH_s[sfb], ATH_f);
            }
            ATH_s[sfb] *= (gfc.scalefac_band.s[sfb + 1] - gfc.scalefac_band.s[sfb]);
        }

        for (var sfb = 0; sfb < Encoder.PSFB12; sfb++) {
            var start = gfc.scalefac_band.psfb12[sfb];
            var end = gfc.scalefac_band.psfb12[sfb + 1];
            ATH_psfb12[sfb] = Float.MAX_VALUE;
            for (var i = start; i < end; i++) {
                var freq = i * samp_freq / (2 * 192);
                var ATH_f = ATHmdct(gfp, freq);
                /* freq in kHz */
                ATH_psfb12[sfb] = Math.min(ATH_psfb12[sfb], ATH_f);
            }
            /* not sure about the following */
            ATH_psfb12[sfb] *= (gfc.scalefac_band.s[13] - gfc.scalefac_band.s[12]);
        }

        /*
         * no-ATH mode: reduce ATH to -200 dB
         */
        if (gfp.noATH) {
            for (var sfb = 0; sfb < Encoder.SBMAX_l; sfb++) {
                ATH_l[sfb] = 1E-20;
            }
            for (var sfb = 0; sfb < Encoder.PSFB21; sfb++) {
                ATH_psfb21[sfb] = 1E-20;
            }
            for (var sfb = 0; sfb < Encoder.SBMAX_s; sfb++) {
                ATH_s[sfb] = 1E-20;
            }
            for (var sfb = 0; sfb < Encoder.PSFB12; sfb++) {
                ATH_psfb12[sfb] = 1E-20;
            }
        }

        /*
         * work in progress, don't rely on it too much
         */
        gfc.ATH.floor = 10. * Math.log10(ATHmdct(gfp, -1.));
    }

    /**
     * initialization for iteration_loop
     */
    this.iteration_init = function (gfp) {
        var gfc = gfp.internal_flags;
        var l3_side = gfc.l3_side;
        var i;

        if (gfc.iteration_init_init == 0) {
            gfc.iteration_init_init = 1;

            l3_side.main_data_begin = 0;
            compute_ath(gfp);

            pow43[0] = 0.0;
            for (i = 1; i < PRECALC_SIZE; i++)
                pow43[i] = Math.pow(i, 4.0 / 3.0);

            for (i = 0; i < PRECALC_SIZE - 1; i++)
                adj43[i] = ((i + 1) - Math.pow(
                    0.5 * (pow43[i] + pow43[i + 1]), 0.75));
            adj43[i] = 0.5;

            for (i = 0; i < Q_MAX; i++)
                ipow20[i] = Math.pow(2.0, (i - 210) * -0.1875);
            for (i = 0; i <= Q_MAX + Q_MAX2; i++)
                pow20[i] = Math.pow(2.0, (i - 210 - Q_MAX2) * 0.25);

            tak.huffman_init(gfc);

            {
                var bass, alto, treble, sfb21;

                i = (gfp.exp_nspsytune >> 2) & 63;
                if (i >= 32)
                    i -= 64;
                bass = Math.pow(10, i / 4.0 / 10.0);

                i = (gfp.exp_nspsytune >> 8) & 63;
                if (i >= 32)
                    i -= 64;
                alto = Math.pow(10, i / 4.0 / 10.0);

                i = (gfp.exp_nspsytune >> 14) & 63;
                if (i >= 32)
                    i -= 64;
                treble = Math.pow(10, i / 4.0 / 10.0);

                /*
                 * to be compatible with Naoki's original code, the next 6 bits
                 * define only the amount of changing treble for sfb21
                 */
                i = (gfp.exp_nspsytune >> 20) & 63;
                if (i >= 32)
                    i -= 64;
                sfb21 = treble * Math.pow(10, i / 4.0 / 10.0);
                for (i = 0; i < Encoder.SBMAX_l; i++) {
                    var f;
                    if (i <= 6)
                        f = bass;
                    else if (i <= 13)
                        f = alto;
                    else if (i <= 20)
                        f = treble;
                    else
                        f = sfb21;

                    gfc.nsPsy.longfact[i] = f;
                }
                for (i = 0; i < Encoder.SBMAX_s; i++) {
                    var f;
                    if (i <= 5)
                        f = bass;
                    else if (i <= 10)
                        f = alto;
                    else if (i <= 11)
                        f = treble;
                    else
                        f = sfb21;

                    gfc.nsPsy.shortfact[i] = f;
                }
            }
        }
    }

    /**
     * allocate bits among 2 channels based on PE<BR>
     * mt 6/99<BR>
     * bugfixes rh 8/01: often allocated more than the allowed 4095 bits
     */
    this.on_pe = function (gfp, pe,
                           targ_bits, mean_bits, gr, cbr) {
        var gfc = gfp.internal_flags;
        var tbits = 0, bits;
        var add_bits = new_int(2);
        var ch;

        /* allocate targ_bits for granule */
        var mb = new MeanBits(tbits);
        var extra_bits = rv.ResvMaxBits(gfp, mean_bits, mb, cbr);
        tbits = mb.bits;
        /* maximum allowed bits for this granule */
        var max_bits = tbits + extra_bits;
        if (max_bits > LameInternalFlags.MAX_BITS_PER_GRANULE) {
            // hard limit per granule
            max_bits = LameInternalFlags.MAX_BITS_PER_GRANULE;
        }
        for (bits = 0, ch = 0; ch < gfc.channels_out; ++ch) {
            /******************************************************************
             * allocate bits for each channel
             ******************************************************************/
            targ_bits[ch] = Math.min(LameInternalFlags.MAX_BITS_PER_CHANNEL,
                tbits / gfc.channels_out);

            add_bits[ch] = 0 | (targ_bits[ch] * pe[gr][ch] / 700.0 - targ_bits[ch]);

            /* at most increase bits by 1.5*average */
            if (add_bits[ch] > mean_bits * 3 / 4)
                add_bits[ch] = mean_bits * 3 / 4;
            if (add_bits[ch] < 0)
                add_bits[ch] = 0;

            if (add_bits[ch] + targ_bits[ch] > LameInternalFlags.MAX_BITS_PER_CHANNEL)
                add_bits[ch] = Math.max(0,
                    LameInternalFlags.MAX_BITS_PER_CHANNEL - targ_bits[ch]);

            bits += add_bits[ch];
        }
        if (bits > extra_bits) {
            for (ch = 0; ch < gfc.channels_out; ++ch) {
                add_bits[ch] = extra_bits * add_bits[ch] / bits;
            }
        }

        for (ch = 0; ch < gfc.channels_out; ++ch) {
            targ_bits[ch] += add_bits[ch];
            extra_bits -= add_bits[ch];
        }

        for (bits = 0, ch = 0; ch < gfc.channels_out; ++ch) {
            bits += targ_bits[ch];
        }
        if (bits > LameInternalFlags.MAX_BITS_PER_GRANULE) {
            var sum = 0;
            for (ch = 0; ch < gfc.channels_out; ++ch) {
                targ_bits[ch] *= LameInternalFlags.MAX_BITS_PER_GRANULE;
                targ_bits[ch] /= bits;
                sum += targ_bits[ch];
            }
            assert(sum <= LameInternalFlags.MAX_BITS_PER_GRANULE);
        }

        return max_bits;
    }

    this.reduce_side = function (targ_bits, ms_ener_ratio, mean_bits, max_bits) {
        assert(max_bits <= LameInternalFlags.MAX_BITS_PER_GRANULE);
        assert(targ_bits[0] + targ_bits[1] <= LameInternalFlags.MAX_BITS_PER_GRANULE);

        /*
         * ms_ener_ratio = 0: allocate 66/33 mid/side fac=.33 ms_ener_ratio =.5:
         * allocate 50/50 mid/side fac= 0
         */
        /* 75/25 split is fac=.5 */
        var fac = .33 * (.5 - ms_ener_ratio) / .5;
        if (fac < 0)
            fac = 0;
        if (fac > .5)
            fac = .5;

        /* number of bits to move from side channel to mid channel */
        /* move_bits = fac*targ_bits[1]; */
        var move_bits = 0 | (fac * .5 * (targ_bits[0] + targ_bits[1]));

        if (move_bits > LameInternalFlags.MAX_BITS_PER_CHANNEL - targ_bits[0]) {
            move_bits = LameInternalFlags.MAX_BITS_PER_CHANNEL - targ_bits[0];
        }
        if (move_bits < 0)
            move_bits = 0;

        if (targ_bits[1] >= 125) {
            /* dont reduce side channel below 125 bits */
            if (targ_bits[1] - move_bits > 125) {

                /* if mid channel already has 2x more than average, dont bother */
                /* mean_bits = bits per granule (for both channels) */
                if (targ_bits[0] < mean_bits)
                    targ_bits[0] += move_bits;
                targ_bits[1] -= move_bits;
            } else {
                targ_bits[0] += targ_bits[1] - 125;
                targ_bits[1] = 125;
            }
        }

        move_bits = targ_bits[0] + targ_bits[1];
        if (move_bits > max_bits) {
            targ_bits[0] = (max_bits * targ_bits[0]) / move_bits;
            targ_bits[1] = (max_bits * targ_bits[1]) / move_bits;
        }
        assert(targ_bits[0] <= LameInternalFlags.MAX_BITS_PER_CHANNEL);
        assert(targ_bits[1] <= LameInternalFlags.MAX_BITS_PER_CHANNEL);
        assert(targ_bits[0] + targ_bits[1] <= LameInternalFlags.MAX_BITS_PER_GRANULE);
    };

    /**
     *  Robert Hegemann 2001-04-27:
     *  this adjusts the ATH, keeping the original noise floor
     *  affects the higher frequencies more than the lower ones
     */
    this.athAdjust = function (a, x, athFloor) {
        /*
         * work in progress
         */
        var o = 90.30873362;
        var p = 94.82444863;
        var u = Util.FAST_LOG10_X(x, 10.0);
        var v = a * a;
        var w = 0.0;
        u -= athFloor;
        /* undo scaling */
        if (v > 1E-20)
            w = 1. + Util.FAST_LOG10_X(v, 10.0 / o);
        if (w < 0)
            w = 0.;
        u *= w;
        u += athFloor + o - p;
        /* redo scaling */

        return Math.pow(10., 0.1 * u);
    };

    /**
     * Calculate the allowed distortion for each scalefactor band, as determined
     * by the psychoacoustic model. xmin(sb) = ratio(sb) * en(sb) / bw(sb)
     *
     * returns number of sfb's with energy > ATH
     */
    this.calc_xmin = function (gfp, ratio, cod_info, pxmin) {
        var pxminPos = 0;
        var gfc = gfp.internal_flags;
        var gsfb, j = 0, ath_over = 0;
        var ATH = gfc.ATH;
        var xr = cod_info.xr;
        var enable_athaa_fix = (gfp.VBR == VbrMode.vbr_mtrh) ? 1 : 0;
        var masking_lower = gfc.masking_lower;

        if (gfp.VBR == VbrMode.vbr_mtrh || gfp.VBR == VbrMode.vbr_mt) {
            /* was already done in PSY-Model */
            masking_lower = 1.0;
        }

        for (gsfb = 0; gsfb < cod_info.psy_lmax; gsfb++) {
            var en0, xmin;
            var rh1, rh2;
            var width, l;

            if (gfp.VBR == VbrMode.vbr_rh || gfp.VBR == VbrMode.vbr_mtrh)
                xmin = athAdjust(ATH.adjust, ATH.l[gsfb], ATH.floor);
            else
                xmin = ATH.adjust * ATH.l[gsfb];

            width = cod_info.width[gsfb];
            rh1 = xmin / width;
            rh2 = DBL_EPSILON;
            l = width >> 1;
            en0 = 0.0;
            do {
                var xa, xb;
                xa = xr[j] * xr[j];
                en0 += xa;
                rh2 += (xa < rh1) ? xa : rh1;
                j++;
                xb = xr[j] * xr[j];
                en0 += xb;
                rh2 += (xb < rh1) ? xb : rh1;
                j++;
            } while (--l > 0);
            if (en0 > xmin)
                ath_over++;

            if (gsfb == Encoder.SBPSY_l) {
                var x = xmin * gfc.nsPsy.longfact[gsfb];
                if (rh2 < x) {
                    rh2 = x;
                }
            }
            if (enable_athaa_fix != 0) {
                xmin = rh2;
            }
            if (!gfp.ATHonly) {
                var e = ratio.en.l[gsfb];
                if (e > 0.0) {
                    var x;
                    x = en0 * ratio.thm.l[gsfb] * masking_lower / e;
                    if (enable_athaa_fix != 0)
                        x *= gfc.nsPsy.longfact[gsfb];
                    if (xmin < x)
                        xmin = x;
                }
            }
            if (enable_athaa_fix != 0)
                pxmin[pxminPos++] = xmin;
            else
                pxmin[pxminPos++] = xmin * gfc.nsPsy.longfact[gsfb];
        }
        /* end of long block loop */

        /* use this function to determine the highest non-zero coeff */
        var max_nonzero = 575;
        if (cod_info.block_type != Encoder.SHORT_TYPE) {
            // NORM, START or STOP type, but not SHORT
            var k = 576;
            while (k-- != 0 && BitStream.EQ(xr[k], 0)) {
                max_nonzero = k;
            }
        }
        cod_info.max_nonzero_coeff = max_nonzero;

        for (var sfb = cod_info.sfb_smin; gsfb < cod_info.psymax; sfb++, gsfb += 3) {
            var width, b;
            var tmpATH;
            if (gfp.VBR == VbrMode.vbr_rh || gfp.VBR == VbrMode.vbr_mtrh)
                tmpATH = athAdjust(ATH.adjust, ATH.s[sfb], ATH.floor);
            else
                tmpATH = ATH.adjust * ATH.s[sfb];

            width = cod_info.width[gsfb];
            for (b = 0; b < 3; b++) {
                var en0 = 0.0, xmin;
                var rh1, rh2;
                var l = width >> 1;

                rh1 = tmpATH / width;
                rh2 = DBL_EPSILON;
                do {
                    var xa, xb;
                    xa = xr[j] * xr[j];
                    en0 += xa;
                    rh2 += (xa < rh1) ? xa : rh1;
                    j++;
                    xb = xr[j] * xr[j];
                    en0 += xb;
                    rh2 += (xb < rh1) ? xb : rh1;
                    j++;
                } while (--l > 0);
                if (en0 > tmpATH)
                    ath_over++;
                if (sfb == Encoder.SBPSY_s) {
                    var x = tmpATH * gfc.nsPsy.shortfact[sfb];
                    if (rh2 < x) {
                        rh2 = x;
                    }
                }
                if (enable_athaa_fix != 0)
                    xmin = rh2;
                else
                    xmin = tmpATH;

                if (!gfp.ATHonly && !gfp.ATHshort) {
                    var e = ratio.en.s[sfb][b];
                    if (e > 0.0) {
                        var x;
                        x = en0 * ratio.thm.s[sfb][b] * masking_lower / e;
                        if (enable_athaa_fix != 0)
                            x *= gfc.nsPsy.shortfact[sfb];
                        if (xmin < x)
                            xmin = x;
                    }
                }
                if (enable_athaa_fix != 0)
                    pxmin[pxminPos++] = xmin;
                else
                    pxmin[pxminPos++] = xmin * gfc.nsPsy.shortfact[sfb];
            }
            /* b */
            if (gfp.useTemporal) {
                if (pxmin[pxminPos - 3] > pxmin[pxminPos - 3 + 1])
                    pxmin[pxminPos - 3 + 1] += (pxmin[pxminPos - 3] - pxmin[pxminPos - 3 + 1])
                        * gfc.decay;
                if (pxmin[pxminPos - 3 + 1] > pxmin[pxminPos - 3 + 2])
                    pxmin[pxminPos - 3 + 2] += (pxmin[pxminPos - 3 + 1] - pxmin[pxminPos - 3 + 2])
                        * gfc.decay;
            }
        }
        /* end of short block sfb loop */

        return ath_over;
    };

    function StartLine(j) {
        this.s = j;
    }

    this.calc_noise_core = function (cod_info, startline, l, step) {
        var noise = 0;
        var j = startline.s;
        var ix = cod_info.l3_enc;

        if (j > cod_info.count1) {
            while ((l--) != 0) {
                var temp;
                temp = cod_info.xr[j];
                j++;
                noise += temp * temp;
                temp = cod_info.xr[j];
                j++;
                noise += temp * temp;
            }
        } else if (j > cod_info.big_values) {
            var ix01 = new_float(2);
            ix01[0] = 0;
            ix01[1] = step;
            while ((l--) != 0) {
                var temp;
                temp = Math.abs(cod_info.xr[j]) - ix01[ix[j]];
                j++;
                noise += temp * temp;
                temp = Math.abs(cod_info.xr[j]) - ix01[ix[j]];
                j++;
                noise += temp * temp;
            }
        } else {
            while ((l--) != 0) {
                var temp;
                temp = Math.abs(cod_info.xr[j]) - pow43[ix[j]] * step;
                j++;
                noise += temp * temp;
                temp = Math.abs(cod_info.xr[j]) - pow43[ix[j]] * step;
                j++;
                noise += temp * temp;
            }
        }

        startline.s = j;
        return noise;
    }

    /**
     * <PRE>
     * -oo dB  =>  -1.00
     * - 6 dB  =>  -0.97
     * - 3 dB  =>  -0.80
     * - 2 dB  =>  -0.64
     * - 1 dB  =>  -0.38
     *   0 dB  =>   0.00
     * + 1 dB  =>  +0.49
     * + 2 dB  =>  +1.06
     * + 3 dB  =>  +1.68
     * + 6 dB  =>  +3.69
     * +10 dB  =>  +6.45
     * </PRE>
     */
    this.calc_noise = function (cod_info, l3_xmin, distort, res, prev_noise) {
        var distortPos = 0;
        var l3_xminPos = 0;
        var sfb, l, over = 0;
        var over_noise_db = 0;
        /* 0 dB relative to masking */
        var tot_noise_db = 0;
        /* -200 dB relative to masking */
        var max_noise = -20.0;
        var j = 0;
        var scalefac = cod_info.scalefac;
        var scalefacPos = 0;

        res.over_SSD = 0;

        for (sfb = 0; sfb < cod_info.psymax; sfb++) {
            var s = cod_info.global_gain
                - (((scalefac[scalefacPos++]) + (cod_info.preflag != 0 ? pretab[sfb]
                    : 0)) << (cod_info.scalefac_scale + 1))
                - cod_info.subblock_gain[cod_info.window[sfb]] * 8;
            var noise = 0.0;

            if (prev_noise != null && (prev_noise.step[sfb] == s)) {

                /* use previously computed values */
                noise = prev_noise.noise[sfb];
                j += cod_info.width[sfb];
                distort[distortPos++] = noise / l3_xmin[l3_xminPos++];

                noise = prev_noise.noise_log[sfb];

            } else {
                var step = POW20(s);
                l = cod_info.width[sfb] >> 1;

                if ((j + cod_info.width[sfb]) > cod_info.max_nonzero_coeff) {
                    var usefullsize;
                    usefullsize = cod_info.max_nonzero_coeff - j + 1;

                    if (usefullsize > 0)
                        l = usefullsize >> 1;
                    else
                        l = 0;
                }

                var sl = new StartLine(j);
                noise = this.calc_noise_core(cod_info, sl, l, step);
                j = sl.s;

                if (prev_noise != null) {
                    /* save noise values */
                    prev_noise.step[sfb] = s;
                    prev_noise.noise[sfb] = noise;
                }

                noise = distort[distortPos++] = noise / l3_xmin[l3_xminPos++];

                /* multiplying here is adding in dB, but can overflow */
                noise = Util.FAST_LOG10(Math.max(noise, 1E-20));

                if (prev_noise != null) {
                    /* save noise values */
                    prev_noise.noise_log[sfb] = noise;
                }
            }

            if (prev_noise != null) {
                /* save noise values */
                prev_noise.global_gain = cod_info.global_gain;
            }

            tot_noise_db += noise;

            if (noise > 0.0) {
                var tmp;

                tmp = Math.max(0 | (noise * 10 + .5), 1);
                res.over_SSD += tmp * tmp;

                over++;
                /* multiplying here is adding in dB -but can overflow */
                /* over_noise *= noise; */
                over_noise_db += noise;
            }
            max_noise = Math.max(max_noise, noise);

        }

        res.over_count = over;
        res.tot_noise = tot_noise_db;
        res.over_noise = over_noise_db;
        res.max_noise = max_noise;

        return over;
    }

    /**
     * updates plotting data
     *
     * Mark Taylor 2000-??-??
     *
     * Robert Hegemann: moved noise/distortion calc into it
     */
    this.set_pinfo = function (gfp, cod_info, ratio, gr, ch) {
        var gfc = gfp.internal_flags;
        var sfb, sfb2;
        var l;
        var en0, en1;
        var ifqstep = (cod_info.scalefac_scale == 0) ? .5 : 1.0;
        var scalefac = cod_info.scalefac;

        var l3_xmin = new_float(L3Side.SFBMAX);
        var xfsf = new_float(L3Side.SFBMAX);
        var noise = new CalcNoiseResult();

        calc_xmin(gfp, ratio, cod_info, l3_xmin);
        calc_noise(cod_info, l3_xmin, xfsf, noise, null);

        var j = 0;
        sfb2 = cod_info.sfb_lmax;
        if (cod_info.block_type != Encoder.SHORT_TYPE
            && 0 == cod_info.mixed_block_flag)
            sfb2 = 22;
        for (sfb = 0; sfb < sfb2; sfb++) {
            var start = gfc.scalefac_band.l[sfb];
            var end = gfc.scalefac_band.l[sfb + 1];
            var bw = end - start;
            for (en0 = 0.0; j < end; j++)
                en0 += cod_info.xr[j] * cod_info.xr[j];
            en0 /= bw;
            /* convert to MDCT units */
            /* scaling so it shows up on FFT plot */
            en1 = 1e15;
            gfc.pinfo.en[gr][ch][sfb] = en1 * en0;
            gfc.pinfo.xfsf[gr][ch][sfb] = en1 * l3_xmin[sfb] * xfsf[sfb] / bw;

            if (ratio.en.l[sfb] > 0 && !gfp.ATHonly)
                en0 = en0 / ratio.en.l[sfb];
            else
                en0 = 0.0;

            gfc.pinfo.thr[gr][ch][sfb] = en1
                * Math.max(en0 * ratio.thm.l[sfb], gfc.ATH.l[sfb]);

            /* there is no scalefactor bands >= SBPSY_l */
            gfc.pinfo.LAMEsfb[gr][ch][sfb] = 0;
            if (cod_info.preflag != 0 && sfb >= 11)
                gfc.pinfo.LAMEsfb[gr][ch][sfb] = -ifqstep * pretab[sfb];

            if (sfb < Encoder.SBPSY_l) {
                /* scfsi should be decoded by caller side */
                assert(scalefac[sfb] >= 0);
                gfc.pinfo.LAMEsfb[gr][ch][sfb] -= ifqstep * scalefac[sfb];
            }
        }
        /* for sfb */

        if (cod_info.block_type == Encoder.SHORT_TYPE) {
            sfb2 = sfb;
            for (sfb = cod_info.sfb_smin; sfb < Encoder.SBMAX_s; sfb++) {
                var start = gfc.scalefac_band.s[sfb];
                var end = gfc.scalefac_band.s[sfb + 1];
                var bw = end - start;
                for (var i = 0; i < 3; i++) {
                    for (en0 = 0.0, l = start; l < end; l++) {
                        en0 += cod_info.xr[j] * cod_info.xr[j];
                        j++;
                    }
                    en0 = Math.max(en0 / bw, 1e-20);
                    /* convert to MDCT units */
                    /* scaling so it shows up on FFT plot */
                    en1 = 1e15;

                    gfc.pinfo.en_s[gr][ch][3 * sfb + i] = en1 * en0;
                    gfc.pinfo.xfsf_s[gr][ch][3 * sfb + i] = en1 * l3_xmin[sfb2]
                        * xfsf[sfb2] / bw;
                    if (ratio.en.s[sfb][i] > 0)
                        en0 = en0 / ratio.en.s[sfb][i];
                    else
                        en0 = 0.0;
                    if (gfp.ATHonly || gfp.ATHshort)
                        en0 = 0;

                    gfc.pinfo.thr_s[gr][ch][3 * sfb + i] = en1
                        * Math.max(en0 * ratio.thm.s[sfb][i],
                            gfc.ATH.s[sfb]);

                    /* there is no scalefactor bands >= SBPSY_s */
                    gfc.pinfo.LAMEsfb_s[gr][ch][3 * sfb + i] = -2.0
                        * cod_info.subblock_gain[i];
                    if (sfb < Encoder.SBPSY_s) {
                        gfc.pinfo.LAMEsfb_s[gr][ch][3 * sfb + i] -= ifqstep
                            * scalefac[sfb2];
                    }
                    sfb2++;
                }
            }
        }
        /* block type short */
        gfc.pinfo.LAMEqss[gr][ch] = cod_info.global_gain;
        gfc.pinfo.LAMEmainbits[gr][ch] = cod_info.part2_3_length
            + cod_info.part2_length;
        gfc.pinfo.LAMEsfbits[gr][ch] = cod_info.part2_length;

        gfc.pinfo.over[gr][ch] = noise.over_count;
        gfc.pinfo.max_noise[gr][ch] = noise.max_noise * 10.0;
        gfc.pinfo.over_noise[gr][ch] = noise.over_noise * 10.0;
        gfc.pinfo.tot_noise[gr][ch] = noise.tot_noise * 10.0;
        gfc.pinfo.over_SSD[gr][ch] = noise.over_SSD;
    }

    /**
     * updates plotting data for a whole frame
     *
     * Robert Hegemann 2000-10-21
     */
    function set_frame_pinfo(gfp, ratio) {
        var gfc = gfp.internal_flags;

        gfc.masking_lower = 1.0;

        /*
         * for every granule and channel patch l3_enc and set info
         */
        for (var gr = 0; gr < gfc.mode_gr; gr++) {
            for (var ch = 0; ch < gfc.channels_out; ch++) {
                var cod_info = gfc.l3_side.tt[gr][ch];
                var scalefac_sav = new_int(L3Side.SFBMAX);
                System.arraycopy(cod_info.scalefac, 0, scalefac_sav, 0,
                    scalefac_sav.length);

                /*
                 * reconstruct the scalefactors in case SCFSI was used
                 */
                if (gr == 1) {
                    var sfb;
                    for (sfb = 0; sfb < cod_info.sfb_lmax; sfb++) {
                        if (cod_info.scalefac[sfb] < 0) /* scfsi */
                            cod_info.scalefac[sfb] = gfc.l3_side.tt[0][ch].scalefac[sfb];
                    }
                }

                set_pinfo(gfp, cod_info, ratio[gr][ch], gr, ch);
                System.arraycopy(scalefac_sav, 0, cod_info.scalefac, 0,
                    scalefac_sav.length);
            }
            /* for ch */
        }
        /* for gr */
    }

}

module.exports = QuantizePVT;
