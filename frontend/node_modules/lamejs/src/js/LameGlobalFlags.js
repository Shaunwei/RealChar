var MPEGMode = require('./MPEGMode.js');

function LameGlobalFlags() {

    this.class_id = 0;

    /* input description */

    /**
     * number of samples. default=-1
     */
    this.num_samples = 0;
    /**
     * input number of channels. default=2
     */
    this.num_channels = 0;
    /**
     * input_samp_rate in Hz. default=44.1 kHz
     */
    this.in_samplerate = 0;
    /**
     * output_samp_rate. default: LAME picks best value at least not used for
     * MP3 decoding: Remember 44.1 kHz MP3s and AC97
     */
    this.out_samplerate = 0;
    /**
     * scale input by this amount before encoding at least not used for MP3
     * decoding
     */
    this.scale = 0.;
    /**
     * scale input of channel 0 (left) by this amount before encoding
     */
    this.scale_left = 0.;
    /**
     * scale input of channel 1 (right) by this amount before encoding
     */
    this.scale_right = 0.;

    /* general control params */
    /**
     * collect data for a MP3 frame analyzer?
     */
    this.analysis = false;
    /**
     * add Xing VBR tag?
     */
    this.bWriteVbrTag = false;

    /**
     * use lame/mpglib to convert mp3 to wav
     */
    this.decode_only = false;
    /**
     * quality setting 0=best, 9=worst default=5
     */
    this.quality = 0;
    /**
     * see enum default = LAME picks best value
     */
    this.mode = MPEGMode.STEREO;
    /**
     * force M/S mode. requires mode=1
     */
    this.force_ms = false;
    /**
     * use free format? default=0
     */
    this.free_format = false;
    /**
     * find the RG value? default=0
     */
    this.findReplayGain = false;
    /**
     * decode on the fly? default=0
     */
    this.decode_on_the_fly = false;
    /**
     * 1 (default) writes ID3 tags, 0 not
     */
    this.write_id3tag_automatic = false;

    /*
     * set either brate>0 or compression_ratio>0, LAME will compute the value of
     * the variable not set. Default is compression_ratio = 11.025
     */
    /**
     * bitrate
     */
    this.brate = 0;
    /**
     * sizeof(wav file)/sizeof(mp3 file)
     */
    this.compression_ratio = 0.;

    /* frame params */
    /**
     * mark as copyright. default=0
     */
    this.copyright = 0;
    /**
     * mark as original. default=1
     */
    this.original = 0;
    /**
     * the MP3 'private extension' bit. Meaningless
     */
    this.extension = 0;
    /**
     * Input PCM is emphased PCM (for instance from one of the rarely emphased
     * CDs), it is STRONGLY not recommended to use this, because psycho does not
     * take it into account, and last but not least many decoders don't care
     * about these bits
     */
    this.emphasis = 0;
    /**
     * use 2 bytes per frame for a CRC checksum. default=0
     */
    this.error_protection = 0;
    /**
     * enforce ISO spec as much as possible
     */
    this.strict_ISO = false;

    /**
     * use bit reservoir?
     */
    this.disable_reservoir = false;

    /* quantization/noise shaping */
    this.quant_comp = 0;
    this.quant_comp_short = 0;
    this.experimentalY = false;
    this.experimentalZ = 0;
    this.exp_nspsytune = 0;

    this.preset = 0;

    /* VBR control */
    this.VBR = null;
    /**
     * Range [0,...,1[
     */
    this.VBR_q_frac = 0.;
    /**
     * Range [0,...,9]
     */
    this.VBR_q = 0;
    this.VBR_mean_bitrate_kbps = 0;
    this.VBR_min_bitrate_kbps = 0;
    this.VBR_max_bitrate_kbps = 0;
    /**
     * strictly enforce VBR_min_bitrate normaly, it will be violated for analog
     * silence
     */
    this.VBR_hard_min = 0;

    /* resampling and filtering */

    /**
     * freq in Hz. 0=lame choses. -1=no filter
     */
    this.lowpassfreq = 0;
    /**
     * freq in Hz. 0=lame choses. -1=no filter
     */
    this.highpassfreq = 0;
    /**
     * freq width of filter, in Hz (default=15%)
     */
    this.lowpasswidth = 0;
    /**
     * freq width of filter, in Hz (default=15%)
     */
    this.highpasswidth = 0;

    /*
     * psycho acoustics and other arguments which you should not change unless
     * you know what you are doing
     */

    this.maskingadjust = 0.;
    this.maskingadjust_short = 0.;
    /**
     * only use ATH
     */
    this.ATHonly = false;
    /**
     * only use ATH for short blocks
     */
    this.ATHshort = false;
    /**
     * disable ATH
     */
    this.noATH = false;
    /**
     * select ATH formula
     */
    this.ATHtype = 0;
    /**
     * change ATH formula 4 shape
     */
    this.ATHcurve = 0.;
    /**
     * lower ATH by this many db
     */
    this.ATHlower = 0.;
    /**
     * select ATH auto-adjust scheme
     */
    this.athaa_type = 0;
    /**
     * select ATH auto-adjust loudness calc
     */
    this.athaa_loudapprox = 0;
    /**
     * dB, tune active region of auto-level
     */
    this.athaa_sensitivity = 0.;
    this.short_blocks = null;
    /**
     * use temporal masking effect
     */
    this.useTemporal = false;
    this.interChRatio = 0.;
    /**
     * Naoki's adjustment of Mid/Side maskings
     */
    this.msfix = 0.;

    /**
     * 0 off, 1 on
     */
    this.tune = false;
    /**
     * used to pass values for debugging and stuff
     */
    this.tune_value_a = 0.;

    /************************************************************************/
    /* internal variables, do not set... */
    /* provided because they may be of use to calling application */
    /************************************************************************/

    /**
     * 0=MPEG-2/2.5 1=MPEG-1
     */
    this.version = 0;
    this.encoder_delay = 0;
    /**
     * number of samples of padding appended to input
     */
    this.encoder_padding = 0;
    this.framesize = 0;
    /**
     * number of frames encoded
     */
    this.frameNum = 0;
    /**
     * is this struct owned by calling program or lame?
     */
    this.lame_allocated_gfp = 0;
    /**************************************************************************/
    /* more internal variables are stored in this structure: */
    /**************************************************************************/
    this.internal_flags = null;
}

module.exports = LameGlobalFlags;
