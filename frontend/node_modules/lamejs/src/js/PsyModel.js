/*
 *      psymodel.c
 *
 *      Copyright (c) 1999-2000 Mark Taylor
 *      Copyright (c) 2001-2002 Naoki Shibata
 *      Copyright (c) 2000-2003 Takehiro Tominaga
 *      Copyright (c) 2000-2008 Robert Hegemann
 *      Copyright (c) 2000-2005 Gabriel Bouvigne
 *      Copyright (c) 2000-2005 Alexander Leidinger
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

/* $Id: PsyModel.java,v 1.27 2011/05/24 20:48:06 kenchis Exp $ */


/*
 PSYCHO ACOUSTICS


 This routine computes the psycho acoustics, delayed by one granule.

 Input: buffer of PCM data (1024 samples).

 This window should be centered over the 576 sample granule window.
 The routine will compute the psycho acoustics for
 this granule, but return the psycho acoustics computed
 for the *previous* granule.  This is because the block
 type of the previous granule can only be determined
 after we have computed the psycho acoustics for the following
 granule.

 Output:  maskings and energies for each scalefactor band.
 block type, PE, and some correlation measures.
 The PE is used by CBR modes to determine if extra bits
 from the bit reservoir should be used.  The correlation
 measures are used to determine mid/side or regular stereo.
 */
/*
 Notation:

 barks:  a non-linear frequency scale.  Mapping from frequency to
 barks is given by freq2bark()

 scalefactor bands: The spectrum (frequencies) are broken into
 SBMAX "scalefactor bands".  Thes bands
 are determined by the MPEG ISO spec.  In
 the noise shaping/quantization code, we allocate
 bits among the partition bands to achieve the
 best possible quality

 partition bands:   The spectrum is also broken into about
 64 "partition bands".  Each partition
 band is about .34 barks wide.  There are about 2-5
 partition bands for each scalefactor band.

 LAME computes all psycho acoustic information for each partition
 band.  Then at the end of the computations, this information
 is mapped to scalefactor bands.  The energy in each scalefactor
 band is taken as the sum of the energy in all partition bands
 which overlap the scalefactor band.  The maskings can be computed
 in the same way (and thus represent the average masking in that band)
 or by taking the minmum value multiplied by the number of
 partition bands used (which represents a minimum masking in that band).
 */
/*
 The general outline is as follows:

 1. compute the energy in each partition band
 2. compute the tonality in each partition band
 3. compute the strength of each partion band "masker"
 4. compute the masking (via the spreading function applied to each masker)
 5. Modifications for mid/side masking.

 Each partition band is considiered a "masker".  The strength
 of the i'th masker in band j is given by:

 s3(bark(i)-bark(j))*strength(i)

 The strength of the masker is a function of the energy and tonality.
 The more tonal, the less masking.  LAME uses a simple linear formula
 (controlled by NMT and TMN) which says the strength is given by the
 energy divided by a linear function of the tonality.
 */
/*
 s3() is the "spreading function".  It is given by a formula
 determined via listening tests.

 The total masking in the j'th partition band is the sum over
 all maskings i.  It is thus given by the convolution of
 the strength with s3(), the "spreading function."

 masking(j) = sum_over_i  s3(i-j)*strength(i)  = s3 o strength

 where "o" = convolution operator.  s3 is given by a formula determined
 via listening tests.  It is normalized so that s3 o 1 = 1.

 Note: instead of a simple convolution, LAME also has the
 option of using "additive masking"

 The most critical part is step 2, computing the tonality of each
 partition band.  LAME has two tonality estimators.  The first
 is based on the ISO spec, and measures how predictiable the
 signal is over time.  The more predictable, the more tonal.
 The second measure is based on looking at the spectrum of
 a single granule.  The more peaky the spectrum, the more
 tonal.  By most indications, the latter approach is better.

 Finally, in step 5, the maskings for the mid and side
 channel are possibly increased.  Under certain circumstances,
 noise in the mid & side channels is assumed to also
 be masked by strong maskers in the L or R channels.


 Other data computed by the psy-model:

 ms_ratio        side-channel / mid-channel masking ratio (for previous granule)
 ms_ratio_next   side-channel / mid-channel masking ratio for this granule

 percep_entropy[2]     L and R values (prev granule) of PE - A measure of how
 much pre-echo is in the previous granule
 percep_entropy_MS[2]  mid and side channel values (prev granule) of percep_entropy
 energy[4]             L,R,M,S energy in each channel, prev granule
 blocktype_d[2]        block type to use for previous granule
 */
//package mp3;

//import java.util.Arrays;
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

var FFT = require("./FFT.js");
var Encoder = require("./Encoder.js");

function PsyModel() {

    var fft = new FFT();

    var LOG10 = 2.30258509299404568402;

    var rpelev = 2;
    var rpelev2 = 16;
    var rpelev_s = 2;
    var rpelev2_s = 16;

    /* size of each partition band, in barks: */
    var DELBARK = .34;

    /* tuned for output level (sensitive to energy scale) */
    var VO_SCALE = (1. / (14752 * 14752) / (Encoder.BLKSIZE / 2));

    var temporalmask_sustain_sec = 0.01;

    var NS_PREECHO_ATT0 = 0.8;
    var NS_PREECHO_ATT1 = 0.6;
    var NS_PREECHO_ATT2 = 0.3;

    var NS_MSFIX = 3.5;

    var NSATTACKTHRE = 4.4;
    var NSATTACKTHRE_S = 25;

    var NSFIRLEN = 21;

    /* size of each partition band, in barks: */
    var LN_TO_LOG10 = 0.2302585093;

    function NON_LINEAR_SCALE_ENERGY(x) {
        return x;
    }

    /**
     * <PRE>
     *       L3psycho_anal.  Compute psycho acoustics.
     *
     *       Data returned to the calling program must be delayed by one
     *       granule.
     *
     *       This is done in two places.
     *       If we do not need to know the blocktype, the copying
     *       can be done here at the top of the program: we copy the data for
     *       the last granule (computed during the last call) before it is
     *       overwritten with the new data.  It looks like this:
     *
     *       0. static psymodel_data
     *       1. calling_program_data = psymodel_data
     *       2. compute psymodel_data
     *
     *       For data which needs to know the blocktype, the copying must be
     *       done at the end of this loop, and the old values must be saved:
     *
     *       0. static psymodel_data_old
     *       1. compute psymodel_data
     *       2. compute possible block type of this granule
     *       3. compute final block type of previous granule based on #2.
     *       4. calling_program_data = psymodel_data_old
     *       5. psymodel_data_old = psymodel_data
     *     psycho_loudness_approx
     *       jd - 2001 mar 12
     *    in:  energy   - BLKSIZE/2 elements of frequency magnitudes ^ 2
     *         gfp      - uses out_samplerate, ATHtype (also needed for ATHformula)
     *    returns: loudness^2 approximation, a positive value roughly tuned for a value
     *             of 1.0 for signals near clipping.
     *    notes:   When calibrated, feeding this function binary white noise at sample
     *             values +32767 or -32768 should return values that approach 3.
     *             ATHformula is used to approximate an equal loudness curve.
     *    future:  Data indicates that the shape of the equal loudness curve varies
     *             with intensity.  This function might be improved by using an equal
     *             loudness curve shaped for typical playback levels (instead of the
     *             ATH, that is shaped for the threshold).  A flexible realization might
     *             simply bend the existing ATH curve to achieve the desired shape.
     *             However, the potential gain may not be enough to justify an effort.
     * </PRE>
     */
    function psycho_loudness_approx(energy, gfc) {
        var loudness_power = 0.0;
        /* apply weights to power in freq. bands */
        for (var i = 0; i < Encoder.BLKSIZE / 2; ++i)
            loudness_power += energy[i] * gfc.ATH.eql_w[i];
        loudness_power *= VO_SCALE;

        return loudness_power;
    }

    function compute_ffts(gfp, fftenergy, fftenergy_s, wsamp_l, wsamp_lPos, wsamp_s, wsamp_sPos, gr_out, chn, buffer, bufPos) {
        var gfc = gfp.internal_flags;
        if (chn < 2) {
            fft.fft_long(gfc, wsamp_l[wsamp_lPos], chn, buffer, bufPos);
            fft.fft_short(gfc, wsamp_s[wsamp_sPos], chn, buffer, bufPos);
        }
        /* FFT data for mid and side channel is derived from L & R */
        else if (chn == 2) {
            for (var j = Encoder.BLKSIZE - 1; j >= 0; --j) {
                var l = wsamp_l[wsamp_lPos + 0][j];
                var r = wsamp_l[wsamp_lPos + 1][j];
                wsamp_l[wsamp_lPos + 0][j] = (l + r) * Util.SQRT2 * 0.5;
                wsamp_l[wsamp_lPos + 1][j] = (l - r) * Util.SQRT2 * 0.5;
            }
            for (var b = 2; b >= 0; --b) {
                for (var j = Encoder.BLKSIZE_s - 1; j >= 0; --j) {
                    var l = wsamp_s[wsamp_sPos + 0][b][j];
                    var r = wsamp_s[wsamp_sPos + 1][b][j];
                    wsamp_s[wsamp_sPos + 0][b][j] = (l + r) * Util.SQRT2 * 0.5;
                    wsamp_s[wsamp_sPos + 1][b][j] = (l - r) * Util.SQRT2 * 0.5;
                }
            }
        }

        /*********************************************************************
         * compute energies
         *********************************************************************/
        fftenergy[0] = NON_LINEAR_SCALE_ENERGY(wsamp_l[wsamp_lPos + 0][0]);
        fftenergy[0] *= fftenergy[0];

        for (var j = Encoder.BLKSIZE / 2 - 1; j >= 0; --j) {
            var re = (wsamp_l[wsamp_lPos + 0])[Encoder.BLKSIZE / 2 - j];
            var im = (wsamp_l[wsamp_lPos + 0])[Encoder.BLKSIZE / 2 + j];
            fftenergy[Encoder.BLKSIZE / 2 - j] = NON_LINEAR_SCALE_ENERGY((re
                * re + im * im) * 0.5);
        }
        for (var b = 2; b >= 0; --b) {
            fftenergy_s[b][0] = (wsamp_s[wsamp_sPos + 0])[b][0];
            fftenergy_s[b][0] *= fftenergy_s[b][0];
            for (var j = Encoder.BLKSIZE_s / 2 - 1; j >= 0; --j) {
                var re = (wsamp_s[wsamp_sPos + 0])[b][Encoder.BLKSIZE_s
                / 2 - j];
                var im = (wsamp_s[wsamp_sPos + 0])[b][Encoder.BLKSIZE_s
                / 2 + j];
                fftenergy_s[b][Encoder.BLKSIZE_s / 2 - j] = NON_LINEAR_SCALE_ENERGY((re
                    * re + im * im) * 0.5);
            }
        }
        /* total energy */
        {
            var totalenergy = 0.0;
            for (var j = 11; j < Encoder.HBLKSIZE; j++)
                totalenergy += fftenergy[j];

            gfc.tot_ener[chn] = totalenergy;
        }

        if (gfp.analysis) {
            for (var j = 0; j < Encoder.HBLKSIZE; j++) {
                gfc.pinfo.energy[gr_out][chn][j] = gfc.pinfo.energy_save[chn][j];
                gfc.pinfo.energy_save[chn][j] = fftenergy[j];
            }
            gfc.pinfo.pe[gr_out][chn] = gfc.pe[chn];
        }

        /*********************************************************************
         * compute loudness approximation (used for ATH auto-level adjustment)
         *********************************************************************/
        if (gfp.athaa_loudapprox == 2 && chn < 2) {
            // no loudness for mid/side ch
            gfc.loudness_sq[gr_out][chn] = gfc.loudness_sq_save[chn];
            gfc.loudness_sq_save[chn] = psycho_loudness_approx(fftenergy, gfc);
        }
    }

    /* mask_add optimization */
    /* init the limit values used to avoid computing log in mask_add when it is not necessary */

    /**
     * <PRE>
     *  For example, with i = 10*log10(m2/m1)/10*16         (= log10(m2/m1)*16)
     *
     * abs(i)>8 is equivalent (as i is an integer) to
     * abs(i)>=9
     * i>=9 || i<=-9
     * equivalent to (as i is the biggest integer smaller than log10(m2/m1)*16
     * or the smallest integer bigger than log10(m2/m1)*16 depending on the sign of log10(m2/m1)*16)
     * log10(m2/m1)>=9/16 || log10(m2/m1)<=-9/16
     * exp10 is strictly increasing thus this is equivalent to
     * m2/m1 >= 10^(9/16) || m2/m1<=10^(-9/16) which are comparisons to constants
     * </PRE>
     */

    /**
     * as in if(i>8)
     */
    var I1LIMIT = 8;
    /**
     * as in if(i>24) . changed 23
     */
    var I2LIMIT = 23;
    /**
     * as in if(m<15)
     */
    var MLIMIT = 15;

    var ma_max_i1;
    var ma_max_i2;
    var ma_max_m;

    /**
     * This is the masking table:<BR>
     * According to tonality, values are going from 0dB (TMN) to 9.3dB (NMT).<BR>
     * After additive masking computation, 8dB are added, so final values are
     * going from 8dB to 17.3dB
     *
     * pow(10, -0.0..-0.6)
     */
    var tab = [1.0, 0.79433, 0.63096, 0.63096,
        0.63096, 0.63096, 0.63096, 0.25119, 0.11749];

    function init_mask_add_max_values() {
        ma_max_i1 = Math.pow(10, (I1LIMIT + 1) / 16.0);
        ma_max_i2 = Math.pow(10, (I2LIMIT + 1) / 16.0);
        ma_max_m = Math.pow(10, (MLIMIT) / 10.0);
    }

    var table1 = [3.3246 * 3.3246,
        3.23837 * 3.23837, 3.15437 * 3.15437, 3.00412 * 3.00412,
        2.86103 * 2.86103, 2.65407 * 2.65407, 2.46209 * 2.46209,
        2.284 * 2.284, 2.11879 * 2.11879, 1.96552 * 1.96552,
        1.82335 * 1.82335, 1.69146 * 1.69146, 1.56911 * 1.56911,
        1.46658 * 1.46658, 1.37074 * 1.37074, 1.31036 * 1.31036,
        1.25264 * 1.25264, 1.20648 * 1.20648, 1.16203 * 1.16203,
        1.12765 * 1.12765, 1.09428 * 1.09428, 1.0659 * 1.0659,
        1.03826 * 1.03826, 1.01895 * 1.01895, 1];

    var table2 = [1.33352 * 1.33352,
        1.35879 * 1.35879, 1.38454 * 1.38454, 1.39497 * 1.39497,
        1.40548 * 1.40548, 1.3537 * 1.3537, 1.30382 * 1.30382,
        1.22321 * 1.22321, 1.14758 * 1.14758, 1];

    var table3 = [2.35364 * 2.35364,
        2.29259 * 2.29259, 2.23313 * 2.23313, 2.12675 * 2.12675,
        2.02545 * 2.02545, 1.87894 * 1.87894, 1.74303 * 1.74303,
        1.61695 * 1.61695, 1.49999 * 1.49999, 1.39148 * 1.39148,
        1.29083 * 1.29083, 1.19746 * 1.19746, 1.11084 * 1.11084,
        1.03826 * 1.03826];

    /**
     * addition of simultaneous masking Naoki Shibata 2000/7
     */
    function mask_add(m1, m2, kk, b, gfc, shortblock) {
        var ratio;

        if (m2 > m1) {
            if (m2 < (m1 * ma_max_i2))
                ratio = m2 / m1;
            else
                return (m1 + m2);
        } else {
            if (m1 >= (m2 * ma_max_i2))
                return (m1 + m2);
            ratio = m1 / m2;
        }

        /* Should always be true, just checking */
        assert(m1 >= 0);
        assert(m2 >= 0);

        m1 += m2;
        //if (((long)(b + 3) & 0xffffffff) <= 3 + 3) {
        if ((b + 3) <= 3 + 3) {
            /* approximately, 1 bark = 3 partitions */
            /* 65% of the cases */
            /* originally 'if(i > 8)' */
            if (ratio >= ma_max_i1) {
                /* 43% of the total */
                return m1;
            }

            /* 22% of the total */
            var i = 0 | (Util.FAST_LOG10_X(ratio, 16.0));
            return m1 * table2[i];
        }

        /**
         * <PRE>
         * m<15 equ log10((m1+m2)/gfc.ATH.cb[k])<1.5
         * equ (m1+m2)/gfc.ATH.cb[k]<10^1.5
         * equ (m1+m2)<10^1.5 * gfc.ATH.cb[k]
         * </PRE>
         */
        var i = 0 | Util.FAST_LOG10_X(ratio, 16.0);
        if (shortblock != 0) {
            m2 = gfc.ATH.cb_s[kk] * gfc.ATH.adjust;
        } else {
            m2 = gfc.ATH.cb_l[kk] * gfc.ATH.adjust;
        }
        assert(m2 >= 0);
        if (m1 < ma_max_m * m2) {
            /* 3% of the total */
            /* Originally if (m > 0) { */
            if (m1 > m2) {
                var f, r;

                f = 1.0;
                if (i <= 13)
                    f = table3[i];

                r = Util.FAST_LOG10_X(m1 / m2, 10.0 / 15.0);
                return m1 * ((table1[i] - f) * r + f);
            }

            if (i > 13)
                return m1;

            return m1 * table3[i];
        }

        /* 10% of total */
        return m1 * table1[i];
    }

    var table2_ = [1.33352 * 1.33352,
        1.35879 * 1.35879, 1.38454 * 1.38454, 1.39497 * 1.39497,
        1.40548 * 1.40548, 1.3537 * 1.3537, 1.30382 * 1.30382,
        1.22321 * 1.22321, 1.14758 * 1.14758, 1];

    /**
     * addition of simultaneous masking Naoki Shibata 2000/7
     */
    function vbrpsy_mask_add(m1, m2, b) {
        var ratio;

        if (m1 < 0) {
            m1 = 0;
        }
        if (m2 < 0) {
            m2 = 0;
        }
        if (m1 <= 0) {
            return m2;
        }
        if (m2 <= 0) {
            return m1;
        }
        if (m2 > m1) {
            ratio = m2 / m1;
        } else {
            ratio = m1 / m2;
        }
        if (-2 <= b && b <= 2) {
            /* approximately, 1 bark = 3 partitions */
            /* originally 'if(i > 8)' */
            if (ratio >= ma_max_i1) {
                return m1 + m2;
            } else {
                var i = 0 | (Util.FAST_LOG10_X(ratio, 16.0));
                return (m1 + m2) * table2_[i];
            }
        }
        if (ratio < ma_max_i2) {
            return m1 + m2;
        }
        if (m1 < m2) {
            m1 = m2;
        }
        return m1;
    }

    /**
     * compute interchannel masking effects
     */
    function calc_interchannel_masking(gfp, ratio) {
        var gfc = gfp.internal_flags;
        if (gfc.channels_out > 1) {
            for (var sb = 0; sb < Encoder.SBMAX_l; sb++) {
                var l = gfc.thm[0].l[sb];
                var r = gfc.thm[1].l[sb];
                gfc.thm[0].l[sb] += r * ratio;
                gfc.thm[1].l[sb] += l * ratio;
            }
            for (var sb = 0; sb < Encoder.SBMAX_s; sb++) {
                for (var sblock = 0; sblock < 3; sblock++) {
                    var l = gfc.thm[0].s[sb][sblock];
                    var r = gfc.thm[1].s[sb][sblock];
                    gfc.thm[0].s[sb][sblock] += r * ratio;
                    gfc.thm[1].s[sb][sblock] += l * ratio;
                }
            }
        }
    }

    /**
     * compute M/S thresholds from Johnston & Ferreira 1992 ICASSP paper
     */
    function msfix1(gfc) {
        for (var sb = 0; sb < Encoder.SBMAX_l; sb++) {
            /* use this fix if L & R masking differs by 2db or less */
            /* if db = 10*log10(x2/x1) < 2 */
            /* if (x2 < 1.58*x1) { */
            if (gfc.thm[0].l[sb] > 1.58 * gfc.thm[1].l[sb]
                || gfc.thm[1].l[sb] > 1.58 * gfc.thm[0].l[sb])
                continue;
            var mld = gfc.mld_l[sb] * gfc.en[3].l[sb];
            var rmid = Math.max(gfc.thm[2].l[sb],
                Math.min(gfc.thm[3].l[sb], mld));

            mld = gfc.mld_l[sb] * gfc.en[2].l[sb];
            var rside = Math.max(gfc.thm[3].l[sb],
                Math.min(gfc.thm[2].l[sb], mld));
            gfc.thm[2].l[sb] = rmid;
            gfc.thm[3].l[sb] = rside;
        }

        for (var sb = 0; sb < Encoder.SBMAX_s; sb++) {
            for (var sblock = 0; sblock < 3; sblock++) {
                if (gfc.thm[0].s[sb][sblock] > 1.58 * gfc.thm[1].s[sb][sblock]
                    || gfc.thm[1].s[sb][sblock] > 1.58 * gfc.thm[0].s[sb][sblock])
                    continue;
                var mld = gfc.mld_s[sb] * gfc.en[3].s[sb][sblock];
                var rmid = Math.max(gfc.thm[2].s[sb][sblock],
                    Math.min(gfc.thm[3].s[sb][sblock], mld));

                mld = gfc.mld_s[sb] * gfc.en[2].s[sb][sblock];
                var rside = Math.max(gfc.thm[3].s[sb][sblock],
                    Math.min(gfc.thm[2].s[sb][sblock], mld));

                gfc.thm[2].s[sb][sblock] = rmid;
                gfc.thm[3].s[sb][sblock] = rside;
            }
        }
    }

    /**
     * Adjust M/S maskings if user set "msfix"
     *
     * Naoki Shibata 2000
     */
    function ns_msfix(gfc, msfix, athadjust) {
        var msfix2 = msfix;
        var athlower = Math.pow(10, athadjust);

        msfix *= 2.0;
        msfix2 *= 2.0;
        for (var sb = 0; sb < Encoder.SBMAX_l; sb++) {
            var thmLR, thmM, thmS, ath;
            ath = (gfc.ATH.cb_l[gfc.bm_l[sb]]) * athlower;
            thmLR = Math.min(Math.max(gfc.thm[0].l[sb], ath),
                Math.max(gfc.thm[1].l[sb], ath));
            thmM = Math.max(gfc.thm[2].l[sb], ath);
            thmS = Math.max(gfc.thm[3].l[sb], ath);
            if (thmLR * msfix < thmM + thmS) {
                var f = thmLR * msfix2 / (thmM + thmS);
                thmM *= f;
                thmS *= f;
                assert(thmM + thmS > 0);
            }
            gfc.thm[2].l[sb] = Math.min(thmM, gfc.thm[2].l[sb]);
            gfc.thm[3].l[sb] = Math.min(thmS, gfc.thm[3].l[sb]);
        }

        athlower *= ( Encoder.BLKSIZE_s / Encoder.BLKSIZE);
        for (var sb = 0; sb < Encoder.SBMAX_s; sb++) {
            for (var sblock = 0; sblock < 3; sblock++) {
                var thmLR, thmM, thmS, ath;
                ath = (gfc.ATH.cb_s[gfc.bm_s[sb]]) * athlower;
                thmLR = Math.min(Math.max(gfc.thm[0].s[sb][sblock], ath),
                    Math.max(gfc.thm[1].s[sb][sblock], ath));
                thmM = Math.max(gfc.thm[2].s[sb][sblock], ath);
                thmS = Math.max(gfc.thm[3].s[sb][sblock], ath);

                if (thmLR * msfix < thmM + thmS) {
                    var f = thmLR * msfix / (thmM + thmS);
                    thmM *= f;
                    thmS *= f;
                    assert(thmM + thmS > 0);
                }
                gfc.thm[2].s[sb][sblock] = Math.min(gfc.thm[2].s[sb][sblock],
                    thmM);
                gfc.thm[3].s[sb][sblock] = Math.min(gfc.thm[3].s[sb][sblock],
                    thmS);
            }
        }
    }

    /**
     * short block threshold calculation (part 2)
     *
     * partition band bo_s[sfb] is at the transition from scalefactor band sfb
     * to the next one sfb+1; enn and thmm have to be split between them
     */
    function convert_partition2scalefac_s(gfc, eb, thr, chn, sblock) {
        var sb, b;
        var enn = 0.0;
        var thmm = 0.0;
        for (sb = b = 0; sb < Encoder.SBMAX_s; ++b, ++sb) {
            var bo_s_sb = gfc.bo_s[sb];
            var npart_s = gfc.npart_s;
            var b_lim = bo_s_sb < npart_s ? bo_s_sb : npart_s;
            while (b < b_lim) {
                assert(eb[b] >= 0);
                // iff failed, it may indicate some index error elsewhere
                assert(thr[b] >= 0);
                enn += eb[b];
                thmm += thr[b];
                b++;
            }
            gfc.en[chn].s[sb][sblock] = enn;
            gfc.thm[chn].s[sb][sblock] = thmm;

            if (b >= npart_s) {
                ++sb;
                break;
            }
            assert(eb[b] >= 0);
            // iff failed, it may indicate some index error elsewhere
            assert(thr[b] >= 0);
            {
                /* at transition sfb . sfb+1 */
                var w_curr = gfc.PSY.bo_s_weight[sb];
                var w_next = 1.0 - w_curr;
                enn = w_curr * eb[b];
                thmm = w_curr * thr[b];
                gfc.en[chn].s[sb][sblock] += enn;
                gfc.thm[chn].s[sb][sblock] += thmm;
                enn = w_next * eb[b];
                thmm = w_next * thr[b];
            }
        }
        /* zero initialize the rest */
        for (; sb < Encoder.SBMAX_s; ++sb) {
            gfc.en[chn].s[sb][sblock] = 0;
            gfc.thm[chn].s[sb][sblock] = 0;
        }
    }

    /**
     * longblock threshold calculation (part 2)
     */
    function convert_partition2scalefac_l(gfc, eb, thr, chn) {
        var sb, b;
        var enn = 0.0;
        var thmm = 0.0;
        for (sb = b = 0; sb < Encoder.SBMAX_l; ++b, ++sb) {
            var bo_l_sb = gfc.bo_l[sb];
            var npart_l = gfc.npart_l;
            var b_lim = bo_l_sb < npart_l ? bo_l_sb : npart_l;
            while (b < b_lim) {
                assert(eb[b] >= 0);
                // iff failed, it may indicate some index error elsewhere
                assert(thr[b] >= 0);
                enn += eb[b];
                thmm += thr[b];
                b++;
            }
            gfc.en[chn].l[sb] = enn;
            gfc.thm[chn].l[sb] = thmm;

            if (b >= npart_l) {
                ++sb;
                break;
            }
            assert(eb[b] >= 0);
            assert(thr[b] >= 0);
            {
                /* at transition sfb . sfb+1 */
                var w_curr = gfc.PSY.bo_l_weight[sb];
                var w_next = 1.0 - w_curr;
                enn = w_curr * eb[b];
                thmm = w_curr * thr[b];
                gfc.en[chn].l[sb] += enn;
                gfc.thm[chn].l[sb] += thmm;
                enn = w_next * eb[b];
                thmm = w_next * thr[b];
            }
        }
        /* zero initialize the rest */
        for (; sb < Encoder.SBMAX_l; ++sb) {
            gfc.en[chn].l[sb] = 0;
            gfc.thm[chn].l[sb] = 0;
        }
    }

    function compute_masking_s(gfp, fftenergy_s, eb, thr, chn, sblock) {
        var gfc = gfp.internal_flags;
        var j, b;

        for (b = j = 0; b < gfc.npart_s; ++b) {
            var ebb = 0, m = 0;
            var n = gfc.numlines_s[b];
            for (var i = 0; i < n; ++i, ++j) {
                var el = fftenergy_s[sblock][j];
                ebb += el;
                if (m < el)
                    m = el;
            }
            eb[b] = ebb;
        }
        assert(b == gfc.npart_s);
        assert(j == 129);
        for (j = b = 0; b < gfc.npart_s; b++) {
            var kk = gfc.s3ind_s[b][0];
            var ecb = gfc.s3_ss[j++] * eb[kk];
            ++kk;
            while (kk <= gfc.s3ind_s[b][1]) {
                ecb += gfc.s3_ss[j] * eb[kk];
                ++j;
                ++kk;
            }

            { /* limit calculated threshold by previous granule */
                var x = rpelev_s * gfc.nb_s1[chn][b];
                thr[b] = Math.min(ecb, x);
            }
            if (gfc.blocktype_old[chn & 1] == Encoder.SHORT_TYPE) {
                /* limit calculated threshold by even older granule */
                var x = rpelev2_s * gfc.nb_s2[chn][b];
                var y = thr[b];
                thr[b] = Math.min(x, y);
            }

            gfc.nb_s2[chn][b] = gfc.nb_s1[chn][b];
            gfc.nb_s1[chn][b] = ecb;
            assert(thr[b] >= 0);
        }
        for (; b <= Encoder.CBANDS; ++b) {
            eb[b] = 0;
            thr[b] = 0;
        }
    }

    function block_type_set(gfp, uselongblock, blocktype_d, blocktype) {
        var gfc = gfp.internal_flags;

        if (gfp.short_blocks == ShortBlock.short_block_coupled
                /* force both channels to use the same block type */
                /* this is necessary if the frame is to be encoded in ms_stereo. */
                /* But even without ms_stereo, FhG does this */
            && !(uselongblock[0] != 0 && uselongblock[1] != 0))
            uselongblock[0] = uselongblock[1] = 0;

        /*
         * update the blocktype of the previous granule, since it depends on
         * what happend in this granule
         */
        for (var chn = 0; chn < gfc.channels_out; chn++) {
            blocktype[chn] = Encoder.NORM_TYPE;
            /* disable short blocks */
            if (gfp.short_blocks == ShortBlock.short_block_dispensed)
                uselongblock[chn] = 1;
            if (gfp.short_blocks == ShortBlock.short_block_forced)
                uselongblock[chn] = 0;

            if (uselongblock[chn] != 0) {
                /* no attack : use long blocks */
                assert(gfc.blocktype_old[chn] != Encoder.START_TYPE);
                if (gfc.blocktype_old[chn] == Encoder.SHORT_TYPE)
                    blocktype[chn] = Encoder.STOP_TYPE;
            } else {
                /* attack : use short blocks */
                blocktype[chn] = Encoder.SHORT_TYPE;
                if (gfc.blocktype_old[chn] == Encoder.NORM_TYPE) {
                    gfc.blocktype_old[chn] = Encoder.START_TYPE;
                }
                if (gfc.blocktype_old[chn] == Encoder.STOP_TYPE)
                    gfc.blocktype_old[chn] = Encoder.SHORT_TYPE;
            }

            blocktype_d[chn] = gfc.blocktype_old[chn];
            // value returned to calling program
            gfc.blocktype_old[chn] = blocktype[chn];
            // save for next call to l3psy_anal
        }
    }

    function NS_INTERP(x, y, r) {
        /* was pow((x),(r))*pow((y),1-(r)) */
        if (r >= 1.0) {
            /* 99.7% of the time */
            return x;
        }
        if (r <= 0.0)
            return y;
        if (y > 0.0) {
            /* rest of the time */
            return (Math.pow(x / y, r) * y);
        }
        /* never happens */
        return 0.0;
    }

    /**
     * these values are tuned only for 44.1kHz...
     */
    var regcoef_s = [11.8, 13.6, 17.2, 32, 46.5,
        51.3, 57.5, 67.1, 71.5, 84.6, 97.6, 130,
        /* 255.8 */
    ];

    function pecalc_s(mr, masking_lower) {
        var pe_s = 1236.28 / 4;
        for (var sb = 0; sb < Encoder.SBMAX_s - 1; sb++) {
            for (var sblock = 0; sblock < 3; sblock++) {
                var thm = mr.thm.s[sb][sblock];
                assert(sb < regcoef_s.length);
                if (thm > 0.0) {
                    var x = thm * masking_lower;
                    var en = mr.en.s[sb][sblock];
                    if (en > x) {
                        if (en > x * 1e10) {
                            pe_s += regcoef_s[sb] * (10.0 * LOG10);
                        } else {
                            assert(x > 0);
                            pe_s += regcoef_s[sb] * Util.FAST_LOG10(en / x);
                        }
                    }
                }
            }
        }

        return pe_s;
    }

    /**
     * these values are tuned only for 44.1kHz...
     */
    var regcoef_l = [6.8, 5.8, 5.8, 6.4, 6.5, 9.9,
        12.1, 14.4, 15, 18.9, 21.6, 26.9, 34.2, 40.2, 46.8, 56.5,
        60.7, 73.9, 85.7, 93.4, 126.1,
        /* 241.3 */
    ];

    function pecalc_l(mr, masking_lower) {
        var pe_l = 1124.23 / 4;
        for (var sb = 0; sb < Encoder.SBMAX_l - 1; sb++) {
            var thm = mr.thm.l[sb];
            assert(sb < regcoef_l.length);
            if (thm > 0.0) {
                var x = thm * masking_lower;
                var en = mr.en.l[sb];
                if (en > x) {
                    if (en > x * 1e10) {
                        pe_l += regcoef_l[sb] * (10.0 * LOG10);
                    } else {
                        assert(x > 0);
                        pe_l += regcoef_l[sb] * Util.FAST_LOG10(en / x);
                    }
                }
            }
        }
        return pe_l;
    }

    function calc_energy(gfc, fftenergy, eb, max, avg) {
        var b, j;

        for (b = j = 0; b < gfc.npart_l; ++b) {
            var ebb = 0, m = 0;
            var i;
            for (i = 0; i < gfc.numlines_l[b]; ++i, ++j) {
                var el = fftenergy[j];
                assert(el >= 0);
                ebb += el;
                if (m < el)
                    m = el;
            }
            eb[b] = ebb;
            max[b] = m;
            avg[b] = ebb * gfc.rnumlines_l[b];
            assert(gfc.rnumlines_l[b] >= 0);
            assert(ebb >= 0);
            assert(eb[b] >= 0);
            assert(max[b] >= 0);
            assert(avg[b] >= 0);
        }
    }

    function calc_mask_index_l(gfc, max, avg, mask_idx) {
        var last_tab_entry = tab.length - 1;
        var b = 0;
        var a = avg[b] + avg[b + 1];
        assert(a >= 0);
        if (a > 0.0) {
            var m = max[b];
            if (m < max[b + 1])
                m = max[b + 1];
            assert((gfc.numlines_l[b] + gfc.numlines_l[b + 1] - 1) > 0);
            a = 20.0 * (m * 2.0 - a)
                / (a * (gfc.numlines_l[b] + gfc.numlines_l[b + 1] - 1));
            var k = 0 | a;
            if (k > last_tab_entry)
                k = last_tab_entry;
            mask_idx[b] = k;
        } else {
            mask_idx[b] = 0;
        }

        for (b = 1; b < gfc.npart_l - 1; b++) {
            a = avg[b - 1] + avg[b] + avg[b + 1];
            assert(a >= 0);
            if (a > 0.0) {
                var m = max[b - 1];
                if (m < max[b])
                    m = max[b];
                if (m < max[b + 1])
                    m = max[b + 1];
                assert((gfc.numlines_l[b - 1] + gfc.numlines_l[b] + gfc.numlines_l[b + 1] - 1) > 0);
                a = 20.0
                    * (m * 3.0 - a)
                    / (a * (gfc.numlines_l[b - 1] + gfc.numlines_l[b]
                    + gfc.numlines_l[b + 1] - 1));
                var k = 0 | a;
                if (k > last_tab_entry)
                    k = last_tab_entry;
                mask_idx[b] = k;
            } else {
                mask_idx[b] = 0;
            }
        }
        assert(b > 0);
        assert(b == gfc.npart_l - 1);

        a = avg[b - 1] + avg[b];
        assert(a >= 0);
        if (a > 0.0) {
            var m = max[b - 1];
            if (m < max[b])
                m = max[b];
            assert((gfc.numlines_l[b - 1] + gfc.numlines_l[b] - 1) > 0);
            a = 20.0 * (m * 2.0 - a)
                / (a * (gfc.numlines_l[b - 1] + gfc.numlines_l[b] - 1));
            var k = 0 | a;
            if (k > last_tab_entry)
                k = last_tab_entry;
            mask_idx[b] = k;
        } else {
            mask_idx[b] = 0;
        }
        assert(b == (gfc.npart_l - 1));
    }

    var fircoef = [
        -8.65163e-18 * 2, -0.00851586 * 2, -6.74764e-18 * 2, 0.0209036 * 2,
        -3.36639e-17 * 2, -0.0438162 * 2, -1.54175e-17 * 2, 0.0931738 * 2,
        -5.52212e-17 * 2, -0.313819 * 2
    ];

    this.L3psycho_anal_ns = function (gfp, buffer, bufPos, gr_out, masking_ratio, masking_MS_ratio, percep_entropy, percep_MS_entropy, energy, blocktype_d) {
        /*
         * to get a good cache performance, one has to think about the sequence,
         * in which the variables are used.
         */
        var gfc = gfp.internal_flags;

        /* fft and energy calculation */
        var wsamp_L = new_float_n([2, Encoder.BLKSIZE]);
        var wsamp_S = new_float_n([2, 3, Encoder.BLKSIZE_s]);

        /* convolution */
        var eb_l = new_float(Encoder.CBANDS + 1);
        var eb_s = new_float(Encoder.CBANDS + 1);
        var thr = new_float(Encoder.CBANDS + 2);

        /* block type */
        var blocktype = new_int(2), uselongblock = new_int(2);

        /* usual variables like loop indices, etc.. */
        var numchn, chn;
        var b, i, j, k;
        var sb, sblock;

        /* variables used for --nspsytune */
        var ns_hpfsmpl = new_float_n([2, 576]);
        var pcfact;
        var mask_idx_l = new_int(Encoder.CBANDS + 2), mask_idx_s = new_int(Encoder.CBANDS + 2);

        Arrays.fill(mask_idx_s, 0);

        numchn = gfc.channels_out;
        /* chn=2 and 3 = Mid and Side channels */
        if (gfp.mode == MPEGMode.JOINT_STEREO)
            numchn = 4;

        if (gfp.VBR == VbrMode.vbr_off)
            pcfact = gfc.ResvMax == 0 ? 0 : ( gfc.ResvSize)
            / gfc.ResvMax * 0.5;
        else if (gfp.VBR == VbrMode.vbr_rh || gfp.VBR == VbrMode.vbr_mtrh
            || gfp.VBR == VbrMode.vbr_mt) {
            pcfact = 0.6;
        } else
            pcfact = 1.0;

        /**********************************************************************
         * Apply HPF of fs/4 to the input signal. This is used for attack
         * detection / handling.
         **********************************************************************/
        /* Don't copy the input buffer into a temporary buffer */
        /* unroll the loop 2 times */
        for (chn = 0; chn < gfc.channels_out; chn++) {
            /* apply high pass filter of fs/4 */
            var firbuf = buffer[chn];
            var firbufPos = bufPos + 576 - 350 - NSFIRLEN + 192;
            assert(fircoef.length == ((NSFIRLEN - 1) / 2));
            for (i = 0; i < 576; i++) {
                var sum1, sum2;
                sum1 = firbuf[firbufPos + i + 10];
                sum2 = 0.0;
                for (j = 0; j < ((NSFIRLEN - 1) / 2) - 1; j += 2) {
                    sum1 += fircoef[j]
                        * (firbuf[firbufPos + i + j] + firbuf[firbufPos + i
                        + NSFIRLEN - j]);
                    sum2 += fircoef[j + 1]
                        * (firbuf[firbufPos + i + j + 1] + firbuf[firbufPos
                        + i + NSFIRLEN - j - 1]);
                }
                ns_hpfsmpl[chn][i] = sum1 + sum2;
            }
            masking_ratio[gr_out][chn].en.assign(gfc.en[chn]);
            masking_ratio[gr_out][chn].thm.assign(gfc.thm[chn]);
            if (numchn > 2) {
                /* MS maskings */
                /* percep_MS_entropy [chn-2] = gfc . pe [chn]; */
                masking_MS_ratio[gr_out][chn].en.assign(gfc.en[chn + 2]);
                masking_MS_ratio[gr_out][chn].thm.assign(gfc.thm[chn + 2]);
            }
        }

        for (chn = 0; chn < numchn; chn++) {
            var wsamp_l;
            var wsamp_s;
            var en_subshort = new_float(12);
            var en_short = [0, 0, 0, 0];
            var attack_intensity = new_float(12);
            var ns_uselongblock = 1;
            var attackThreshold;
            var max = new_float(Encoder.CBANDS), avg = new_float(Encoder.CBANDS);
            var ns_attacks = [0, 0, 0, 0];
            var fftenergy = new_float(Encoder.HBLKSIZE);
            var fftenergy_s = new_float_n([3, Encoder.HBLKSIZE_s]);

            /*
             * rh 20040301: the following loops do access one off the limits so
             * I increase the array dimensions by one and initialize the
             * accessed values to zero
             */
            assert(gfc.npart_s <= Encoder.CBANDS);
            assert(gfc.npart_l <= Encoder.CBANDS);

            /***************************************************************
             * determine the block type (window type)
             ***************************************************************/
            /* calculate energies of each sub-shortblocks */
            for (i = 0; i < 3; i++) {
                en_subshort[i] = gfc.nsPsy.last_en_subshort[chn][i + 6];
                assert(gfc.nsPsy.last_en_subshort[chn][i + 4] > 0);
                attack_intensity[i] = en_subshort[i]
                    / gfc.nsPsy.last_en_subshort[chn][i + 4];
                en_short[0] += en_subshort[i];
            }

            if (chn == 2) {
                for (i = 0; i < 576; i++) {
                    var l, r;
                    l = ns_hpfsmpl[0][i];
                    r = ns_hpfsmpl[1][i];
                    ns_hpfsmpl[0][i] = l + r;
                    ns_hpfsmpl[1][i] = l - r;
                }
            }
            {
                var pf = ns_hpfsmpl[chn & 1];
                var pfPos = 0;
                for (i = 0; i < 9; i++) {
                    var pfe = pfPos + 576 / 9;
                    var p = 1.;
                    for (; pfPos < pfe; pfPos++)
                        if (p < Math.abs(pf[pfPos]))
                            p = Math.abs(pf[pfPos]);

                    gfc.nsPsy.last_en_subshort[chn][i] = en_subshort[i + 3] = p;
                    en_short[1 + i / 3] += p;
                    if (p > en_subshort[i + 3 - 2]) {
                        assert(en_subshort[i + 3 - 2] > 0);
                        p = p / en_subshort[i + 3 - 2];
                    } else if (en_subshort[i + 3 - 2] > p * 10.0) {
                        assert(p > 0);
                        p = en_subshort[i + 3 - 2] / (p * 10.0);
                    } else
                        p = 0.0;
                    attack_intensity[i + 3] = p;
                }
            }

            if (gfp.analysis) {
                var x = attack_intensity[0];
                for (i = 1; i < 12; i++)
                    if (x < attack_intensity[i])
                        x = attack_intensity[i];
                gfc.pinfo.ers[gr_out][chn] = gfc.pinfo.ers_save[chn];
                gfc.pinfo.ers_save[chn] = x;
            }

            /* compare energies between sub-shortblocks */
            attackThreshold = (chn == 3) ? gfc.nsPsy.attackthre_s
                : gfc.nsPsy.attackthre;
            for (i = 0; i < 12; i++)
                if (0 == ns_attacks[i / 3]
                    && attack_intensity[i] > attackThreshold)
                    ns_attacks[i / 3] = (i % 3) + 1;

            /*
             * should have energy change between short blocks, in order to avoid
             * periodic signals
             */
            for (i = 1; i < 4; i++) {
                var ratio;
                if (en_short[i - 1] > en_short[i]) {
                    assert(en_short[i] > 0);
                    ratio = en_short[i - 1] / en_short[i];
                } else {
                    assert(en_short[i - 1] > 0);
                    ratio = en_short[i] / en_short[i - 1];
                }
                if (ratio < 1.7) {
                    ns_attacks[i] = 0;
                    if (i == 1)
                        ns_attacks[0] = 0;
                }
            }

            if (ns_attacks[0] != 0 && gfc.nsPsy.lastAttacks[chn] != 0)
                ns_attacks[0] = 0;

            if (gfc.nsPsy.lastAttacks[chn] == 3
                || (ns_attacks[0] + ns_attacks[1] + ns_attacks[2] + ns_attacks[3]) != 0) {
                ns_uselongblock = 0;

                if (ns_attacks[1] != 0 && ns_attacks[0] != 0)
                    ns_attacks[1] = 0;
                if (ns_attacks[2] != 0 && ns_attacks[1] != 0)
                    ns_attacks[2] = 0;
                if (ns_attacks[3] != 0 && ns_attacks[2] != 0)
                    ns_attacks[3] = 0;
            }

            if (chn < 2) {
                uselongblock[chn] = ns_uselongblock;
            } else {
                if (ns_uselongblock == 0) {
                    uselongblock[0] = uselongblock[1] = 0;
                }
            }

            /*
             * there is a one granule delay. Copy maskings computed last call
             * into masking_ratio to return to calling program.
             */
            energy[chn] = gfc.tot_ener[chn];

            /*********************************************************************
             * compute FFTs
             *********************************************************************/
            wsamp_s = wsamp_S;
            wsamp_l = wsamp_L;
            compute_ffts(gfp, fftenergy, fftenergy_s, wsamp_l, (chn & 1),
                wsamp_s, (chn & 1), gr_out, chn, buffer, bufPos);

            /*********************************************************************
             * Calculate the energy and the tonality of each partition.
             *********************************************************************/
            calc_energy(gfc, fftenergy, eb_l, max, avg);
            calc_mask_index_l(gfc, max, avg, mask_idx_l);
            /* compute masking thresholds for short blocks */
            for (sblock = 0; sblock < 3; sblock++) {
                var enn, thmm;
                compute_masking_s(gfp, fftenergy_s, eb_s, thr, chn, sblock);
                convert_partition2scalefac_s(gfc, eb_s, thr, chn, sblock);
                /**** short block pre-echo control ****/
                for (sb = 0; sb < Encoder.SBMAX_s; sb++) {
                    thmm = gfc.thm[chn].s[sb][sblock];

                    thmm *= NS_PREECHO_ATT0;
                    if (ns_attacks[sblock] >= 2 || ns_attacks[sblock + 1] == 1) {
                        var idx = (sblock != 0) ? sblock - 1 : 2;
                        var p = NS_INTERP(gfc.thm[chn].s[sb][idx], thmm,
                            NS_PREECHO_ATT1 * pcfact);
                        thmm = Math.min(thmm, p);
                    }

                    if (ns_attacks[sblock] == 1) {
                        var idx = (sblock != 0) ? sblock - 1 : 2;
                        var p = NS_INTERP(gfc.thm[chn].s[sb][idx], thmm,
                            NS_PREECHO_ATT2 * pcfact);
                        thmm = Math.min(thmm, p);
                    } else if ((sblock != 0 && ns_attacks[sblock - 1] == 3)
                        || (sblock == 0 && gfc.nsPsy.lastAttacks[chn] == 3)) {
                        var idx = (sblock != 2) ? sblock + 1 : 0;
                        var p = NS_INTERP(gfc.thm[chn].s[sb][idx], thmm,
                            NS_PREECHO_ATT2 * pcfact);
                        thmm = Math.min(thmm, p);
                    }

                    /* pulse like signal detection for fatboy.wav and so on */
                    enn = en_subshort[sblock * 3 + 3]
                        + en_subshort[sblock * 3 + 4]
                        + en_subshort[sblock * 3 + 5];
                    if (en_subshort[sblock * 3 + 5] * 6 < enn) {
                        thmm *= 0.5;
                        if (en_subshort[sblock * 3 + 4] * 6 < enn)
                            thmm *= 0.5;
                    }

                    gfc.thm[chn].s[sb][sblock] = thmm;
                }
            }
            gfc.nsPsy.lastAttacks[chn] = ns_attacks[2];

            /*********************************************************************
             * convolve the partitioned energy and unpredictability with the
             * spreading function, s3_l[b][k]
             ********************************************************************/
            k = 0;
            {
                for (b = 0; b < gfc.npart_l; b++) {
                    /*
                     * convolve the partitioned energy with the spreading
                     * function
                     */
                    var kk = gfc.s3ind[b][0];
                    var eb2 = eb_l[kk] * tab[mask_idx_l[kk]];
                    var ecb = gfc.s3_ll[k++] * eb2;
                    while (++kk <= gfc.s3ind[b][1]) {
                        eb2 = eb_l[kk] * tab[mask_idx_l[kk]];
                        ecb = mask_add(ecb, gfc.s3_ll[k++] * eb2, kk, kk - b,
                            gfc, 0);
                    }
                    ecb *= 0.158489319246111;
                    /* pow(10,-0.8) */

                    /**** long block pre-echo control ****/
                    /**
                     * <PRE>
                     * dont use long block pre-echo control if previous granule was
                     * a short block.  This is to avoid the situation:
                     * frame0:  quiet (very low masking)
                     * frame1:  surge  (triggers short blocks)
                     * frame2:  regular frame.  looks like pre-echo when compared to
                     *          frame0, but all pre-echo was in frame1.
                     * </PRE>
                     */
                    /*
                     * chn=0,1 L and R channels
                     *
                     * chn=2,3 S and M channels.
                     */

                    if (gfc.blocktype_old[chn & 1] == Encoder.SHORT_TYPE)
                        thr[b] = ecb;
                    else
                        thr[b] = NS_INTERP(
                            Math.min(ecb, Math.min(rpelev
                                * gfc.nb_1[chn][b], rpelev2
                                * gfc.nb_2[chn][b])), ecb, pcfact);

                    gfc.nb_2[chn][b] = gfc.nb_1[chn][b];
                    gfc.nb_1[chn][b] = ecb;
                }
            }
            for (; b <= Encoder.CBANDS; ++b) {
                eb_l[b] = 0;
                thr[b] = 0;
            }
            /* compute masking thresholds for long blocks */
            convert_partition2scalefac_l(gfc, eb_l, thr, chn);
        }
        /* end loop over chn */

        if (gfp.mode == MPEGMode.STEREO || gfp.mode == MPEGMode.JOINT_STEREO) {
            if (gfp.interChRatio > 0.0) {
                calc_interchannel_masking(gfp, gfp.interChRatio);
            }
        }

        if (gfp.mode == MPEGMode.JOINT_STEREO) {
            var msfix;
            msfix1(gfc);
            msfix = gfp.msfix;
            if (Math.abs(msfix) > 0.0)
                ns_msfix(gfc, msfix, gfp.ATHlower * gfc.ATH.adjust);
        }

        /***************************************************************
         * determine final block type
         ***************************************************************/
        block_type_set(gfp, uselongblock, blocktype_d, blocktype);

        /*********************************************************************
         * compute the value of PE to return ... no delay and advance
         *********************************************************************/
        for (chn = 0; chn < numchn; chn++) {
            var ppe;
            var ppePos = 0;
            var type;
            var mr;

            if (chn > 1) {
                ppe = percep_MS_entropy;
                ppePos = -2;
                type = Encoder.NORM_TYPE;
                if (blocktype_d[0] == Encoder.SHORT_TYPE
                    || blocktype_d[1] == Encoder.SHORT_TYPE)
                    type = Encoder.SHORT_TYPE;
                mr = masking_MS_ratio[gr_out][chn - 2];
            } else {
                ppe = percep_entropy;
                ppePos = 0;
                type = blocktype_d[chn];
                mr = masking_ratio[gr_out][chn];
            }

            if (type == Encoder.SHORT_TYPE)
                ppe[ppePos + chn] = pecalc_s(mr, gfc.masking_lower);
            else
                ppe[ppePos + chn] = pecalc_l(mr, gfc.masking_lower);

            if (gfp.analysis)
                gfc.pinfo.pe[gr_out][chn] = ppe[ppePos + chn];

        }
        return 0;
    }

    function vbrpsy_compute_fft_l(gfp, buffer, bufPos, chn, gr_out, fftenergy, wsamp_l, wsamp_lPos) {
        var gfc = gfp.internal_flags;
        if (chn < 2) {
            fft.fft_long(gfc, wsamp_l[wsamp_lPos], chn, buffer, bufPos);
        } else if (chn == 2) {
            /* FFT data for mid and side channel is derived from L & R */
            for (var j = Encoder.BLKSIZE - 1; j >= 0; --j) {
                var l = wsamp_l[wsamp_lPos + 0][j];
                var r = wsamp_l[wsamp_lPos + 1][j];
                wsamp_l[wsamp_lPos + 0][j] = (l + r) * Util.SQRT2 * 0.5;
                wsamp_l[wsamp_lPos + 1][j] = (l - r) * Util.SQRT2 * 0.5;
            }
        }

        /*********************************************************************
         * compute energies
         *********************************************************************/
        fftenergy[0] = NON_LINEAR_SCALE_ENERGY(wsamp_l[wsamp_lPos + 0][0]);
        fftenergy[0] *= fftenergy[0];

        for (var j = Encoder.BLKSIZE / 2 - 1; j >= 0; --j) {
            var re = wsamp_l[wsamp_lPos + 0][Encoder.BLKSIZE / 2 - j];
            var im = wsamp_l[wsamp_lPos + 0][Encoder.BLKSIZE / 2 + j];
            fftenergy[Encoder.BLKSIZE / 2 - j] = NON_LINEAR_SCALE_ENERGY((re
                * re + im * im) * 0.5);
        }
        /* total energy */
        {
            var totalenergy = 0.0;
            for (var j = 11; j < Encoder.HBLKSIZE; j++)
                totalenergy += fftenergy[j];

            gfc.tot_ener[chn] = totalenergy;
        }

        if (gfp.analysis) {
            for (var j = 0; j < Encoder.HBLKSIZE; j++) {
                gfc.pinfo.energy[gr_out][chn][j] = gfc.pinfo.energy_save[chn][j];
                gfc.pinfo.energy_save[chn][j] = fftenergy[j];
            }
            gfc.pinfo.pe[gr_out][chn] = gfc.pe[chn];
        }
    }

    function vbrpsy_compute_fft_s(gfp, buffer, bufPos, chn, sblock, fftenergy_s, wsamp_s, wsamp_sPos) {
        var gfc = gfp.internal_flags;

        if (sblock == 0 && chn < 2) {
            fft.fft_short(gfc, wsamp_s[wsamp_sPos], chn, buffer, bufPos);
        }
        if (chn == 2) {
            /* FFT data for mid and side channel is derived from L & R */
            for (var j = Encoder.BLKSIZE_s - 1; j >= 0; --j) {
                var l = wsamp_s[wsamp_sPos + 0][sblock][j];
                var r = wsamp_s[wsamp_sPos + 1][sblock][j];
                wsamp_s[wsamp_sPos + 0][sblock][j] = (l + r) * Util.SQRT2 * 0.5;
                wsamp_s[wsamp_sPos + 1][sblock][j] = (l - r) * Util.SQRT2 * 0.5;
            }
        }

        /*********************************************************************
         * compute energies
         *********************************************************************/
        fftenergy_s[sblock][0] = wsamp_s[wsamp_sPos + 0][sblock][0];
        fftenergy_s[sblock][0] *= fftenergy_s[sblock][0];
        for (var j = Encoder.BLKSIZE_s / 2 - 1; j >= 0; --j) {
            var re = wsamp_s[wsamp_sPos + 0][sblock][Encoder.BLKSIZE_s / 2 - j];
            var im = wsamp_s[wsamp_sPos + 0][sblock][Encoder.BLKSIZE_s / 2 + j];
            fftenergy_s[sblock][Encoder.BLKSIZE_s / 2 - j] = NON_LINEAR_SCALE_ENERGY((re
                * re + im * im) * 0.5);
        }
    }

    /**
     * compute loudness approximation (used for ATH auto-level adjustment)
     */
    function vbrpsy_compute_loudness_approximation_l(gfp, gr_out, chn, fftenergy) {
        var gfc = gfp.internal_flags;
        if (gfp.athaa_loudapprox == 2 && chn < 2) {
            // no loudness for mid/side ch
            gfc.loudness_sq[gr_out][chn] = gfc.loudness_sq_save[chn];
            gfc.loudness_sq_save[chn] = psycho_loudness_approx(fftenergy, gfc);
        }
    }

    var fircoef_ = [-8.65163e-18 * 2,
        -0.00851586 * 2, -6.74764e-18 * 2, 0.0209036 * 2,
        -3.36639e-17 * 2, -0.0438162 * 2, -1.54175e-17 * 2,
        0.0931738 * 2, -5.52212e-17 * 2, -0.313819 * 2];

    /**
     * Apply HPF of fs/4 to the input signal. This is used for attack detection
     * / handling.
     */
    function vbrpsy_attack_detection(gfp, buffer, bufPos, gr_out, masking_ratio, masking_MS_ratio, energy, sub_short_factor, ns_attacks, uselongblock) {
        var ns_hpfsmpl = new_float_n([2, 576]);
        var gfc = gfp.internal_flags;
        var n_chn_out = gfc.channels_out;
        /* chn=2 and 3 = Mid and Side channels */
        var n_chn_psy = (gfp.mode == MPEGMode.JOINT_STEREO) ? 4 : n_chn_out;
        /* Don't copy the input buffer into a temporary buffer */
        /* unroll the loop 2 times */
        for (var chn = 0; chn < n_chn_out; chn++) {
            /* apply high pass filter of fs/4 */
            firbuf = buffer[chn];
            var firbufPos = bufPos + 576 - 350 - NSFIRLEN + 192;
            assert(fircoef_.length == ((NSFIRLEN - 1) / 2));
            for (var i = 0; i < 576; i++) {
                var sum1, sum2;
                sum1 = firbuf[firbufPos + i + 10];
                sum2 = 0.0;
                for (var j = 0; j < ((NSFIRLEN - 1) / 2) - 1; j += 2) {
                    sum1 += fircoef_[j]
                        * (firbuf[firbufPos + i + j] + firbuf[firbufPos + i
                        + NSFIRLEN - j]);
                    sum2 += fircoef_[j + 1]
                        * (firbuf[firbufPos + i + j + 1] + firbuf[firbufPos
                        + i + NSFIRLEN - j - 1]);
                }
                ns_hpfsmpl[chn][i] = sum1 + sum2;
            }
            masking_ratio[gr_out][chn].en.assign(gfc.en[chn]);
            masking_ratio[gr_out][chn].thm.assign(gfc.thm[chn]);
            if (n_chn_psy > 2) {
                /* MS maskings */
                /* percep_MS_entropy [chn-2] = gfc . pe [chn]; */
                masking_MS_ratio[gr_out][chn].en.assign(gfc.en[chn + 2]);
                masking_MS_ratio[gr_out][chn].thm.assign(gfc.thm[chn + 2]);
            }
        }
        for (var chn = 0; chn < n_chn_psy; chn++) {
            var attack_intensity = new_float(12);
            var en_subshort = new_float(12);
            var en_short = [0, 0, 0, 0];
            var pf = ns_hpfsmpl[chn & 1];
            var pfPos = 0;
            var attackThreshold = (chn == 3) ? gfc.nsPsy.attackthre_s
                : gfc.nsPsy.attackthre;
            var ns_uselongblock = 1;

            if (chn == 2) {
                for (var i = 0, j = 576; j > 0; ++i, --j) {
                    var l = ns_hpfsmpl[0][i];
                    var r = ns_hpfsmpl[1][i];
                    ns_hpfsmpl[0][i] = l + r;
                    ns_hpfsmpl[1][i] = l - r;
                }
            }
            /***************************************************************
             * determine the block type (window type)
             ***************************************************************/
            /* calculate energies of each sub-shortblocks */
            for (var i = 0; i < 3; i++) {
                en_subshort[i] = gfc.nsPsy.last_en_subshort[chn][i + 6];
                assert(gfc.nsPsy.last_en_subshort[chn][i + 4] > 0);
                attack_intensity[i] = en_subshort[i]
                    / gfc.nsPsy.last_en_subshort[chn][i + 4];
                en_short[0] += en_subshort[i];
            }

            for (var i = 0; i < 9; i++) {
                var pfe = pfPos + 576 / 9;
                var p = 1.;
                for (; pfPos < pfe; pfPos++)
                    if (p < Math.abs(pf[pfPos]))
                        p = Math.abs(pf[pfPos]);

                gfc.nsPsy.last_en_subshort[chn][i] = en_subshort[i + 3] = p;
                en_short[1 + i / 3] += p;
                if (p > en_subshort[i + 3 - 2]) {
                    assert(en_subshort[i + 3 - 2] > 0);
                    p = p / en_subshort[i + 3 - 2];
                } else if (en_subshort[i + 3 - 2] > p * 10.0) {
                    assert(p > 0);
                    p = en_subshort[i + 3 - 2] / (p * 10.0);
                } else {
                    p = 0.0;
                }
                attack_intensity[i + 3] = p;
            }
            /* pulse like signal detection for fatboy.wav and so on */
            for (var i = 0; i < 3; ++i) {
                var enn = en_subshort[i * 3 + 3]
                    + en_subshort[i * 3 + 4] + en_subshort[i * 3 + 5];
                var factor = 1.;
                if (en_subshort[i * 3 + 5] * 6 < enn) {
                    factor *= 0.5;
                    if (en_subshort[i * 3 + 4] * 6 < enn) {
                        factor *= 0.5;
                    }
                }
                sub_short_factor[chn][i] = factor;
            }

            if (gfp.analysis) {
                var x = attack_intensity[0];
                for (var i = 1; i < 12; i++) {
                    if (x < attack_intensity[i]) {
                        x = attack_intensity[i];
                    }
                }
                gfc.pinfo.ers[gr_out][chn] = gfc.pinfo.ers_save[chn];
                gfc.pinfo.ers_save[chn] = x;
            }

            /* compare energies between sub-shortblocks */
            for (var i = 0; i < 12; i++) {
                if (0 == ns_attacks[chn][i / 3]
                    && attack_intensity[i] > attackThreshold) {
                    ns_attacks[chn][i / 3] = (i % 3) + 1;
                }
            }

            /*
             * should have energy change between short blocks, in order to avoid
             * periodic signals
             */
            /* Good samples to show the effect are Trumpet test songs */
            /*
             * GB: tuned (1) to avoid too many short blocks for test sample
             * TRUMPET
             */
            /*
             * RH: tuned (2) to let enough short blocks through for test sample
             * FSOL and SNAPS
             */
            for (var i = 1; i < 4; i++) {
                var u = en_short[i - 1];
                var v = en_short[i];
                var m = Math.max(u, v);
                if (m < 40000) { /* (2) */
                    if (u < 1.7 * v && v < 1.7 * u) { /* (1) */
                        if (i == 1 && ns_attacks[chn][0] <= ns_attacks[chn][i]) {
                            ns_attacks[chn][0] = 0;
                        }
                        ns_attacks[chn][i] = 0;
                    }
                }
            }

            if (ns_attacks[chn][0] <= gfc.nsPsy.lastAttacks[chn]) {
                ns_attacks[chn][0] = 0;
            }

            if (gfc.nsPsy.lastAttacks[chn] == 3
                || (ns_attacks[chn][0] + ns_attacks[chn][1]
                + ns_attacks[chn][2] + ns_attacks[chn][3]) != 0) {
                ns_uselongblock = 0;

                if (ns_attacks[chn][1] != 0 && ns_attacks[chn][0] != 0) {
                    ns_attacks[chn][1] = 0;
                }
                if (ns_attacks[chn][2] != 0 && ns_attacks[chn][1] != 0) {
                    ns_attacks[chn][2] = 0;
                }
                if (ns_attacks[chn][3] != 0 && ns_attacks[chn][2] != 0) {
                    ns_attacks[chn][3] = 0;
                }
            }
            if (chn < 2) {
                uselongblock[chn] = ns_uselongblock;
            } else {
                if (ns_uselongblock == 0) {
                    uselongblock[0] = uselongblock[1] = 0;
                }
            }

            /*
             * there is a one granule delay. Copy maskings computed last call
             * into masking_ratio to return to calling program.
             */
            energy[chn] = gfc.tot_ener[chn];
        }
    }

    function vbrpsy_skip_masking_s(gfc, chn, sblock) {
        if (sblock == 0) {
            for (var b = 0; b < gfc.npart_s; b++) {
                gfc.nb_s2[chn][b] = gfc.nb_s1[chn][b];
                gfc.nb_s1[chn][b] = 0;
            }
        }
    }

    function vbrpsy_skip_masking_l(gfc, chn) {
        for (var b = 0; b < gfc.npart_l; b++) {
            gfc.nb_2[chn][b] = gfc.nb_1[chn][b];
            gfc.nb_1[chn][b] = 0;
        }
    }

    function psyvbr_calc_mask_index_s(gfc, max, avg, mask_idx) {
        var last_tab_entry = tab.length - 1;
        var b = 0;
        var a = avg[b] + avg[b + 1];
        assert(a >= 0);
        if (a > 0.0) {
            var m = max[b];
            if (m < max[b + 1])
                m = max[b + 1];
            assert((gfc.numlines_s[b] + gfc.numlines_s[b + 1] - 1) > 0);
            a = 20.0 * (m * 2.0 - a)
                / (a * (gfc.numlines_s[b] + gfc.numlines_s[b + 1] - 1));
            var k = 0 | a;
            if (k > last_tab_entry)
                k = last_tab_entry;
            mask_idx[b] = k;
        } else {
            mask_idx[b] = 0;
        }

        for (b = 1; b < gfc.npart_s - 1; b++) {
            a = avg[b - 1] + avg[b] + avg[b + 1];
            assert(b + 1 < gfc.npart_s);
            assert(a >= 0);
            if (a > 0.0) {
                var m = max[b - 1];
                if (m < max[b])
                    m = max[b];
                if (m < max[b + 1])
                    m = max[b + 1];
                assert((gfc.numlines_s[b - 1] + gfc.numlines_s[b] + gfc.numlines_s[b + 1] - 1) > 0);
                a = 20.0
                    * (m * 3.0 - a)
                    / (a * (gfc.numlines_s[b - 1] + gfc.numlines_s[b]
                    + gfc.numlines_s[b + 1] - 1));
                var k = 0 | a;
                if (k > last_tab_entry)
                    k = last_tab_entry;
                mask_idx[b] = k;
            } else {
                mask_idx[b] = 0;
            }
        }
        assert(b > 0);
        assert(b == gfc.npart_s - 1);

        a = avg[b - 1] + avg[b];
        assert(a >= 0);
        if (a > 0.0) {
            var m = max[b - 1];
            if (m < max[b])
                m = max[b];
            assert((gfc.numlines_s[b - 1] + gfc.numlines_s[b] - 1) > 0);
            a = 20.0 * (m * 2.0 - a)
                / (a * (gfc.numlines_s[b - 1] + gfc.numlines_s[b] - 1));
            var k = 0 | a;
            if (k > last_tab_entry)
                k = last_tab_entry;
            mask_idx[b] = k;
        } else {
            mask_idx[b] = 0;
        }
        assert(b == (gfc.npart_s - 1));
    }

    function vbrpsy_compute_masking_s(gfp, fftenergy_s, eb, thr, chn, sblock) {
        var gfc = gfp.internal_flags;
        var max = new float[Encoder.CBANDS], avg = new_float(Encoder.CBANDS);
        var i, j, b;
        var mask_idx_s = new int[Encoder.CBANDS];

        for (b = j = 0; b < gfc.npart_s; ++b) {
            var ebb = 0, m = 0;
            var n = gfc.numlines_s[b];
            for (i = 0; i < n; ++i, ++j) {
                var el = fftenergy_s[sblock][j];
                ebb += el;
                if (m < el)
                    m = el;
            }
            eb[b] = ebb;
            assert(ebb >= 0);
            max[b] = m;
            assert(n > 0);
            avg[b] = ebb / n;
            assert(avg[b] >= 0);
        }
        assert(b == gfc.npart_s);
        assert(j == 129);
        for (; b < Encoder.CBANDS; ++b) {
            max[b] = 0;
            avg[b] = 0;
        }
        psyvbr_calc_mask_index_s(gfc, max, avg, mask_idx_s);
        for (j = b = 0; b < gfc.npart_s; b++) {
            var kk = gfc.s3ind_s[b][0];
            var last = gfc.s3ind_s[b][1];
            var dd, dd_n;
            var x, ecb, avg_mask;
            dd = mask_idx_s[kk];
            dd_n = 1;
            ecb = gfc.s3_ss[j] * eb[kk] * tab[mask_idx_s[kk]];
            ++j;
            ++kk;
            while (kk <= last) {
                dd += mask_idx_s[kk];
                dd_n += 1;
                x = gfc.s3_ss[j] * eb[kk] * tab[mask_idx_s[kk]];
                ecb = vbrpsy_mask_add(ecb, x, kk - b);
                ++j;
                ++kk;
            }
            dd = (1 + 2 * dd) / (2 * dd_n);
            avg_mask = tab[dd] * 0.5;
            ecb *= avg_mask;
            thr[b] = ecb;
            gfc.nb_s2[chn][b] = gfc.nb_s1[chn][b];
            gfc.nb_s1[chn][b] = ecb;
            {
                /*
                 * if THR exceeds EB, the quantization routines will take the
                 * difference from other bands. in case of strong tonal samples
                 * (tonaltest.wav) this leads to heavy distortions. that's why
                 * we limit THR here.
                 */
                x = max[b];
                x *= gfc.minval_s[b];
                x *= avg_mask;
                if (thr[b] > x) {
                    thr[b] = x;
                }
            }
            if (gfc.masking_lower > 1) {
                thr[b] *= gfc.masking_lower;
            }
            if (thr[b] > eb[b]) {
                thr[b] = eb[b];
            }
            if (gfc.masking_lower < 1) {
                thr[b] *= gfc.masking_lower;
            }

            assert(thr[b] >= 0);
        }
        for (; b < Encoder.CBANDS; ++b) {
            eb[b] = 0;
            thr[b] = 0;
        }
    }

    function vbrpsy_compute_masking_l(gfc, fftenergy, eb_l, thr, chn) {
        var max = new_float(Encoder.CBANDS), avg = new_float(Encoder.CBANDS);
        var mask_idx_l = new_int(Encoder.CBANDS + 2);
        var b;

        /*********************************************************************
         * Calculate the energy and the tonality of each partition.
         *********************************************************************/
        calc_energy(gfc, fftenergy, eb_l, max, avg);
        calc_mask_index_l(gfc, max, avg, mask_idx_l);

        /*********************************************************************
         * convolve the partitioned energy and unpredictability with the
         * spreading function, s3_l[b][k]
         ********************************************************************/
        var k = 0;
        for (b = 0; b < gfc.npart_l; b++) {
            var x, ecb, avg_mask, t;
            /* convolve the partitioned energy with the spreading function */
            var kk = gfc.s3ind[b][0];
            var last = gfc.s3ind[b][1];
            var dd = 0, dd_n = 0;
            dd = mask_idx_l[kk];
            dd_n += 1;
            ecb = gfc.s3_ll[k] * eb_l[kk] * tab[mask_idx_l[kk]];
            ++k;
            ++kk;
            while (kk <= last) {
                dd += mask_idx_l[kk];
                dd_n += 1;
                x = gfc.s3_ll[k] * eb_l[kk] * tab[mask_idx_l[kk]];
                t = vbrpsy_mask_add(ecb, x, kk - b);
                ecb = t;
                ++k;
                ++kk;
            }
            dd = (1 + 2 * dd) / (2 * dd_n);
            avg_mask = tab[dd] * 0.5;
            ecb *= avg_mask;

            /**** long block pre-echo control ****/
            /**
             * <PRE>
             * dont use long block pre-echo control if previous granule was
             * a short block.  This is to avoid the situation:
             * frame0:  quiet (very low masking)
             * frame1:  surge  (triggers short blocks)
             * frame2:  regular frame.  looks like pre-echo when compared to
             *          frame0, but all pre-echo was in frame1.
             * </PRE>
             */
            /*
             * chn=0,1 L and R channels chn=2,3 S and M channels.
             */
            if (gfc.blocktype_old[chn & 0x01] == Encoder.SHORT_TYPE) {
                var ecb_limit = rpelev * gfc.nb_1[chn][b];
                if (ecb_limit > 0) {
                    thr[b] = Math.min(ecb, ecb_limit);
                } else {
                    /**
                     * <PRE>
                     * Robert 071209:
                     * Because we don't calculate long block psy when we know a granule
                     * should be of short blocks, we don't have any clue how the granule
                     * before would have looked like as a long block. So we have to guess
                     * a little bit for this END_TYPE block.
                     * Most of the time we get away with this sloppyness. (fingers crossed :)
                     * The speed increase is worth it.
                     * </PRE>
                     */
                    thr[b] = Math.min(ecb, eb_l[b] * NS_PREECHO_ATT2);
                }
            } else {
                var ecb_limit_2 = rpelev2 * gfc.nb_2[chn][b];
                var ecb_limit_1 = rpelev * gfc.nb_1[chn][b];
                var ecb_limit;
                if (ecb_limit_2 <= 0) {
                    ecb_limit_2 = ecb;
                }
                if (ecb_limit_1 <= 0) {
                    ecb_limit_1 = ecb;
                }
                if (gfc.blocktype_old[chn & 0x01] == Encoder.NORM_TYPE) {
                    ecb_limit = Math.min(ecb_limit_1, ecb_limit_2);
                } else {
                    ecb_limit = ecb_limit_1;
                }
                thr[b] = Math.min(ecb, ecb_limit);
            }
            gfc.nb_2[chn][b] = gfc.nb_1[chn][b];
            gfc.nb_1[chn][b] = ecb;
            {
                /*
                 * if THR exceeds EB, the quantization routines will take the
                 * difference from other bands. in case of strong tonal samples
                 * (tonaltest.wav) this leads to heavy distortions. that's why
                 * we limit THR here.
                 */
                x = max[b];
                x *= gfc.minval_l[b];
                x *= avg_mask;
                if (thr[b] > x) {
                    thr[b] = x;
                }
            }
            if (gfc.masking_lower > 1) {
                thr[b] *= gfc.masking_lower;
            }
            if (thr[b] > eb_l[b]) {
                thr[b] = eb_l[b];
            }
            if (gfc.masking_lower < 1) {
                thr[b] *= gfc.masking_lower;
            }
            assert(thr[b] >= 0);
        }
        for (; b < Encoder.CBANDS; ++b) {
            eb_l[b] = 0;
            thr[b] = 0;
        }
    }

    function vbrpsy_compute_block_type(gfp, uselongblock) {
        var gfc = gfp.internal_flags;

        if (gfp.short_blocks == ShortBlock.short_block_coupled
                /* force both channels to use the same block type */
                /* this is necessary if the frame is to be encoded in ms_stereo. */
                /* But even without ms_stereo, FhG does this */
            && !(uselongblock[0] != 0 && uselongblock[1] != 0))
            uselongblock[0] = uselongblock[1] = 0;

        for (var chn = 0; chn < gfc.channels_out; chn++) {
            /* disable short blocks */
            if (gfp.short_blocks == ShortBlock.short_block_dispensed) {
                uselongblock[chn] = 1;
            }
            if (gfp.short_blocks == ShortBlock.short_block_forced) {
                uselongblock[chn] = 0;
            }
        }
    }

    function vbrpsy_apply_block_type(gfp, uselongblock, blocktype_d) {
        var gfc = gfp.internal_flags;

        /*
         * update the blocktype of the previous granule, since it depends on
         * what happend in this granule
         */
        for (var chn = 0; chn < gfc.channels_out; chn++) {
            var blocktype = Encoder.NORM_TYPE;
            /* disable short blocks */

            if (uselongblock[chn] != 0) {
                /* no attack : use long blocks */
                assert(gfc.blocktype_old[chn] != Encoder.START_TYPE);
                if (gfc.blocktype_old[chn] == Encoder.SHORT_TYPE)
                    blocktype = Encoder.STOP_TYPE;
            } else {
                /* attack : use short blocks */
                blocktype = Encoder.SHORT_TYPE;
                if (gfc.blocktype_old[chn] == Encoder.NORM_TYPE) {
                    gfc.blocktype_old[chn] = Encoder.START_TYPE;
                }
                if (gfc.blocktype_old[chn] == Encoder.STOP_TYPE)
                    gfc.blocktype_old[chn] = Encoder.SHORT_TYPE;
            }

            blocktype_d[chn] = gfc.blocktype_old[chn];
            // value returned to calling program
            gfc.blocktype_old[chn] = blocktype;
            // save for next call to l3psy_anal
        }
    }

    /**
     * compute M/S thresholds from Johnston & Ferreira 1992 ICASSP paper
     */
    function vbrpsy_compute_MS_thresholds(eb, thr, cb_mld, ath_cb, athadjust, msfix, n) {
        var msfix2 = msfix * 2;
        var athlower = msfix > 0 ? Math.pow(10, athadjust) : 1;
        var rside, rmid;
        for (var b = 0; b < n; ++b) {
            var ebM = eb[2][b];
            var ebS = eb[3][b];
            var thmL = thr[0][b];
            var thmR = thr[1][b];
            var thmM = thr[2][b];
            var thmS = thr[3][b];

            /* use this fix if L & R masking differs by 2db or less */
            if (thmL <= 1.58 * thmR && thmR <= 1.58 * thmL) {
                var mld_m = cb_mld[b] * ebS;
                var mld_s = cb_mld[b] * ebM;
                rmid = Math.max(thmM, Math.min(thmS, mld_m));
                rside = Math.max(thmS, Math.min(thmM, mld_s));
            } else {
                rmid = thmM;
                rside = thmS;
            }
            if (msfix > 0) {
                /***************************************************************/
                /* Adjust M/S maskings if user set "msfix" */
                /***************************************************************/
                /* Naoki Shibata 2000 */
                var thmLR, thmMS;
                var ath = ath_cb[b] * athlower;
                thmLR = Math.min(Math.max(thmL, ath), Math.max(thmR, ath));
                thmM = Math.max(rmid, ath);
                thmS = Math.max(rside, ath);
                thmMS = thmM + thmS;
                if (thmMS > 0 && (thmLR * msfix2) < thmMS) {
                    var f = thmLR * msfix2 / thmMS;
                    thmM *= f;
                    thmS *= f;
                    assert(thmMS > 0);
                }
                rmid = Math.min(thmM, rmid);
                rside = Math.min(thmS, rside);
            }
            if (rmid > ebM) {
                rmid = ebM;
            }
            if (rside > ebS) {
                rside = ebS;
            }
            thr[2][b] = rmid;
            thr[3][b] = rside;
        }
    }

    this.L3psycho_anal_vbr = function (gfp, buffer, bufPos, gr_out, masking_ratio, masking_MS_ratio, percep_entropy, percep_MS_entropy, energy, blocktype_d) {
        var gfc = gfp.internal_flags;

        /* fft and energy calculation */
        var wsamp_l;
        var wsamp_s;
        var fftenergy = new_float(Encoder.HBLKSIZE);
        var fftenergy_s = new_float_n([3, Encoder.HBLKSIZE_s]);
        var wsamp_L = new_float_n([2, Encoder.BLKSIZE]);
        var wsamp_S = new_float_n([2, 3, Encoder.BLKSIZE_s]);
        var eb = new_float_n([4, Encoder.CBANDS]), thr = new_float_n([4, Encoder.CBANDS]);
        var sub_short_factor = new_float_n([4, 3]);
        var pcfact = 0.6;

        /* block type */
        var ns_attacks = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
            [0, 0, 0, 0]];
        var uselongblock = new_int(2);

        /* usual variables like loop indices, etc.. */

        /* chn=2 and 3 = Mid and Side channels */
        var n_chn_psy = (gfp.mode == MPEGMode.JOINT_STEREO) ? 4
            : gfc.channels_out;

        vbrpsy_attack_detection(gfp, buffer, bufPos, gr_out, masking_ratio,
            masking_MS_ratio, energy, sub_short_factor, ns_attacks,
            uselongblock);

        vbrpsy_compute_block_type(gfp, uselongblock);

        /* LONG BLOCK CASE */
        {
            for (var chn = 0; chn < n_chn_psy; chn++) {
                var ch01 = chn & 0x01;
                wsamp_l = wsamp_L;
                vbrpsy_compute_fft_l(gfp, buffer, bufPos, chn, gr_out,
                    fftenergy, wsamp_l, ch01);

                vbrpsy_compute_loudness_approximation_l(gfp, gr_out, chn,
                    fftenergy);

                if (uselongblock[ch01] != 0) {
                    vbrpsy_compute_masking_l(gfc, fftenergy, eb[chn], thr[chn],
                        chn);
                } else {
                    vbrpsy_skip_masking_l(gfc, chn);
                }
            }
            if ((uselongblock[0] + uselongblock[1]) == 2) {
                /* M/S channel */
                if (gfp.mode == MPEGMode.JOINT_STEREO) {
                    vbrpsy_compute_MS_thresholds(eb, thr, gfc.mld_cb_l,
                        gfc.ATH.cb_l, gfp.ATHlower * gfc.ATH.adjust,
                        gfp.msfix, gfc.npart_l);
                }
            }
            /* TODO: apply adaptive ATH masking here ?? */
            for (var chn = 0; chn < n_chn_psy; chn++) {
                var ch01 = chn & 0x01;
                if (uselongblock[ch01] != 0) {
                    convert_partition2scalefac_l(gfc, eb[chn], thr[chn], chn);
                }
            }
        }

        /* SHORT BLOCKS CASE */
        {
            for (var sblock = 0; sblock < 3; sblock++) {
                for (var chn = 0; chn < n_chn_psy; ++chn) {
                    var ch01 = chn & 0x01;

                    if (uselongblock[ch01] != 0) {
                        vbrpsy_skip_masking_s(gfc, chn, sblock);
                    } else {
                        /* compute masking thresholds for short blocks */
                        wsamp_s = wsamp_S;
                        vbrpsy_compute_fft_s(gfp, buffer, bufPos, chn, sblock,
                            fftenergy_s, wsamp_s, ch01);
                        vbrpsy_compute_masking_s(gfp, fftenergy_s, eb[chn],
                            thr[chn], chn, sblock);
                    }
                }
                if ((uselongblock[0] + uselongblock[1]) == 0) {
                    /* M/S channel */
                    if (gfp.mode == MPEGMode.JOINT_STEREO) {
                        vbrpsy_compute_MS_thresholds(eb, thr, gfc.mld_cb_s,
                            gfc.ATH.cb_s, gfp.ATHlower * gfc.ATH.adjust,
                            gfp.msfix, gfc.npart_s);
                    }
                    /* L/R channel */
                }
                /* TODO: apply adaptive ATH masking here ?? */
                for (var chn = 0; chn < n_chn_psy; ++chn) {
                    var ch01 = chn & 0x01;
                    if (0 == uselongblock[ch01]) {
                        convert_partition2scalefac_s(gfc, eb[chn], thr[chn],
                            chn, sblock);
                    }
                }
            }

            /**** short block pre-echo control ****/
            for (var chn = 0; chn < n_chn_psy; chn++) {
                var ch01 = chn & 0x01;

                if (uselongblock[ch01] != 0) {
                    continue;
                }
                for (var sb = 0; sb < Encoder.SBMAX_s; sb++) {
                    var new_thmm = new_float(3);
                    for (var sblock = 0; sblock < 3; sblock++) {
                        var thmm = gfc.thm[chn].s[sb][sblock];
                        thmm *= NS_PREECHO_ATT0;

                        if (ns_attacks[chn][sblock] >= 2
                            || ns_attacks[chn][sblock + 1] == 1) {
                            var idx = (sblock != 0) ? sblock - 1 : 2;
                            var p = NS_INTERP(gfc.thm[chn].s[sb][idx], thmm,
                                NS_PREECHO_ATT1 * pcfact);
                            thmm = Math.min(thmm, p);
                        } else if (ns_attacks[chn][sblock] == 1) {
                            var idx = (sblock != 0) ? sblock - 1 : 2;
                            var p = NS_INTERP(gfc.thm[chn].s[sb][idx], thmm,
                                NS_PREECHO_ATT2 * pcfact);
                            thmm = Math.min(thmm, p);
                        } else if ((sblock != 0 && ns_attacks[chn][sblock - 1] == 3)
                            || (sblock == 0 && gfc.nsPsy.lastAttacks[chn] == 3)) {
                            var idx = (sblock != 2) ? sblock + 1 : 0;
                            var p = NS_INTERP(gfc.thm[chn].s[sb][idx], thmm,
                                NS_PREECHO_ATT2 * pcfact);
                            thmm = Math.min(thmm, p);
                        }

                        /* pulse like signal detection for fatboy.wav and so on */
                        thmm *= sub_short_factor[chn][sblock];

                        new_thmm[sblock] = thmm;
                    }
                    for (var sblock = 0; sblock < 3; sblock++) {
                        gfc.thm[chn].s[sb][sblock] = new_thmm[sblock];
                    }
                }
            }
        }
        for (var chn = 0; chn < n_chn_psy; chn++) {
            gfc.nsPsy.lastAttacks[chn] = ns_attacks[chn][2];
        }

        /***************************************************************
         * determine final block type
         ***************************************************************/
        vbrpsy_apply_block_type(gfp, uselongblock, blocktype_d);

        /*********************************************************************
         * compute the value of PE to return ... no delay and advance
         *********************************************************************/
        for (var chn = 0; chn < n_chn_psy; chn++) {
            var ppe;
            var ppePos;
            var type;
            var mr;

            if (chn > 1) {
                ppe = percep_MS_entropy;
                ppePos = -2;
                type = Encoder.NORM_TYPE;
                if (blocktype_d[0] == Encoder.SHORT_TYPE
                    || blocktype_d[1] == Encoder.SHORT_TYPE)
                    type = Encoder.SHORT_TYPE;
                mr = masking_MS_ratio[gr_out][chn - 2];
            } else {
                ppe = percep_entropy;
                ppePos = 0;
                type = blocktype_d[chn];
                mr = masking_ratio[gr_out][chn];
            }

            if (type == Encoder.SHORT_TYPE) {
                ppe[ppePos + chn] = pecalc_s(mr, gfc.masking_lower);
            } else {
                ppe[ppePos + chn] = pecalc_l(mr, gfc.masking_lower);
            }

            if (gfp.analysis) {
                gfc.pinfo.pe[gr_out][chn] = ppe[ppePos + chn];
            }
        }
        return 0;
    }

    function s3_func_x(bark, hf_slope) {
        var tempx = bark, tempy;

        if (tempx >= 0) {
            tempy = -tempx * 27;
        } else {
            tempy = tempx * hf_slope;
        }
        if (tempy <= -72.0) {
            return 0;
        }
        return Math.exp(tempy * LN_TO_LOG10);
    }

    function norm_s3_func_x(hf_slope) {
        var lim_a = 0, lim_b = 0;
        {
            var x = 0, l, h;
            for (x = 0; s3_func_x(x, hf_slope) > 1e-20; x -= 1)
                ;
            l = x;
            h = 0;
            while (Math.abs(h - l) > 1e-12) {
                x = (h + l) / 2;
                if (s3_func_x(x, hf_slope) > 0) {
                    h = x;
                } else {
                    l = x;
                }
            }
            lim_a = l;
        }
        {
            var x = 0, l, h;
            for (x = 0; s3_func_x(x, hf_slope) > 1e-20; x += 1)
                ;
            l = 0;
            h = x;
            while (Math.abs(h - l) > 1e-12) {
                x = (h + l) / 2;
                if (s3_func_x(x, hf_slope) > 0) {
                    l = x;
                } else {
                    h = x;
                }
            }
            lim_b = h;
        }
        {
            var sum = 0;
            var m = 1000;
            var i;
            for (i = 0; i <= m; ++i) {
                var x = lim_a + i * (lim_b - lim_a) / m;
                var y = s3_func_x(x, hf_slope);
                sum += y;
            }
            {
                var norm = (m + 1) / (sum * (lim_b - lim_a));
                /* printf( "norm = %lf\n",norm); */
                return norm;
            }
        }
    }

    /**
     *   The spreading function.  Values returned in units of energy
     */
    function s3_func(bark) {
        var tempx, x, tempy, temp;
        tempx = bark;
        if (tempx >= 0)
            tempx *= 3;
        else
            tempx *= 1.5;

        if (tempx >= 0.5 && tempx <= 2.5) {
            temp = tempx - 0.5;
            x = 8.0 * (temp * temp - 2.0 * temp);
        } else
            x = 0.0;
        tempx += 0.474;
        tempy = 15.811389 + 7.5 * tempx - 17.5
            * Math.sqrt(1.0 + tempx * tempx);

        if (tempy <= -60.0)
            return 0.0;

        tempx = Math.exp((x + tempy) * LN_TO_LOG10);

        /**
         * <PRE>
         * Normalization.  The spreading function should be normalized so that:
         * +inf
         * /
         * |  s3 [ bark ]  d(bark)   =  1
         * /
         * -inf
         * </PRE>
         */
        tempx /= .6609193;
        return tempx;
    }

    /**
     * see for example "Zwicker: Psychoakustik, 1982; ISBN 3-540-11401-7
     */
    function freq2bark(freq) {
        /* input: freq in hz output: barks */
        if (freq < 0)
            freq = 0;
        freq = freq * 0.001;
        return 13.0 * Math.atan(.76 * freq) + 3.5
            * Math.atan(freq * freq / (7.5 * 7.5));
    }

    function init_numline(numlines, bo, bm, bval, bval_width, mld, bo_w, sfreq, blksize, scalepos, deltafreq, sbmax) {
        var b_frq = new_float(Encoder.CBANDS + 1);
        var sample_freq_frac = sfreq / (sbmax > 15 ? 2 * 576 : 2 * 192);
        var partition = new_int(Encoder.HBLKSIZE);
        var i;
        sfreq /= blksize;
        var j = 0;
        var ni = 0;
        /* compute numlines, the number of spectral lines in each partition band */
        /* each partition band should be about DELBARK wide. */
        for (i = 0; i < Encoder.CBANDS; i++) {
            var bark1;
            var j2;
            bark1 = freq2bark(sfreq * j);

            b_frq[i] = sfreq * j;

            for (j2 = j; freq2bark(sfreq * j2) - bark1 < DELBARK
            && j2 <= blksize / 2; j2++)
                ;

            numlines[i] = j2 - j;
            ni = i + 1;

            while (j < j2) {
                assert(j < Encoder.HBLKSIZE);
                partition[j++] = i;
            }
            if (j > blksize / 2) {
                j = blksize / 2;
                ++i;
                break;
            }
        }
        assert(i < Encoder.CBANDS);
        b_frq[i] = sfreq * j;

        for (var sfb = 0; sfb < sbmax; sfb++) {
            var i1, i2, start, end;
            var arg;
            start = scalepos[sfb];
            end = scalepos[sfb + 1];

            i1 = 0 | Math.floor(.5 + deltafreq * (start - .5));
            if (i1 < 0)
                i1 = 0;
            i2 = 0 | Math.floor(.5 + deltafreq * (end - .5));

            if (i2 > blksize / 2)
                i2 = blksize / 2;

            bm[sfb] = (partition[i1] + partition[i2]) / 2;
            bo[sfb] = partition[i2];
            var f_tmp = sample_freq_frac * end;
            /*
             * calculate how much of this band belongs to current scalefactor
             * band
             */
            bo_w[sfb] = (f_tmp - b_frq[bo[sfb]])
                / (b_frq[bo[sfb] + 1] - b_frq[bo[sfb]]);
            if (bo_w[sfb] < 0) {
                bo_w[sfb] = 0;
            } else {
                if (bo_w[sfb] > 1) {
                    bo_w[sfb] = 1;
                }
            }
            /* setup stereo demasking thresholds */
            /* formula reverse enginerred from plot in paper */
            arg = freq2bark(sfreq * scalepos[sfb] * deltafreq);
            arg = ( Math.min(arg, 15.5) / 15.5);

            mld[sfb] = Math.pow(10.0,
                1.25 * (1 - Math.cos(Math.PI * arg)) - 2.5);
        }

        /* compute bark values of each critical band */
        j = 0;
        for (var k = 0; k < ni; k++) {
            var w = numlines[k];
            var bark1, bark2;

            bark1 = freq2bark(sfreq * (j));
            bark2 = freq2bark(sfreq * (j + w - 1));
            bval[k] = .5 * (bark1 + bark2);

            bark1 = freq2bark(sfreq * (j - .5));
            bark2 = freq2bark(sfreq * (j + w - .5));
            bval_width[k] = bark2 - bark1;
            j += w;
        }

        return ni;
    }

    function init_s3_values(s3ind, npart, bval, bval_width, norm, use_old_s3) {
        var s3 = new_float_n([Encoder.CBANDS, Encoder.CBANDS]);
        /*
         * The s3 array is not linear in the bark scale.
         *
         * bval[x] should be used to get the bark value.
         */
        var j;
        var numberOfNoneZero = 0;

        /**
         * <PRE>
         * s[i][j], the value of the spreading function,
         * centered at band j (masker), for band i (maskee)
         *
         * i.e.: sum over j to spread into signal barkval=i
         * NOTE: i and j are used opposite as in the ISO docs
         * </PRE>
         */
        if (use_old_s3) {
            for (var i = 0; i < npart; i++) {
                for (j = 0; j < npart; j++) {
                    var v = s3_func(bval[i] - bval[j]) * bval_width[j];
                    s3[i][j] = v * norm[i];
                }
            }
        } else {
            for (j = 0; j < npart; j++) {
                var hf_slope = 15 + Math.min(21 / bval[j], 12);
                var s3_x_norm = norm_s3_func_x(hf_slope);
                for (var i = 0; i < npart; i++) {
                    var v = s3_x_norm
                        * s3_func_x(bval[i] - bval[j], hf_slope)
                        * bval_width[j];
                    s3[i][j] = v * norm[i];
                }
            }
        }
        for (var i = 0; i < npart; i++) {
            for (j = 0; j < npart; j++) {
                if (s3[i][j] > 0.0)
                    break;
            }
            s3ind[i][0] = j;

            for (j = npart - 1; j > 0; j--) {
                if (s3[i][j] > 0.0)
                    break;
            }
            s3ind[i][1] = j;
            numberOfNoneZero += (s3ind[i][1] - s3ind[i][0] + 1);
        }

        var p = new_float(numberOfNoneZero);
        var k = 0;
        for (var i = 0; i < npart; i++)
            for (j = s3ind[i][0]; j <= s3ind[i][1]; j++)
                p[k++] = s3[i][j];

        return p;
    }

    function stereo_demask(f) {
        /* setup stereo demasking thresholds */
        /* formula reverse enginerred from plot in paper */
        var arg = freq2bark(f);
        arg = (Math.min(arg, 15.5) / 15.5);

        return Math.pow(10.0,
            1.25 * (1 - Math.cos(Math.PI * arg)) - 2.5);
    }

    /**
     * NOTE: the bitrate reduction from the inter-channel masking effect is low
     * compared to the chance of getting annyoing artefacts. L3psycho_anal_vbr
     * does not use this feature. (Robert 071216)
     */
    this.psymodel_init = function (gfp) {
        var gfc = gfp.internal_flags;
        var i;
        var useOldS3 = true;
        var bvl_a = 13, bvl_b = 24;
        var snr_l_a = 0, snr_l_b = 0;
        var snr_s_a = -8.25, snr_s_b = -4.5;
        var bval = new_float(Encoder.CBANDS);
        var bval_width = new_float(Encoder.CBANDS);
        var norm = new_float(Encoder.CBANDS);
        var sfreq = gfp.out_samplerate;

        switch (gfp.experimentalZ) {
            default:
            case 0:
                useOldS3 = true;
                break;
            case 1:
                useOldS3 = (gfp.VBR == VbrMode.vbr_mtrh || gfp.VBR == VbrMode.vbr_mt) ? false
                    : true;
                break;
            case 2:
                useOldS3 = false;
                break;
            case 3:
                bvl_a = 8;
                snr_l_a = -1.75;
                snr_l_b = -0.0125;
                snr_s_a = -8.25;
                snr_s_b = -2.25;
                break;
        }
        gfc.ms_ener_ratio_old = .25;
        gfc.blocktype_old[0] = gfc.blocktype_old[1] = Encoder.NORM_TYPE;
        // the vbr header is long blocks

        for (i = 0; i < 4; ++i) {
            for (var j = 0; j < Encoder.CBANDS; ++j) {
                gfc.nb_1[i][j] = 1e20;
                gfc.nb_2[i][j] = 1e20;
                gfc.nb_s1[i][j] = gfc.nb_s2[i][j] = 1.0;
            }
            for (var sb = 0; sb < Encoder.SBMAX_l; sb++) {
                gfc.en[i].l[sb] = 1e20;
                gfc.thm[i].l[sb] = 1e20;
            }
            for (var j = 0; j < 3; ++j) {
                for (var sb = 0; sb < Encoder.SBMAX_s; sb++) {
                    gfc.en[i].s[sb][j] = 1e20;
                    gfc.thm[i].s[sb][j] = 1e20;
                }
                gfc.nsPsy.lastAttacks[i] = 0;
            }
            for (var j = 0; j < 9; j++)
                gfc.nsPsy.last_en_subshort[i][j] = 10.;
        }

        /* init. for loudness approx. -jd 2001 mar 27 */
        gfc.loudness_sq_save[0] = gfc.loudness_sq_save[1] = 0.0;

        /*************************************************************************
         * now compute the psychoacoustic model specific constants
         ************************************************************************/
        /* compute numlines, bo, bm, bval, bval_width, mld */

        gfc.npart_l = init_numline(gfc.numlines_l, gfc.bo_l, gfc.bm_l, bval,
            bval_width, gfc.mld_l, gfc.PSY.bo_l_weight, sfreq,
            Encoder.BLKSIZE, gfc.scalefac_band.l, Encoder.BLKSIZE
            / (2.0 * 576), Encoder.SBMAX_l);
        assert(gfc.npart_l < Encoder.CBANDS);
        /* compute the spreading function */
        for (i = 0; i < gfc.npart_l; i++) {
            var snr = snr_l_a;
            if (bval[i] >= bvl_a) {
                snr = snr_l_b * (bval[i] - bvl_a) / (bvl_b - bvl_a) + snr_l_a
                    * (bvl_b - bval[i]) / (bvl_b - bvl_a);
            }
            norm[i] = Math.pow(10.0, snr / 10.0);
            if (gfc.numlines_l[i] > 0) {
                gfc.rnumlines_l[i] = 1.0 / gfc.numlines_l[i];
            } else {
                gfc.rnumlines_l[i] = 0;
            }
        }
        gfc.s3_ll = init_s3_values(gfc.s3ind, gfc.npart_l, bval, bval_width,
            norm, useOldS3);

        /* compute long block specific values, ATH and MINVAL */
        var j = 0;
        for (i = 0; i < gfc.npart_l; i++) {
            var x;

            /* ATH */
            x = Float.MAX_VALUE;
            for (var k = 0; k < gfc.numlines_l[i]; k++, j++) {
                var freq = sfreq * j / (1000.0 * Encoder.BLKSIZE);
                var level;
                /*
                 * ATH below 100 Hz constant, not further climbing
                 */
                level = this.ATHformula(freq * 1000, gfp) - 20;
                // scale to FFT units; returned value is in dB
                level = Math.pow(10., 0.1 * level);
                // convert from dB . energy
                level *= gfc.numlines_l[i];
                if (x > level)
                    x = level;
            }
            gfc.ATH.cb_l[i] = x;

            /*
             * MINVAL. For low freq, the strength of the masking is limited by
             * minval this is an ISO MPEG1 thing, dont know if it is really
             * needed
             */
            /*
             * FIXME: it does work to reduce low-freq problems in S53-Wind-Sax
             * and lead-voice samples, but introduces some 3 kbps bit bloat too.
             * TODO: Further refinement of the shape of this hack.
             */
            x = -20 + bval[i] * 20 / 10;
            if (x > 6) {
                x = 100;
            }
            if (x < -15) {
                x = -15;
            }
            x -= 8.;
            gfc.minval_l[i] = (Math.pow(10.0, x / 10.) * gfc.numlines_l[i]);
        }

        /************************************************************************
         * do the same things for short blocks
         ************************************************************************/
        gfc.npart_s = init_numline(gfc.numlines_s, gfc.bo_s, gfc.bm_s, bval,
            bval_width, gfc.mld_s, gfc.PSY.bo_s_weight, sfreq,
            Encoder.BLKSIZE_s, gfc.scalefac_band.s, Encoder.BLKSIZE_s
            / (2.0 * 192), Encoder.SBMAX_s);
        assert(gfc.npart_s < Encoder.CBANDS);

        /* SNR formula. short block is normalized by SNR. is it still right ? */
        j = 0;
        for (i = 0; i < gfc.npart_s; i++) {
            var x;
            var snr = snr_s_a;
            if (bval[i] >= bvl_a) {
                snr = snr_s_b * (bval[i] - bvl_a) / (bvl_b - bvl_a) + snr_s_a
                    * (bvl_b - bval[i]) / (bvl_b - bvl_a);
            }
            norm[i] = Math.pow(10.0, snr / 10.0);

            /* ATH */
            x = Float.MAX_VALUE;
            for (var k = 0; k < gfc.numlines_s[i]; k++, j++) {
                var freq = sfreq * j / (1000.0 * Encoder.BLKSIZE_s);
                var level;
                /* freq = Min(.1,freq); */
                /*
                 * ATH below 100 Hz constant, not
                 * further climbing
                 */
                level = this.ATHformula(freq * 1000, gfp) - 20;
                // scale to FFT units; returned value is in dB
                level = Math.pow(10., 0.1 * level);
                // convert from dB . energy
                level *= gfc.numlines_s[i];
                if (x > level)
                    x = level;
            }
            gfc.ATH.cb_s[i] = x;

            /*
             * MINVAL. For low freq, the strength of the masking is limited by
             * minval this is an ISO MPEG1 thing, dont know if it is really
             * needed
             */
            x = (-7.0 + bval[i] * 7.0 / 12.0);
            if (bval[i] > 12) {
                x *= 1 + Math.log(1 + x) * 3.1;
            }
            if (bval[i] < 12) {
                x *= 1 + Math.log(1 - x) * 2.3;
            }
            if (x < -15) {
                x = -15;
            }
            x -= 8;
            gfc.minval_s[i] = Math.pow(10.0, x / 10)
                * gfc.numlines_s[i];
        }

        gfc.s3_ss = init_s3_values(gfc.s3ind_s, gfc.npart_s, bval, bval_width,
            norm, useOldS3);

        init_mask_add_max_values();
        fft.init_fft(gfc);

        /* setup temporal masking */
        gfc.decay = Math.exp(-1.0 * LOG10
            / (temporalmask_sustain_sec * sfreq / 192.0));

        {
            var msfix;
            msfix = NS_MSFIX;
            if ((gfp.exp_nspsytune & 2) != 0)
                msfix = 1.0;
            if (Math.abs(gfp.msfix) > 0.0)
                msfix = gfp.msfix;
            gfp.msfix = msfix;

            /*
             * spread only from npart_l bands. Normally, we use the spreading
             * function to convolve from npart_l down to npart_l bands
             */
            for (var b = 0; b < gfc.npart_l; b++)
                if (gfc.s3ind[b][1] > gfc.npart_l - 1)
                    gfc.s3ind[b][1] = gfc.npart_l - 1;
        }

        /*
         * prepare for ATH auto adjustment: we want to decrease the ATH by 12 dB
         * per second
         */
        var frame_duration = (576. * gfc.mode_gr / sfreq);
        gfc.ATH.decay = Math.pow(10., -12. / 10. * frame_duration);
        gfc.ATH.adjust = 0.01;
        /* minimum, for leading low loudness */
        gfc.ATH.adjustLimit = 1.0;
        /* on lead, allow adjust up to maximum */

        assert(gfc.bo_l[Encoder.SBMAX_l - 1] <= gfc.npart_l);
        assert(gfc.bo_s[Encoder.SBMAX_s - 1] <= gfc.npart_s);

        if (gfp.ATHtype != -1) {
            /* compute equal loudness weights (eql_w) */
            var freq;
            var freq_inc = gfp.out_samplerate
                / (Encoder.BLKSIZE);
            var eql_balance = 0.0;
            freq = 0.0;
            for (i = 0; i < Encoder.BLKSIZE / 2; ++i) {
                /* convert ATH dB to relative power (not dB) */
                /* to determine eql_w */
                freq += freq_inc;
                gfc.ATH.eql_w[i] = 1. / Math.pow(10, this.ATHformula(freq, gfp) / 10);
                eql_balance += gfc.ATH.eql_w[i];
            }
            eql_balance = 1.0 / eql_balance;
            for (i = Encoder.BLKSIZE / 2; --i >= 0;) { /* scale weights */
                gfc.ATH.eql_w[i] *= eql_balance;
            }
        }
        {
            for (var b = j = 0; b < gfc.npart_s; ++b) {
                for (i = 0; i < gfc.numlines_s[b]; ++i) {
                    ++j;
                }
            }
            assert(j == 129);
            for (var b = j = 0; b < gfc.npart_l; ++b) {
                for (i = 0; i < gfc.numlines_l[b]; ++i) {
                    ++j;
                }
            }
            assert(j == 513);
        }
        j = 0;
        for (i = 0; i < gfc.npart_l; i++) {
            var freq = sfreq * (j + gfc.numlines_l[i] / 2) / (1.0 * Encoder.BLKSIZE);
            gfc.mld_cb_l[i] = stereo_demask(freq);
            j += gfc.numlines_l[i];
        }
        for (; i < Encoder.CBANDS; ++i) {
            gfc.mld_cb_l[i] = 1;
        }
        j = 0;
        for (i = 0; i < gfc.npart_s; i++) {
            var freq = sfreq * (j + gfc.numlines_s[i] / 2) / (1.0 * Encoder.BLKSIZE_s);
            gfc.mld_cb_s[i] = stereo_demask(freq);
            j += gfc.numlines_s[i];
        }
        for (; i < Encoder.CBANDS; ++i) {
            gfc.mld_cb_s[i] = 1;
        }
        return 0;
    }

    /**
     * Those ATH formulas are returning their minimum value for input = -1
     */
    function ATHformula_GB(f, value) {
        /**
         * <PRE>
         *  from Painter & Spanias
         *           modified by Gabriel Bouvigne to better fit the reality
         *           ath =    3.640 * pow(f,-0.8)
         *           - 6.800 * exp(-0.6*pow(f-3.4,2.0))
         *           + 6.000 * exp(-0.15*pow(f-8.7,2.0))
         *           + 0.6* 0.001 * pow(f,4.0);
         *
         *
         *           In the past LAME was using the Painter &Spanias formula.
         *           But we had some recurrent problems with HF content.
         *           We measured real ATH values, and found the older formula
         *           to be inaccurate in the higher part. So we made this new
         *           formula and this solved most of HF problematic test cases.
         *           The tradeoff is that in VBR mode it increases a lot the
         *           bitrate.
         * </PRE>
         */

        /*
         * This curve can be adjusted according to the VBR scale: it adjusts
         * from something close to Painter & Spanias on V9 up to Bouvigne's
         * formula for V0. This way the VBR bitrate is more balanced according
         * to the -V value.
         */

        // the following Hack allows to ask for the lowest value
        if (f < -.3)
            f = 3410;

        // convert to khz
        f /= 1000;
        f = Math.max(0.1, f);
        var ath = 3.640 * Math.pow(f, -0.8) - 6.800
            * Math.exp(-0.6 * Math.pow(f - 3.4, 2.0)) + 6.000
            * Math.exp(-0.15 * Math.pow(f - 8.7, 2.0))
            + (0.6 + 0.04 * value) * 0.001 * Math.pow(f, 4.0);
        return ath;
    }

    this.ATHformula = function (f, gfp) {
        var ath;
        switch (gfp.ATHtype) {
            case 0:
                ath = ATHformula_GB(f, 9);
                break;
            case 1:
                // over sensitive, should probably be removed
                ath = ATHformula_GB(f, -1);
                break;
            case 2:
                ath = ATHformula_GB(f, 0);
                break;
            case 3:
                // modification of GB formula by Roel
                ath = ATHformula_GB(f, 1) + 6;
                break;
            case 4:
                ath = ATHformula_GB(f, gfp.ATHcurve);
                break;
            default:
                ath = ATHformula_GB(f, 0);
                break;
        }
        return ath;
    }

}

module.exports = PsyModel;
