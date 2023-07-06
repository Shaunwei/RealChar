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

var IIISideInfo = require('./IIISideInfo.js');
var ScaleFac = require('./ScaleFac.js');
var NsPsy = require('./NsPsy.js');
var VBRSeekInfo = require('./VBRSeekInfo.js');
var III_psy_xmin = require('./III_psy_xmin.js');
var Encoder = require('./Encoder.js');
var L3Side = require('./L3Side.js');


LameInternalFlags.MFSIZE = (3 * 1152 + Encoder.ENCDELAY - Encoder.MDCTDELAY);
LameInternalFlags.MAX_HEADER_BUF = 256;
LameInternalFlags.MAX_BITS_PER_CHANNEL = 4095;
LameInternalFlags.MAX_BITS_PER_GRANULE = 7680;
LameInternalFlags.BPC = 320;

function LameInternalFlags() {
    var MAX_HEADER_LEN = 40;


    /********************************************************************
     * internal variables NOT set by calling program, and should not be *
     * modified by the calling program *
     ********************************************************************/

    /**
     * Some remarks to the Class_ID field: The Class ID is an Identifier for a
     * pointer to this struct. It is very unlikely that a pointer to
     * lame_global_flags has the same 32 bits in it's structure (large and other
     * special properties, for instance prime).
     *
     * To test that the structure is right and initialized, use: if ( gfc .
     * Class_ID == LAME_ID ) ... Other remark: If you set a flag to 0 for uninit
     * data and 1 for init data, the right test should be "if (flag == 1)" and
     * NOT "if (flag)". Unintended modification of this element will be
     * otherwise misinterpreted as an init.
     */
    this.Class_ID = 0;

    this.lame_encode_frame_init = 0;
    this.iteration_init_init = 0;
    this.fill_buffer_resample_init = 0;

    //public float mfbuf[][] = new float[2][MFSIZE];
    this.mfbuf = new_float_n([2, LameInternalFlags.MFSIZE]);

    /**
     * granules per frame
     */
    this.mode_gr = 0;
    /**
     * number of channels in the input data stream (PCM or decoded PCM)
     */
    this.channels_in = 0;
    /**
     * number of channels in the output data stream (not used for decoding)
     */
    this.channels_out = 0;
    /**
     * input_samp_rate/output_samp_rate
     */
        //public double resample_ratio;
    this.resample_ratio = 0.;

    this.mf_samples_to_encode = 0;
    this.mf_size = 0;
    /**
     * min bitrate index
     */
    this.VBR_min_bitrate = 0;
    /**
     * max bitrate index
     */
    this.VBR_max_bitrate = 0;
    this.bitrate_index = 0;
    this.samplerate_index = 0;
    this.mode_ext = 0;

    /* lowpass and highpass filter control */
    /**
     * normalized frequency bounds of passband
     */
    this.lowpass1 = 0.;
    this.lowpass2 = 0.;
    /**
     * normalized frequency bounds of passband
     */
    this.highpass1 = 0.;
    this.highpass2 = 0.;

    /**
     * 0 = none 1 = ISO AAC model 2 = allow scalefac_select=1
     */
    this.noise_shaping = 0;

    /**
     * 0 = ISO model: amplify all distorted bands<BR>
     * 1 = amplify within 50% of max (on db scale)<BR>
     * 2 = amplify only most distorted band<BR>
     * 3 = method 1 and refine with method 2<BR>
     */
    this.noise_shaping_amp = 0;
    /**
     * 0 = no substep<BR>
     * 1 = use substep shaping at last step(VBR only)<BR>
     * (not implemented yet)<BR>
     * 2 = use substep inside loop<BR>
     * 3 = use substep inside loop and last step<BR>
     */
    this.substep_shaping = 0;

    /**
     * 1 = gpsycho. 0 = none
     */
    this.psymodel = 0;
    /**
     * 0 = stop at over=0, all scalefacs amplified or<BR>
     * a scalefac has reached max value<BR>
     * 1 = stop when all scalefacs amplified or a scalefac has reached max value<BR>
     * 2 = stop when all scalefacs amplified
     */
    this.noise_shaping_stop = 0;

    /**
     * 0 = no, 1 = yes
     */
    this.subblock_gain = 0;
    /**
     * 0 = no. 1=outside loop 2=inside loop(slow)
     */
    this.use_best_huffman = 0;

    /**
     * 0 = stop early after 0 distortion found. 1 = full search
     */
    this.full_outer_loop = 0;

    //public IIISideInfo l3_side = new IIISideInfo();
    this.l3_side = new IIISideInfo();
    this.ms_ratio = new_float(2);

    /* used for padding */
    /**
     * padding for the current frame?
     */
    this.padding = 0;
    this.frac_SpF = 0;
    this.slot_lag = 0;

    /**
     * optional ID3 tags
     */
        //public ID3TagSpec tag_spec;
    this.tag_spec = null;
    this.nMusicCRC = 0;

    /* variables used by Quantize */
    //public int OldValue[] = new int[2];
    this.OldValue = new_int(2);
    //public int CurrentStep[] = new int[2];
    this.CurrentStep = new_int(2);

    this.masking_lower = 0.;
    //public int bv_scf[] = new int[576];
    this.bv_scf = new_int(576);
    //public int pseudohalf[] = new int[L3Side.SFBMAX];
    this.pseudohalf = new_int(L3Side.SFBMAX);

    /**
     * will be set in lame_init_params
     */
    this.sfb21_extra = false;

    /* BPC = maximum number of filter convolution windows to precompute */
    //public float[][] inbuf_old = new float[2][];
    this.inbuf_old = new Array(2);
    //public float[][] blackfilt = new float[2 * BPC + 1][];
    this.blackfilt = new Array(2 * LameInternalFlags.BPC + 1);
    //public double itime[] = new double[2];
    this.itime = new_double(2);
    this.sideinfo_len = 0;

    /* variables for newmdct.c */
    //public float sb_sample[][][][] = new float[2][2][18][Encoder.SBLIMIT];
    this.sb_sample = new_float_n([2, 2, 18, Encoder.SBLIMIT]);
    this.amp_filter = new_float(32);

    /* variables for BitStream */

    /**
     * <PRE>
     * mpeg1: buffer=511 bytes  smallest frame: 96-38(sideinfo)=58
     * max number of frames in reservoir:  8
     * mpeg2: buffer=255 bytes.  smallest frame: 24-23bytes=1
     * with VBR, if you are encoding all silence, it is possible to
     * have 8kbs/24khz frames with 1byte of data each, which means we need
     * to buffer up to 255 headers!
     * </PRE>
     */
    /**
     * also, max_header_buf has to be a power of two
     */
    /**
     * max size of header is 38
     */

    function Header() {
        this.write_timing = 0;
        this.ptr = 0;
        //public byte buf[] = new byte[MAX_HEADER_LEN];
        this.buf = new_byte(MAX_HEADER_LEN);
    }

    this.header = new Array(LameInternalFlags.MAX_HEADER_BUF);

    this.h_ptr = 0;
    this.w_ptr = 0;
    this.ancillary_flag = 0;

    /* variables for Reservoir */
    /**
     * in bits
     */
    this.ResvSize = 0;
    /**
     * in bits
     */
    this.ResvMax = 0;

    //public ScaleFac scalefac_band = new ScaleFac();
    this.scalefac_band = new ScaleFac();

    /* daa from PsyModel */
    /* The static variables "r", "phi_sav", "new", "old" and "oldest" have */
    /* to be remembered for the unpredictability measure. For "r" and */
    /* "phi_sav", the first index from the left is the channel select and */
    /* the second index is the "age" of the data. */
    this.minval_l = new_float(Encoder.CBANDS);
    this.minval_s = new_float(Encoder.CBANDS);
    this.nb_1 = new_float_n([4, Encoder.CBANDS]);
    this.nb_2 = new_float_n([4, Encoder.CBANDS]);
    this.nb_s1 = new_float_n([4, Encoder.CBANDS]);
    this.nb_s2 = new_float_n([4, Encoder.CBANDS]);
    this.s3_ss = null;
    this.s3_ll = null;
    this.decay = 0.;

    //public III_psy_xmin[] thm = new III_psy_xmin[4];
    //public III_psy_xmin[] en = new III_psy_xmin[4];
    this.thm = new Array(4);
    this.en = new Array(4);

    /**
     * fft and energy calculation
     */
    this.tot_ener = new_float(4);

    /* loudness calculation (for adaptive threshold of hearing) */
    /**
     * loudness^2 approx. per granule and channel
     */
    this.loudness_sq = new_float_n([2, 2]);
    /**
     * account for granule delay of L3psycho_anal
     */
    this.loudness_sq_save = new_float(2);

    /**
     * Scale Factor Bands
     */
    this.mld_l = new_float(Encoder.SBMAX_l);
    this.mld_s = new_float(Encoder.SBMAX_s);
    this.bm_l = new_int(Encoder.SBMAX_l);
    this.bo_l = new_int(Encoder.SBMAX_l);
    this.bm_s = new_int(Encoder.SBMAX_s);
    this.bo_s = new_int(Encoder.SBMAX_s);
    this.npart_l = 0;
    this.npart_s = 0;

    this.s3ind = new_int_n([Encoder.CBANDS, 2]);
    this.s3ind_s = new_int_n([Encoder.CBANDS, 2]);

    this.numlines_s = new_int(Encoder.CBANDS);
    this.numlines_l = new_int(Encoder.CBANDS);
    this.rnumlines_l = new_float(Encoder.CBANDS);
    this.mld_cb_l = new_float(Encoder.CBANDS);
    this.mld_cb_s = new_float(Encoder.CBANDS);
    this.numlines_s_num1 = 0;
    this.numlines_l_num1 = 0;

    /* ratios */
    this.pe = new_float(4);
    this.ms_ratio_s_old = 0.;
    this.ms_ratio_l_old = 0.;
    this.ms_ener_ratio_old = 0.;

    /**
     * block type
     */
    this.blocktype_old = new_int(2);

    /**
     * variables used for --nspsytune
     */
    this.nsPsy = new NsPsy();

    /**
     * used for Xing VBR header
     */
    this.VBR_seek_table = new VBRSeekInfo();

    /**
     * all ATH related stuff
     */
        //public ATH ATH;
    this.ATH = null;

    this.PSY = null;

    this.nogap_total = 0;
    this.nogap_current = 0;

    /* ReplayGain */
    this.decode_on_the_fly = true;
    this.findReplayGain = true;
    this.findPeakSample = true;
    this.PeakSample = 0.;
    this.RadioGain = 0;
    this.AudiophileGain = 0;
    //public ReplayGain rgdata;
    this.rgdata = null;

    /**
     * gain change required for preventing clipping
     */
    this.noclipGainChange = 0;
    /**
     * user-specified scale factor required for preventing clipping
     */
    this.noclipScale = 0.;

    /* simple statistics */
    this.bitrate_stereoMode_Hist = new_int_n([16, 4 + 1]);
    /**
     * norm/start/short/stop/mixed(short)/sum
     */
    this.bitrate_blockType_Hist = new_int_n([16, 4 + 1 + 1]);

    //public PlottingData pinfo;
    //public MPGLib.mpstr_tag hip;
    this.pinfo = null;
    this.hip = null;

    this.in_buffer_nsamples = 0;
    //public float[] in_buffer_0;
    //public float[] in_buffer_1;
    this.in_buffer_0 = null;
    this.in_buffer_1 = null;

    //public IIterationLoop iteration_loop;
    this.iteration_loop = null;

    for (var i = 0; i < this.en.length; i++) {
        this.en[i] = new III_psy_xmin();
    }
    for (var i = 0; i < this.thm.length; i++) {
        this.thm[i] = new III_psy_xmin();
    }
    for (var i = 0; i < this.header.length; i++) {
        this.header[i] = new Header();
    }

}

module.exports = LameInternalFlags;
