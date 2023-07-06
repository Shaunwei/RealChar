package mp3;

/**
 * Control Parameters set by User. These parameters are here for backwards
 * compatibility with the old, non-shared lib API. Please use the
 * lame_set_variablename() functions below
 * 
 * @author Ken
 * 
 */
public class LameGlobalFlags {

	public long class_id;

	/* input description */

	/**
	 * number of samples. default=-1
	 */
	public int num_samples;
	/**
	 * input number of channels. default=2
	 */
	public int num_channels;
	/**
	 * input_samp_rate in Hz. default=44.1 kHz
	 */
	public int in_samplerate;
	/**
	 * output_samp_rate. default: LAME picks best value at least not used for
	 * MP3 decoding: Remember 44.1 kHz MP3s and AC97
	 */
	public int out_samplerate;
	/**
	 * scale input by this amount before encoding at least not used for MP3
	 * decoding
	 */
	public float scale;
	/**
	 * scale input of channel 0 (left) by this amount before encoding
	 */
	public float scale_left;
	/**
	 * scale input of channel 1 (right) by this amount before encoding
	 */
	public float scale_right;

	/* general control params */
	/**
	 * collect data for a MP3 frame analyzer?
	 */
	public boolean analysis;
	/**
	 * add Xing VBR tag?
	 */
	public boolean bWriteVbrTag;
	/**
	 * use lame/mpglib to convert mp3 to wav
	 */
	public boolean decode_only;
	/**
	 * quality setting 0=best, 9=worst default=5
	 */
	public int quality;
	/**
	 * see enum default = LAME picks best value
	 */
	public MPEGMode mode = MPEGMode.STEREO;
	/**
	 * force M/S mode. requires mode=1
	 */
	public boolean force_ms;
	/**
	 * use free format? default=0
	 */
	public boolean free_format;
	/**
	 * find the RG value? default=0
	 */
	public boolean findReplayGain;
	/**
	 * decode on the fly? default=0
	 */
	public boolean decode_on_the_fly;
	/**
	 * 1 (default) writes ID3 tags, 0 not
	 */
	public boolean write_id3tag_automatic;

	/*
	 * set either brate>0 or compression_ratio>0, LAME will compute the value of
	 * the variable not set. Default is compression_ratio = 11.025
	 */
	/**
	 * bitrate
	 */
	public int brate;
	/**
	 * sizeof(wav file)/sizeof(mp3 file)
	 */
	public float compression_ratio;

	/* frame params */
	/**
	 * mark as copyright. default=0
	 */
	public int copyright;
	/**
	 * mark as original. default=1
	 */
	public int original;
	/**
	 * the MP3 'private extension' bit. Meaningless
	 */
	public int extension;
	/**
	 * Input PCM is emphased PCM (for instance from one of the rarely emphased
	 * CDs), it is STRONGLY not recommended to use this, because psycho does not
	 * take it into account, and last but not least many decoders don't care
	 * about these bits
	 */
	public int emphasis;
	/**
	 * use 2 bytes per frame for a CRC checksum. default=0
	 */
	public boolean error_protection;
	/**
	 * enforce ISO spec as much as possible
	 */
	public boolean strict_ISO;

	/**
	 * use bit reservoir?
	 */
	public boolean disable_reservoir;

	/* quantization/noise shaping */
	public int quant_comp;
	public int quant_comp_short;
	public boolean experimentalY;
	public int experimentalZ;
	public int exp_nspsytune;

	public int preset;

	/* VBR control */
	public VbrMode VBR;
	/**
	 * Range [0,...,1[
	 */
	public float VBR_q_frac;
	/**
	 * Range [0,...,9]
	 */
	public int VBR_q;
	public int VBR_mean_bitrate_kbps;
	public int VBR_min_bitrate_kbps;
	public int VBR_max_bitrate_kbps;
	/**
	 * strictly enforce VBR_min_bitrate normaly, it will be violated for analog
	 * silence
	 */
	public int VBR_hard_min;

	/* resampling and filtering */

	/**
	 * freq in Hz. 0=lame choses. -1=no filter
	 */
	public int lowpassfreq;
	/**
	 * freq in Hz. 0=lame choses. -1=no filter
	 */
	public int highpassfreq;
	/**
	 * freq width of filter, in Hz (default=15%)
	 */
	public int lowpasswidth;
	/**
	 * freq width of filter, in Hz (default=15%)
	 */
	public int highpasswidth;

	/*
	 * psycho acoustics and other arguments which you should not change unless
	 * you know what you are doing
	 */

	public float maskingadjust;
	public float maskingadjust_short;
	/**
	 * only use ATH
	 */
	public boolean ATHonly;
	/**
	 * only use ATH for short blocks
	 */
	public boolean ATHshort;
	/**
	 * disable ATH
	 */
	public boolean noATH;
	/**
	 * select ATH formula
	 */
	public int ATHtype;
	/**
	 * change ATH formula 4 shape
	 */
	public float ATHcurve;
	/**
	 * lower ATH by this many db
	 */
	public float ATHlower;
	/**
	 * select ATH auto-adjust scheme
	 */
	public int athaa_type;
	/**
	 * select ATH auto-adjust loudness calc
	 */
	public int athaa_loudapprox;
	/**
	 * dB, tune active region of auto-level
	 */
	public float athaa_sensitivity;
	public ShortBlock short_blocks;
	/**
	 * use temporal masking effect
	 */
	public Boolean useTemporal;
	public float interChRatio;
	/**
	 * Naoki's adjustment of Mid/Side maskings
	 */
	public float msfix;

	/**
	 * 0 off, 1 on
	 */
	public boolean tune;
	/**
	 * used to pass values for debugging and stuff
	 */
	public float tune_value_a;

	/************************************************************************/
	/* internal variables, do not set... */
	/* provided because they may be of use to calling application */
	/************************************************************************/

	/**
	 * 0=MPEG-2/2.5 1=MPEG-1
	 */
	public int version;
	public int encoder_delay;
	/**
	 * number of samples of padding appended to input
	 */
	public int encoder_padding;
	public int framesize;
	/**
	 * number of frames encoded
	 */
	public int frameNum;
	/**
	 * is this struct owned by calling program or lame?
	 */
	public int lame_allocated_gfp;
	/**************************************************************************/
	/* more internal variables are stored in this structure: */
	/**************************************************************************/
	public LameInternalFlags internal_flags;

}
