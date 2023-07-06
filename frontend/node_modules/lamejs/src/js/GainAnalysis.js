/*
 *  ReplayGainAnalysis - analyzes input samples and give the recommended dB change
 *  Copyright (C) 2001 David Robinson and Glen Sawyer
 *  Improvements and optimizations added by Frank Klemm, and by Marcel Muller 
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2.1 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 *  concept and filter values by David Robinson (David@Robinson.org)
 *    -- blame him if you think the idea is flawed
 *  original coding by Glen Sawyer (mp3gain@hotmail.com)
 *    -- blame him if you think this runs too slowly, or the coding is otherwise flawed
 *
 *  lots of code improvements by Frank Klemm ( http://www.uni-jena.de/~pfk/mpp/ )
 *    -- credit him for all the _good_ programming ;)
 *
 *
 *  For an explanation of the concepts and the basic algorithms involved, go to:
 *    http://www.replaygain.org/
 */

/*
 *  Here's the deal. Call
 *
 *    InitGainAnalysis ( long samplefreq );
 *
 *  to initialize everything. Call
 *
 *    AnalyzeSamples ( var Float_t*  left_samples,
 *                     var Float_t*  right_samples,
 *                     size_t          num_samples,
 *                     int             num_channels );
 *
 *  as many times as you want, with as many or as few samples as you want.
 *  If mono, pass the sample buffer in through left_samples, leave
 *  right_samples NULL, and make sure num_channels = 1.
 *
 *    GetTitleGain()
 *
 *  will return the recommended dB level change for all samples analyzed
 *  SINCE THE LAST TIME you called GetTitleGain() OR InitGainAnalysis().
 *
 *    GetAlbumGain()
 *
 *  will return the recommended dB level change for all samples analyzed
 *  since InitGainAnalysis() was called and finalized with GetTitleGain().
 *
 *  Pseudo-code to process an album:
 *
 *    Float_t       l_samples [4096];
 *    Float_t       r_samples [4096];
 *    size_t        num_samples;
 *    unsigned int  num_songs;
 *    unsigned int  i;
 *
 *    InitGainAnalysis ( 44100 );
 *    for ( i = 1; i <= num_songs; i++ ) {
 *        while ( ( num_samples = getSongSamples ( song[i], left_samples, right_samples ) ) > 0 )
 *            AnalyzeSamples ( left_samples, right_samples, num_samples, 2 );
 *        fprintf ("Recommended dB change for song %2d: %+6.2 dB\n", i, GetTitleGain() );
 *    }
 *    fprintf ("Recommended dB change for whole album: %+6.2 dB\n", GetAlbumGain() );
 */

/*
 *  So here's the main source of potential code confusion:
 *
 *  The filters applied to the incoming samples are IIR filters,
 *  meaning they rely on up to <filter order> number of previous samples
 *  AND up to <filter order> number of previous filtered samples.
 *
 *  I set up the AnalyzeSamples routine to minimize memory usage and interface
 *  complexity. The speed isn't compromised too much (I don't think), but the
 *  internal complexity is higher than it should be for such a relatively
 *  simple routine.
 *
 *  Optimization/clarity suggestions are welcome.
 */
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

/**
 * Table entries per dB
 */
GainAnalysis.STEPS_per_dB = 100.;
/**
 * Table entries for 0...MAX_dB (normal max. values are 70...80 dB)
 */
GainAnalysis.MAX_dB = 120.;
GainAnalysis.GAIN_NOT_ENOUGH_SAMPLES = -24601;
GainAnalysis.GAIN_ANALYSIS_ERROR = 0;
GainAnalysis.GAIN_ANALYSIS_OK = 1;
GainAnalysis.INIT_GAIN_ANALYSIS_ERROR = 0;
GainAnalysis.INIT_GAIN_ANALYSIS_OK = 1;

GainAnalysis.YULE_ORDER = 10;
GainAnalysis.MAX_ORDER = GainAnalysis.YULE_ORDER;

GainAnalysis.MAX_SAMP_FREQ = 48000;
GainAnalysis.RMS_WINDOW_TIME_NUMERATOR = 1;
GainAnalysis.RMS_WINDOW_TIME_DENOMINATOR = 20;
GainAnalysis.MAX_SAMPLES_PER_WINDOW = ((GainAnalysis.MAX_SAMP_FREQ * GainAnalysis.RMS_WINDOW_TIME_NUMERATOR) / GainAnalysis.RMS_WINDOW_TIME_DENOMINATOR + 1);

function GainAnalysis() {
    /**
     * calibration value for 89dB
     */
    var PINK_REF = 64.82;

    var YULE_ORDER = GainAnalysis.YULE_ORDER;
    /**
     * percentile which is louder than the proposed level
     */
    var RMS_PERCENTILE = 0.95;
    /**
     * maximum allowed sample frequency [Hz]
     */
    var MAX_SAMP_FREQ = GainAnalysis.MAX_SAMP_FREQ;
    var RMS_WINDOW_TIME_NUMERATOR = GainAnalysis.RMS_WINDOW_TIME_NUMERATOR;
    /**
     * numerator / denominator = time slice size [s]
     */
    var RMS_WINDOW_TIME_DENOMINATOR = GainAnalysis.RMS_WINDOW_TIME_DENOMINATOR;
    /**
     * max. Samples per Time slice
     */
    var MAX_SAMPLES_PER_WINDOW = GainAnalysis.MAX_SAMPLES_PER_WINDOW;


    var ABYule = [
        [0.03857599435200, -3.84664617118067, -0.02160367184185,
            7.81501653005538, -0.00123395316851, -11.34170355132042,
            -0.00009291677959, 13.05504219327545, -0.01655260341619,
            -12.28759895145294, 0.02161526843274, 9.48293806319790,
            -0.02074045215285, -5.87257861775999, 0.00594298065125,
            2.75465861874613, 0.00306428023191, -0.86984376593551,
            0.00012025322027, 0.13919314567432, 0.00288463683916],
        [0.05418656406430, -3.47845948550071, -0.02911007808948,
            6.36317777566148, -0.00848709379851, -8.54751527471874,
            -0.00851165645469, 9.47693607801280, -0.00834990904936,
            -8.81498681370155, 0.02245293253339, 6.85401540936998,
            -0.02596338512915, -4.39470996079559, 0.01624864962975,
            2.19611684890774, -0.00240879051584, -0.75104302451432,
            0.00674613682247, 0.13149317958808, -0.00187763777362],
        [0.15457299681924, -2.37898834973084, -0.09331049056315,
            2.84868151156327, -0.06247880153653, -2.64577170229825,
            0.02163541888798, 2.23697657451713, -0.05588393329856,
            -1.67148153367602, 0.04781476674921, 1.00595954808547,
            0.00222312597743, -0.45953458054983, 0.03174092540049,
            0.16378164858596, -0.01390589421898, -0.05032077717131,
            0.00651420667831, 0.02347897407020, -0.00881362733839],
        [0.30296907319327, -1.61273165137247, -0.22613988682123,
            1.07977492259970, -0.08587323730772, -0.25656257754070,
            0.03282930172664, -0.16276719120440, -0.00915702933434,
            -0.22638893773906, -0.02364141202522, 0.39120800788284,
            -0.00584456039913, -0.22138138954925, 0.06276101321749,
            0.04500235387352, -0.00000828086748, 0.02005851806501,
            0.00205861885564, 0.00302439095741, -0.02950134983287],
        [0.33642304856132, -1.49858979367799, -0.25572241425570,
            0.87350271418188, -0.11828570177555, 0.12205022308084,
            0.11921148675203, -0.80774944671438, -0.07834489609479,
            0.47854794562326, -0.00469977914380, -0.12453458140019,
            -0.00589500224440, -0.04067510197014, 0.05724228140351,
            0.08333755284107, 0.00832043980773, -0.04237348025746,
            -0.01635381384540, 0.02977207319925, -0.01760176568150],
        [0.44915256608450, -0.62820619233671, -0.14351757464547,
            0.29661783706366, -0.22784394429749, -0.37256372942400,
            -0.01419140100551, 0.00213767857124, 0.04078262797139,
            -0.42029820170918, -0.12398163381748, 0.22199650564824,
            0.04097565135648, 0.00613424350682, 0.10478503600251,
            0.06747620744683, -0.01863887810927, 0.05784820375801,
            -0.03193428438915, 0.03222754072173, 0.00541907748707],
        [0.56619470757641, -1.04800335126349, -0.75464456939302,
            0.29156311971249, 0.16242137742230, -0.26806001042947,
            0.16744243493672, 0.00819999645858, -0.18901604199609,
            0.45054734505008, 0.30931782841830, -0.33032403314006,
            -0.27562961986224, 0.06739368333110, 0.00647310677246,
            -0.04784254229033, 0.08647503780351, 0.01639907836189,
            -0.03788984554840, 0.01807364323573, -0.00588215443421],
        [0.58100494960553, -0.51035327095184, -0.53174909058578,
            -0.31863563325245, -0.14289799034253, -0.20256413484477,
            0.17520704835522, 0.14728154134330, 0.02377945217615,
            0.38952639978999, 0.15558449135573, -0.23313271880868,
            -0.25344790059353, -0.05246019024463, 0.01628462406333,
            -0.02505961724053, 0.06920467763959, 0.02442357316099,
            -0.03721611395801, 0.01818801111503, -0.00749618797172],
        [0.53648789255105, -0.25049871956020, -0.42163034350696,
            -0.43193942311114, -0.00275953611929, -0.03424681017675,
            0.04267842219415, -0.04678328784242, -0.10214864179676,
            0.26408300200955, 0.14590772289388, 0.15113130533216,
            -0.02459864859345, -0.17556493366449, -0.11202315195388,
            -0.18823009262115, -0.04060034127000, 0.05477720428674,
            0.04788665548180, 0.04704409688120, -0.02217936801134]];

    var ABButter = [
        [0.98621192462708, -1.97223372919527, -1.97242384925416,
            0.97261396931306, 0.98621192462708],
        [0.98500175787242, -1.96977855582618, -1.97000351574484,
            0.97022847566350, 0.98500175787242],
        [0.97938932735214, -1.95835380975398, -1.95877865470428,
            0.95920349965459, 0.97938932735214],
        [0.97531843204928, -1.95002759149878, -1.95063686409857,
            0.95124613669835, 0.97531843204928],
        [0.97316523498161, -1.94561023566527, -1.94633046996323,
            0.94705070426118, 0.97316523498161],
        [0.96454515552826, -1.92783286977036, -1.92909031105652,
            0.93034775234268, 0.96454515552826],
        [0.96009142950541, -1.91858953033784, -1.92018285901082,
            0.92177618768381, 0.96009142950541],
        [0.95856916599601, -1.91542108074780, -1.91713833199203,
            0.91885558323625, 0.95856916599601],
        [0.94597685600279, -1.88903307939452, -1.89195371200558,
            0.89487434461664, 0.94597685600279]];


    /**
     * When calling this procedure, make sure that ip[-order] and op[-order]
     * point to real data
     */
    //private void filterYule(final float[] input, int inputPos, float[] output,
    //int outputPos, int nSamples, final float[] kernel) {
    function filterYule(input, inputPos, output, outputPos, nSamples, kernel) {

        while ((nSamples--) != 0) {
            /* 1e-10 is a hack to avoid slowdown because of denormals */
            output[outputPos] = 1e-10 + input[inputPos + 0] * kernel[0]
                - output[outputPos - 1] * kernel[1] + input[inputPos - 1]
                * kernel[2] - output[outputPos - 2] * kernel[3]
                + input[inputPos - 2] * kernel[4] - output[outputPos - 3]
                * kernel[5] + input[inputPos - 3] * kernel[6]
                - output[outputPos - 4] * kernel[7] + input[inputPos - 4]
                * kernel[8] - output[outputPos - 5] * kernel[9]
                + input[inputPos - 5] * kernel[10] - output[outputPos - 6]
                * kernel[11] + input[inputPos - 6] * kernel[12]
                - output[outputPos - 7] * kernel[13] + input[inputPos - 7]
                * kernel[14] - output[outputPos - 8] * kernel[15]
                + input[inputPos - 8] * kernel[16] - output[outputPos - 9]
                * kernel[17] + input[inputPos - 9] * kernel[18]
                - output[outputPos - 10] * kernel[19]
                + input[inputPos - 10] * kernel[20];
            ++outputPos;
            ++inputPos;
        }
    }

//private void filterButter(final float[] input, int inputPos,
//    float[] output, int outputPos, int nSamples, final float[] kernel) {
    function filterButter(input, inputPos, output, outputPos, nSamples, kernel) {

        while ((nSamples--) != 0) {
            output[outputPos] = input[inputPos + 0] * kernel[0]
                - output[outputPos - 1] * kernel[1] + input[inputPos - 1]
                * kernel[2] - output[outputPos - 2] * kernel[3]
                + input[inputPos - 2] * kernel[4];
            ++outputPos;
            ++inputPos;
        }
    }

    /**
     * @return INIT_GAIN_ANALYSIS_OK if successful, INIT_GAIN_ANALYSIS_ERROR if
     *         not
     */
    function ResetSampleFrequency(rgData, samplefreq) {
        /* zero out initial values */
        for (var i = 0; i < MAX_ORDER; i++)
            rgData.linprebuf[i] = rgData.lstepbuf[i] = rgData.loutbuf[i] = rgData.rinprebuf[i] = rgData.rstepbuf[i] = rgData.routbuf[i] = 0.;

        switch (0 | (samplefreq)) {
            case 48000:
                rgData.reqindex = 0;
                break;
            case 44100:
                rgData.reqindex = 1;
                break;
            case 32000:
                rgData.reqindex = 2;
                break;
            case 24000:
                rgData.reqindex = 3;
                break;
            case 22050:
                rgData.reqindex = 4;
                break;
            case 16000:
                rgData.reqindex = 5;
                break;
            case 12000:
                rgData.reqindex = 6;
                break;
            case 11025:
                rgData.reqindex = 7;
                break;
            case 8000:
                rgData.reqindex = 8;
                break;
            default:
                return INIT_GAIN_ANALYSIS_ERROR;
        }

        rgData.sampleWindow = 0 | ((samplefreq * RMS_WINDOW_TIME_NUMERATOR
            + RMS_WINDOW_TIME_DENOMINATOR - 1) / RMS_WINDOW_TIME_DENOMINATOR);

        rgData.lsum = 0.;
        rgData.rsum = 0.;
        rgData.totsamp = 0;

        Arrays.ill(rgData.A, 0);

        return INIT_GAIN_ANALYSIS_OK;
    }

    this.InitGainAnalysis = function (rgData, samplefreq) {
        if (ResetSampleFrequency(rgData, samplefreq) != INIT_GAIN_ANALYSIS_OK) {
            return INIT_GAIN_ANALYSIS_ERROR;
        }

        rgData.linpre = MAX_ORDER;
        rgData.rinpre = MAX_ORDER;
        rgData.lstep = MAX_ORDER;
        rgData.rstep = MAX_ORDER;
        rgData.lout = MAX_ORDER;
        rgData.rout = MAX_ORDER;

        Arrays.fill(rgData.B, 0);

        return INIT_GAIN_ANALYSIS_OK;
    };

    /**
     * square
     */
    function fsqr(d) {
        return d * d;
    }

    this.AnalyzeSamples = function (rgData, left_samples, left_samplesPos, right_samples, right_samplesPos, num_samples,
                                    num_channels) {
        var curleft;
        var curleftBase;
        var curright;
        var currightBase;
        var batchsamples;
        var cursamples;
        var cursamplepos;

        if (num_samples == 0)
            return GAIN_ANALYSIS_OK;

        cursamplepos = 0;
        batchsamples = num_samples;

        switch (num_channels) {
            case 1:
                right_samples = left_samples;
                right_samplesPos = left_samplesPos;
                break;
            case 2:
                break;
            default:
                return GAIN_ANALYSIS_ERROR;
        }

        if (num_samples < MAX_ORDER) {
            System.arraycopy(left_samples, left_samplesPos, rgData.linprebuf,
                MAX_ORDER, num_samples);
            System.arraycopy(right_samples, right_samplesPos, rgData.rinprebuf,
                MAX_ORDER, num_samples);
        } else {
            System.arraycopy(left_samples, left_samplesPos, rgData.linprebuf,
                MAX_ORDER, MAX_ORDER);
            System.arraycopy(right_samples, right_samplesPos, rgData.rinprebuf,
                MAX_ORDER, MAX_ORDER);
        }

        while (batchsamples > 0) {
            cursamples = batchsamples > rgData.sampleWindow - rgData.totsamp ? rgData.sampleWindow
            - rgData.totsamp
                : batchsamples;
            if (cursamplepos < MAX_ORDER) {
                curleft = rgData.linpre + cursamplepos;
                curleftBase = rgData.linprebuf;
                curright = rgData.rinpre + cursamplepos;
                currightBase = rgData.rinprebuf;
                if (cursamples > MAX_ORDER - cursamplepos)
                    cursamples = MAX_ORDER - cursamplepos;
            } else {
                curleft = left_samplesPos + cursamplepos;
                curleftBase = left_samples;
                curright = right_samplesPos + cursamplepos;
                currightBase = right_samples;
            }

            filterYule(curleftBase, curleft, rgData.lstepbuf, rgData.lstep
                + rgData.totsamp, cursamples, ABYule[rgData.reqindex]);
            filterYule(currightBase, curright, rgData.rstepbuf, rgData.rstep
                + rgData.totsamp, cursamples, ABYule[rgData.reqindex]);

            filterButter(rgData.lstepbuf, rgData.lstep + rgData.totsamp,
                rgData.loutbuf, rgData.lout + rgData.totsamp, cursamples,
                ABButter[rgData.reqindex]);
            filterButter(rgData.rstepbuf, rgData.rstep + rgData.totsamp,
                rgData.routbuf, rgData.rout + rgData.totsamp, cursamples,
                ABButter[rgData.reqindex]);

            curleft = rgData.lout + rgData.totsamp;
            /* Get the squared values */
            curleftBase = rgData.loutbuf;
            curright = rgData.rout + rgData.totsamp;
            currightBase = rgData.routbuf;

            var i = cursamples % 8;
            while ((i--) != 0) {
                rgData.lsum += fsqr(curleftBase[curleft++]);
                rgData.rsum += fsqr(currightBase[curright++]);
            }
            i = cursamples / 8;
            while ((i--) != 0) {
                rgData.lsum += fsqr(curleftBase[curleft + 0])
                    + fsqr(curleftBase[curleft + 1])
                    + fsqr(curleftBase[curleft + 2])
                    + fsqr(curleftBase[curleft + 3])
                    + fsqr(curleftBase[curleft + 4])
                    + fsqr(curleftBase[curleft + 5])
                    + fsqr(curleftBase[curleft + 6])
                    + fsqr(curleftBase[curleft + 7]);
                curleft += 8;
                rgData.rsum += fsqr(currightBase[curright + 0])
                    + fsqr(currightBase[curright + 1])
                    + fsqr(currightBase[curright + 2])
                    + fsqr(currightBase[curright + 3])
                    + fsqr(currightBase[curright + 4])
                    + fsqr(currightBase[curright + 5])
                    + fsqr(currightBase[curright + 6])
                    + fsqr(currightBase[curright + 7]);
                curright += 8;
            }

            batchsamples -= cursamples;
            cursamplepos += cursamples;
            rgData.totsamp += cursamples;
            if (rgData.totsamp == rgData.sampleWindow) {
                /* Get the Root Mean Square (RMS) for this set of samples */
                var val = GainAnalysis.STEPS_per_dB
                    * 10.
                    * Math.log10((rgData.lsum + rgData.rsum)
                        / rgData.totsamp * 0.5 + 1.e-37);
                var ival = (val <= 0) ? 0 : 0 | val;
                if (ival >= rgData.A.length)
                    ival = rgData.A.length - 1;
                rgData.A[ival]++;
                rgData.lsum = rgData.rsum = 0.;

                System.arraycopy(rgData.loutbuf, rgData.totsamp,
                    rgData.loutbuf, 0, MAX_ORDER);
                System.arraycopy(rgData.routbuf, rgData.totsamp,
                    rgData.routbuf, 0, MAX_ORDER);
                System.arraycopy(rgData.lstepbuf, rgData.totsamp,
                    rgData.lstepbuf, 0, MAX_ORDER);
                System.arraycopy(rgData.rstepbuf, rgData.totsamp,
                    rgData.rstepbuf, 0, MAX_ORDER);
                rgData.totsamp = 0;
            }
            if (rgData.totsamp > rgData.sampleWindow) {
                /*
                 * somehow I really screwed up: Error in programming! Contact
                 * author about totsamp > sampleWindow
                 */
                return GAIN_ANALYSIS_ERROR;
            }
        }
        if (num_samples < MAX_ORDER) {
            System.arraycopy(rgData.linprebuf, num_samples, rgData.linprebuf,
                0, MAX_ORDER - num_samples);
            System.arraycopy(rgData.rinprebuf, num_samples, rgData.rinprebuf,
                0, MAX_ORDER - num_samples);
            System.arraycopy(left_samples, left_samplesPos, rgData.linprebuf,
                MAX_ORDER - num_samples, num_samples);
            System.arraycopy(right_samples, right_samplesPos, rgData.rinprebuf,
                MAX_ORDER - num_samples, num_samples);
        } else {
            System.arraycopy(left_samples, left_samplesPos + num_samples
                - MAX_ORDER, rgData.linprebuf, 0, MAX_ORDER);
            System.arraycopy(right_samples, right_samplesPos + num_samples
                - MAX_ORDER, rgData.rinprebuf, 0, MAX_ORDER);
        }

        return GAIN_ANALYSIS_OK;
    };

    function analyzeResult(Array, len) {
        var i;

        var elems = 0;
        for (i = 0; i < len; i++)
            elems += Array[i];
        if (elems == 0)
            return GAIN_NOT_ENOUGH_SAMPLES;

        var upper = 0 | Math.ceil(elems * (1. - RMS_PERCENTILE));
        for (i = len; i-- > 0;) {
            if ((upper -= Array[i]) <= 0)
                break;
        }

        //return (float) ((float) PINK_REF - (float) i / (float) STEPS_per_dB);
        return (PINK_REF - i / GainAnalysis.STEPS_per_dB);
    }

    this.GetTitleGain = function (rgData) {
        var retval = analyzeResult(rgData.A, rgData.A.length);

        for (var i = 0; i < rgData.A.length; i++) {
            rgData.B[i] += rgData.A[i];
            rgData.A[i] = 0;
        }

        for (var i = 0; i < MAX_ORDER; i++)
            rgData.linprebuf[i] = rgData.lstepbuf[i] = rgData.loutbuf[i] = rgData.rinprebuf[i] = rgData.rstepbuf[i] = rgData.routbuf[i] = 0.;

        rgData.totsamp = 0;
        rgData.lsum = rgData.rsum = 0.;
        return retval;
    }

}

module.exports = GainAnalysis;
