package mp3;

import mpg.MPGLib;

public class LameInternalFlags {

	public static final int MFSIZE = (3 * 1152 + Encoder.ENCDELAY - Encoder.MDCTDELAY);

	public LameInternalFlags() {
		for (int i = 0; i < en.length; i++) {
			en[i] = new III_psy_xmin();
		}
		for (int i = 0; i < thm.length; i++) {
			thm[i] = new III_psy_xmin();
		}
		for (int i = 0; i < header.length; i++) {
			header[i] = new Header();
		}
	}

	public static final int MAX_BITS_PER_CHANNEL = 4095;
	public static final int MAX_BITS_PER_GRANULE = 7680;

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
	public long Class_ID;

	public int lame_encode_frame_init;
	public int iteration_init_init;
	public int fill_buffer_resample_init;

	public float mfbuf[][] = new float[2][MFSIZE];

	/**
	 * granules per frame
	 */
	public int mode_gr;
	/**
	 * number of channels in the input data stream (PCM or decoded PCM)
	 */
	public int channels_in;
	/**
	 * number of channels in the output data stream (not used for decoding)
	 */
	public int channels_out;
	/**
	 * input_samp_rate/output_samp_rate
	 */
	public double resample_ratio;

	public int mf_samples_to_encode;
	public int mf_size;
	/**
	 * min bitrate index
	 */
	public int VBR_min_bitrate;
	/**
	 * max bitrate index
	 */
	public int VBR_max_bitrate;
	public int bitrate_index;
	public int samplerate_index;
	public int mode_ext;

	/* lowpass and highpass filter control */
	/**
	 * normalized frequency bounds of passband
	 */
	public float lowpass1, lowpass2;
	/**
	 * normalized frequency bounds of passband
	 */
	public float highpass1, highpass2;

	/**
	 * 0 = none 1 = ISO AAC model 2 = allow scalefac_select=1
	 */
	public int noise_shaping;

	/**
	 * 0 = ISO model: amplify all distorted bands<BR>
	 * 1 = amplify within 50% of max (on db scale)<BR>
	 * 2 = amplify only most distorted band<BR>
	 * 3 = method 1 and refine with method 2<BR>
	 */
	public int noise_shaping_amp;
	/**
	 * 0 = no substep<BR>
	 * 1 = use substep shaping at last step(VBR only)<BR>
	 * (not implemented yet)<BR>
	 * 2 = use substep inside loop<BR>
	 * 3 = use substep inside loop and last step<BR>
	 */
	public int substep_shaping;

	/**
	 * 1 = gpsycho. 0 = none
	 */
	public int psymodel;
	/**
	 * 0 = stop at over=0, all scalefacs amplified or<BR>
	 * a scalefac has reached max value<BR>
	 * 1 = stop when all scalefacs amplified or a scalefac has reached max value<BR>
	 * 2 = stop when all scalefacs amplified
	 */
	public int noise_shaping_stop;

	/**
	 * 0 = no, 1 = yes
	 */
	public int subblock_gain;
	/**
	 * 0 = no. 1=outside loop 2=inside loop(slow)
	 */
	public int use_best_huffman;

	/**
	 * 0 = stop early after 0 distortion found. 1 = full search
	 */
	public int full_outer_loop;

	public IIISideInfo l3_side = new IIISideInfo();
	public float ms_ratio[] = new float[2];

	/* used for padding */
	/**
	 * padding for the current frame?
	 */
	public int padding;
	public int frac_SpF;
	public int slot_lag;

	/**
	 * optional ID3 tags
	 */
	public ID3TagSpec tag_spec;
	public int nMusicCRC;

	/* variables used by Quantize */
	public int OldValue[] = new int[2];
	public int CurrentStep[] = new int[2];

	public float masking_lower;
	public int bv_scf[] = new int[576];
	public int pseudohalf[] = new int[L3Side.SFBMAX];

	/**
	 * will be set in lame_init_params
	 */
	public boolean sfb21_extra;

	/* BPC = maximum number of filter convolution windows to precompute */
	public static final int BPC = 320;
	public float[][] inbuf_old = new float[2][];
	public float[][] blackfilt = new float[2 * BPC + 1][];
	public double itime[] = new double[2];
	public int sideinfo_len;

	/* variables for newmdct.c */
	public float sb_sample[][][][] = new float[2][2][18][Encoder.SBLIMIT];
	public float amp_filter[] = new float[32];

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
	public static final int MAX_HEADER_BUF = 256;
	/**
	 * max size of header is 38
	 */
	private static final int MAX_HEADER_LEN = 40;

	public static class Header {
		public int write_timing;
		public int ptr;
		public byte buf[] = new byte[MAX_HEADER_LEN];
	}

	public Header[] header = new Header[MAX_HEADER_BUF];

	public int h_ptr;
	public int w_ptr;
	public int ancillary_flag;

	/* variables for Reservoir */
	/**
	 * in bits
	 */
	public int ResvSize;
	/**
	 * in bits
	 */
	public int ResvMax;

	public ScaleFac scalefac_band = new ScaleFac();

	/* daa from PsyModel */
	/* The static variables "r", "phi_sav", "new", "old" and "oldest" have */
	/* to be remembered for the unpredictability measure. For "r" and */
	/* "phi_sav", the first index from the left is the channel select and */
	/* the second index is the "age" of the data. */
	public float minval_l[] = new float[Encoder.CBANDS];
	public float minval_s[] = new float[Encoder.CBANDS];
	public float nb_1[][] = new float[4][Encoder.CBANDS],
			nb_2[][] = new float[4][Encoder.CBANDS];
	public float nb_s1[][] = new float[4][Encoder.CBANDS],
			nb_s2[][] = new float[4][Encoder.CBANDS];
	public float[] s3_ss;
	public float[] s3_ll;
	public float decay;

	public III_psy_xmin[] thm = new III_psy_xmin[4];
	public III_psy_xmin[] en = new III_psy_xmin[4];

	/**
	 * fft and energy calculation
	 */
	public float tot_ener[] = new float[4];

	/* loudness calculation (for adaptive threshold of hearing) */
	/**
	 * loudness^2 approx. per granule and channel
	 */
	public float loudness_sq[][] = new float[2][2];
	/**
	 * account for granule delay of L3psycho_anal
	 */
	public float loudness_sq_save[] = new float[2];

	/**
	 * Scale Factor Bands
	 */
	public float mld_l[] = new float[Encoder.SBMAX_l],
			mld_s[] = new float[Encoder.SBMAX_s];
	public int bm_l[] = new int[Encoder.SBMAX_l],
			bo_l[] = new int[Encoder.SBMAX_l];
	public int bm_s[] = new int[Encoder.SBMAX_s],
			bo_s[] = new int[Encoder.SBMAX_s];
	public int npart_l, npart_s;

	public int s3ind[][] = new int[Encoder.CBANDS][2];
	public int s3ind_s[][] = new int[Encoder.CBANDS][2];

	public int numlines_s[] = new int[Encoder.CBANDS];
	public int numlines_l[] = new int[Encoder.CBANDS];
	public float rnumlines_l[] = new float[Encoder.CBANDS];
	public float mld_cb_l[] = new float[Encoder.CBANDS],
			mld_cb_s[] = new float[Encoder.CBANDS];
	public int numlines_s_num1;
	public int numlines_l_num1;

	/* ratios */
	public float pe[] = new float[4];
	public float ms_ratio_s_old, ms_ratio_l_old;
	public float ms_ener_ratio_old;

	/**
	 * block type
	 */
	public int blocktype_old[] = new int[2];

	/**
	 * variables used for --nspsytune
	 */
	public NsPsy nsPsy = new NsPsy();

	/**
	 * used for Xing VBR header
	 */
	public VBRSeekInfo VBR_seek_table = new VBRSeekInfo();

	/**
	 * all ATH related stuff
	 */
	public ATH ATH;

	public PSY PSY;

	public int nogap_total;
	public int nogap_current;

	/* ReplayGain */
	public boolean decode_on_the_fly = true;
	public boolean findReplayGain = true;
	public boolean findPeakSample = true;
	public float PeakSample;
	public int RadioGain;
	public int AudiophileGain;
	public ReplayGain rgdata;

	/**
	 * gain change required for preventing clipping
	 */
	public int noclipGainChange;
	/**
	 * user-specified scale factor required for preventing clipping
	 */
	public float noclipScale;

	/* simple statistics */
	public int bitrate_stereoMode_Hist[][] = new int[16][4 + 1];
	/**
	 * norm/start/short/stop/mixed(short)/sum
	 */
	public int bitrate_blockType_Hist[][] = new int[16][4 + 1 + 1];

	public PlottingData pinfo;
	public MPGLib.mpstr_tag hip;

	public int in_buffer_nsamples;
	public float[] in_buffer_0;
	public float[] in_buffer_1;

	public IIterationLoop iteration_loop;

}
