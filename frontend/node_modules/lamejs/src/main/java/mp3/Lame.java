/*
 *      LAME MP3 encoding engine
 *
 *      Copyright (c) 1999-2000 Mark Taylor
 *      Copyright (c) 2000-2005 Takehiro Tominaga
 *      Copyright (c) 2000-2005 Robert Hegemann
 *      Copyright (c) 2000-2005 Gabriel Bouvigne
 *      Copyright (c) 2000-2004 Alexander Leidinger
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

/* $Id: Lame.java,v 1.38 2011/05/24 21:15:54 kenchis Exp $ */

package mp3;

import mpg.MPGLib;

public class Lame {
	GainAnalysis ga;
	BitStream bs;
	Presets p;
	QuantizePVT qupvt;
	Quantize qu;
	PsyModel psy = new PsyModel();
	VBRTag vbr;
	Version ver;
	ID3Tag id3;
	MPGLib mpglib;
	public Encoder enc = new Encoder();

	public final void setModules(GainAnalysis ga, BitStream bs, Presets p,
			QuantizePVT qupvt, Quantize qu, VBRTag vbr, Version ver,
			ID3Tag id3, MPGLib mpglib) {
		this.ga = ga;
		this.bs = bs;
		this.p = p;
		this.qupvt = qupvt;
		this.qu = qu;
		this.vbr = vbr;
		this.ver = ver;
		this.id3 = id3;
		this.mpglib = mpglib;
		this.enc.setModules(bs, psy, qupvt, vbr);
	}

	public static final long LAME_ID = 0xFFF88E3B;

	/* presets */
	/* values from 8 to 320 should be reserved for abr bitrates */
	/* for abr I'd suggest to directly use the targeted bitrate as a value */

	public static final int V9 = 410;
	public static final int V8 = 420;
	public static final int V7 = 430;
	public static final int V6 = 440;
	public static final int V5 = 450;
	public static final int V4 = 460;
	public static final int V3 = 470;
	public static final int V2 = 480;
	public static final int V1 = 490;
	public static final int V0 = 500;

	/* still there for compatibility */

	public static final int R3MIX = 1000;
	public static final int STANDARD = 1001;
	public static final int EXTREME = 1002;
	public static final int INSANE = 1003;
	public static final int STANDARD_FAST = 1004;
	public static final int EXTREME_FAST = 1005;
	public static final int MEDIUM = 1006;
	public static final int MEDIUM_FAST = 1007;

	/**
	 * maximum size of albumart image (128KB), which affects LAME_MAXMP3BUFFER
	 * as well since lame_encode_buffer() also returns ID3v2 tag data
	 */
	static final int LAME_MAXALBUMART = (128 * 1024);

	/**
	 * maximum size of mp3buffer needed if you encode at most 1152 samples for
	 * each call to lame_encode_buffer. see lame_encode_buffer() below
	 * (LAME_MAXMP3BUFFER is now obsolete)
	 */
	public static final int LAME_MAXMP3BUFFER = (16384 + LAME_MAXALBUMART);

	private static final int LAME_DEFAULT_QUALITY = 3;

	private float filter_coef(final float x) {
		if (x > 1.0)
			return 0.0f;
		if (x <= 0.0)
			return 1.0f;

		return (float) Math.cos(Math.PI / 2 * x);
	}

	private void lame_init_params_ppflt(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;
		/***************************************************************/
		/* compute info needed for polyphase filter (filter type==0, default) */
		/***************************************************************/

		int lowpass_band = 32;
		int highpass_band = -1;

		if (gfc.lowpass1 > 0) {
			int minband = 999;
			for (int band = 0; band <= 31; band++) {
				float freq = (float) (band / 31.0);
				/* this band and above will be zeroed: */
				if (freq >= gfc.lowpass2) {
					lowpass_band = Math.min(lowpass_band, band);
				}
				if (gfc.lowpass1 < freq && freq < gfc.lowpass2) {
					minband = Math.min(minband, band);
				}
			}

			/*
			 * compute the *actual* transition band implemented by the polyphase
			 * filter
			 */
			if (minband == 999) {
				gfc.lowpass1 = (lowpass_band - .75f) / 31.0f;
			} else {
				gfc.lowpass1 = (minband - .75f) / 31.0f;
			}
			gfc.lowpass2 = lowpass_band / 31.0f;
		}

		/*
		 * make sure highpass filter is within 90% of what the effective
		 * highpass frequency will be
		 */
		if (gfc.highpass2 > 0) {
			if (gfc.highpass2 < .9 * (.75 / 31.0)) {
				gfc.highpass1 = 0;
				gfc.highpass2 = 0;
				System.err.println("Warning: highpass filter disabled.  "
						+ "highpass frequency too small\n");
			}
		}

		if (gfc.highpass2 > 0) {
			int maxband = -1;
			for (int band = 0; band <= 31; band++) {
				float freq = band / 31.0f;
				/* this band and below will be zereod */
				if (freq <= gfc.highpass1) {
					highpass_band = Math.max(highpass_band, band);
				}
				if (gfc.highpass1 < freq && freq < gfc.highpass2) {
					maxband = Math.max(maxband, band);
				}
			}
			/*
			 * compute the *actual* transition band implemented by the polyphase
			 * filter
			 */
			gfc.highpass1 = highpass_band / 31.0f;
			if (maxband == -1) {
				gfc.highpass2 = (highpass_band + .75f) / 31.0f;
			} else {
				gfc.highpass2 = (maxband + .75f) / 31.0f;
			}
		}

		for (int band = 0; band < 32; band++) {
			double fc1, fc2;
			float freq = band / 31.0f;
			if (gfc.highpass2 > gfc.highpass1) {
				fc1 = filter_coef((gfc.highpass2 - freq)
						/ (gfc.highpass2 - gfc.highpass1 + 1e-20f));
			} else {
				fc1 = 1.0;
			}
			if (gfc.lowpass2 > gfc.lowpass1) {
				fc2 = filter_coef((freq - gfc.lowpass1)
						/ (gfc.lowpass2 - gfc.lowpass1 + 1e-20f));
			} else {
				fc2 = 1.0;
			}
			gfc.amp_filter[band] = (float) (fc1 * fc2);
		}
	}

	protected static class LowPassHighPass {
		double lowerlimit;
	}

	private static class BandPass {
		public BandPass(int bitrate, int lPass) {
			lowpass = lPass;
		}

		public int lowpass;
	}

	private void optimum_bandwidth(final LowPassHighPass lh, final int bitrate) {
		/**
		 * <PRE>
		 *  Input:
		 *      bitrate     total bitrate in kbps
		 * 
		 *   Output:
		 *      lowerlimit: best lowpass frequency limit for input filter in Hz
		 *      upperlimit: best highpass frequency limit for input filter in Hz
		 * </PRE>
		 */
		final BandPass freq_map[] = new BandPass[] { new BandPass(8, 2000),
				new BandPass(16, 3700), new BandPass(24, 3900),
				new BandPass(32, 5500), new BandPass(40, 7000),
				new BandPass(48, 7500), new BandPass(56, 10000),
				new BandPass(64, 11000), new BandPass(80, 13500),
				new BandPass(96, 15100), new BandPass(112, 15600),
				new BandPass(128, 17000), new BandPass(160, 17500),
				new BandPass(192, 18600), new BandPass(224, 19400),
				new BandPass(256, 19700), new BandPass(320, 20500) };

		int table_index = nearestBitrateFullIndex(bitrate);
		lh.lowerlimit = freq_map[table_index].lowpass;
	}

	private int optimum_samplefreq(final int lowpassfreq,
			final int input_samplefreq) {
		/*
		 * Rules:
		 * 
		 * - if possible, sfb21 should NOT be used
		 */
		int suggested_samplefreq = 44100;

		if (input_samplefreq >= 48000)
			suggested_samplefreq = 48000;
		else if (input_samplefreq >= 44100)
			suggested_samplefreq = 44100;
		else if (input_samplefreq >= 32000)
			suggested_samplefreq = 32000;
		else if (input_samplefreq >= 24000)
			suggested_samplefreq = 24000;
		else if (input_samplefreq >= 22050)
			suggested_samplefreq = 22050;
		else if (input_samplefreq >= 16000)
			suggested_samplefreq = 16000;
		else if (input_samplefreq >= 12000)
			suggested_samplefreq = 12000;
		else if (input_samplefreq >= 11025)
			suggested_samplefreq = 11025;
		else if (input_samplefreq >= 8000)
			suggested_samplefreq = 8000;

		if (lowpassfreq == -1)
			return suggested_samplefreq;

		if (lowpassfreq <= 15960)
			suggested_samplefreq = 44100;
		if (lowpassfreq <= 15250)
			suggested_samplefreq = 32000;
		if (lowpassfreq <= 11220)
			suggested_samplefreq = 24000;
		if (lowpassfreq <= 9970)
			suggested_samplefreq = 22050;
		if (lowpassfreq <= 7230)
			suggested_samplefreq = 16000;
		if (lowpassfreq <= 5420)
			suggested_samplefreq = 12000;
		if (lowpassfreq <= 4510)
			suggested_samplefreq = 11025;
		if (lowpassfreq <= 3970)
			suggested_samplefreq = 8000;

		if (input_samplefreq < suggested_samplefreq) {
			/*
			 * choose a valid MPEG sample frequency above the input sample
			 * frequency to avoid SFB21/12 bitrate bloat rh 061115
			 */
			if (input_samplefreq > 44100) {
				return 48000;
			}
			if (input_samplefreq > 32000) {
				return 44100;
			}
			if (input_samplefreq > 24000) {
				return 32000;
			}
			if (input_samplefreq > 22050) {
				return 24000;
			}
			if (input_samplefreq > 16000) {
				return 22050;
			}
			if (input_samplefreq > 12000) {
				return 16000;
			}
			if (input_samplefreq > 11025) {
				return 12000;
			}
			if (input_samplefreq > 8000) {
				return 11025;
			}
			return 8000;
		}
		return suggested_samplefreq;
	}

	/**
	 * set internal feature flags. USER should not access these since some
	 * combinations will produce strange results
	 */
	private void lame_init_qval(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;

		switch (gfp.quality) {
		default:
		case 9: /* no psymodel, no noise shaping */
			gfc.psymodel = 0;
			gfc.noise_shaping = 0;
			gfc.noise_shaping_amp = 0;
			gfc.noise_shaping_stop = 0;
			gfc.use_best_huffman = 0;
			gfc.full_outer_loop = 0;
			break;

		case 8:
			gfp.quality = 7;
			//$FALL-THROUGH$
		case 7:
			/*
			 * use psymodel (for short block and m/s switching), but no noise
			 * shapping
			 */
			gfc.psymodel = 1;
			gfc.noise_shaping = 0;
			gfc.noise_shaping_amp = 0;
			gfc.noise_shaping_stop = 0;
			gfc.use_best_huffman = 0;
			gfc.full_outer_loop = 0;
			break;

		case 6:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			gfc.noise_shaping_amp = 0;
			gfc.noise_shaping_stop = 0;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 0;
			gfc.full_outer_loop = 0;
			break;

		case 5:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			gfc.noise_shaping_amp = 0;
			gfc.noise_shaping_stop = 0;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 0;
			gfc.full_outer_loop = 0;
			break;

		case 4:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			gfc.noise_shaping_amp = 0;
			gfc.noise_shaping_stop = 0;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 1;
			gfc.full_outer_loop = 0;
			break;

		case 3:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			gfc.noise_shaping_amp = 1;
			gfc.noise_shaping_stop = 1;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 1;
			gfc.full_outer_loop = 0;
			break;

		case 2:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			if (gfc.substep_shaping == 0)
				gfc.substep_shaping = 2;
			gfc.noise_shaping_amp = 1;
			gfc.noise_shaping_stop = 1;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 1; /* inner loop */
			gfc.full_outer_loop = 0;
			break;

		case 1:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			if (gfc.substep_shaping == 0)
				gfc.substep_shaping = 2;
			gfc.noise_shaping_amp = 2;
			gfc.noise_shaping_stop = 1;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 1;
			gfc.full_outer_loop = 0;
			break;

		case 0:
			gfc.psymodel = 1;
			if (gfc.noise_shaping == 0)
				gfc.noise_shaping = 1;
			if (gfc.substep_shaping == 0)
				gfc.substep_shaping = 2;
			gfc.noise_shaping_amp = 2;
			gfc.noise_shaping_stop = 1;
			if (gfc.subblock_gain == -1)
				gfc.subblock_gain = 1;
			gfc.use_best_huffman = 1;
			/*
			 * type 2 disabled because of it slowness, in favor of full outer
			 * loop search
			 */
			gfc.full_outer_loop = 0;
			/*
			 * full outer loop search disabled because of audible distortions it
			 * may generate rh 060629
			 */
			break;
		}

	}

	private double linear_int(final double a, final double b, final double m) {
		return a + m * (b - a);
	}

	/**
	 * @param bRate
	 *            legal rates from 8 to 320
	 */
	private int FindNearestBitrate(final int bRate, int version,
			final int samplerate) {
		/* MPEG-1 or MPEG-2 LSF */
		if (samplerate < 16000)
			version = 2;

		int bitrate = Tables.bitrate_table[version][1];

		for (int i = 2; i <= 14; i++) {
			if (Tables.bitrate_table[version][i] > 0) {
				if (Math.abs(Tables.bitrate_table[version][i] - bRate) < Math
						.abs(bitrate - bRate))
					bitrate = Tables.bitrate_table[version][i];
			}
		}
		return bitrate;
	}

	/**
	 * Used to find table index when we need bitrate-based values determined
	 * using tables
	 * 
	 * bitrate in kbps
	 * 
	 * Gabriel Bouvigne 2002-11-03
	 */
	public final int nearestBitrateFullIndex(final int bitrate) {
		/* borrowed from DM abr presets */

		final int full_bitrate_table[] = { 8, 16, 24, 32, 40, 48, 56, 64, 80,
				96, 112, 128, 160, 192, 224, 256, 320 };

		int lower_range = 0, lower_range_kbps = 0, upper_range = 0, upper_range_kbps = 0;

		/* We assume specified bitrate will be 320kbps */
		upper_range_kbps = full_bitrate_table[16];
		upper_range = 16;
		lower_range_kbps = full_bitrate_table[16];
		lower_range = 16;

		/*
		 * Determine which significant bitrates the value specified falls
		 * between, if loop ends without breaking then we were correct above
		 * that the value was 320
		 */
		for (int b = 0; b < 16; b++) {
			if ((Math.max(bitrate, full_bitrate_table[b + 1])) != bitrate) {
				upper_range_kbps = full_bitrate_table[b + 1];
				upper_range = b + 1;
				lower_range_kbps = full_bitrate_table[b];
				lower_range = (b);
				break; /* We found upper range */
			}
		}

		/* Determine which range the value specified is closer to */
		if ((upper_range_kbps - bitrate) > (bitrate - lower_range_kbps)) {
			return lower_range;
		}
		return upper_range;
	}

	/**
	 * map frequency to a valid MP3 sample frequency
	 * 
	 * Robert Hegemann 2000-07-01
	 */
	private int map2MP3Frequency(final int freq) {
		if (freq <= 8000)
			return 8000;
		if (freq <= 11025)
			return 11025;
		if (freq <= 12000)
			return 12000;
		if (freq <= 16000)
			return 16000;
		if (freq <= 22050)
			return 22050;
		if (freq <= 24000)
			return 24000;
		if (freq <= 32000)
			return 32000;
		if (freq <= 44100)
			return 44100;

		return 48000;
	}

	/**
	 * convert samp freq in Hz to index
	 */
	private int SmpFrqIndex(final int sample_freq, final LameGlobalFlags gpf) {
		switch (sample_freq) {
		case 44100:
			gpf.version = 1;
			return 0;
		case 48000:
			gpf.version = 1;
			return 1;
		case 32000:
			gpf.version = 1;
			return 2;
		case 22050:
			gpf.version = 0;
			return 0;
		case 24000:
			gpf.version = 0;
			return 1;
		case 16000:
			gpf.version = 0;
			return 2;
		case 11025:
			gpf.version = 0;
			return 0;
		case 12000:
			gpf.version = 0;
			return 1;
		case 8000:
			gpf.version = 0;
			return 2;
		default:
			gpf.version = 0;
			return -1;
		}
	}

	/**
	 * @param bRate
	 *            legal rates from 32 to 448 kbps
	 * @param version
	 *            MPEG-1 or MPEG-2/2.5 LSF
	 */
	public final int BitrateIndex(final int bRate, int version,
			final int samplerate) {
		/* convert bitrate in kbps to index */
		if (samplerate < 16000)
			version = 2;
		for (int i = 0; i <= 14; i++) {
			if (Tables.bitrate_table[version][i] > 0) {
				if (Tables.bitrate_table[version][i] == bRate) {
					return i;
				}
			}
		}
		return -1;
	}

	/**
	 * Resampling via FIR filter, blackman window.
	 */
	private float blackman(float x, final float fcn, final int l) {
		/*
		 * This algorithm from: SIGNAL PROCESSING ALGORITHMS IN FORTRAN AND C
		 * S.D. Stearns and R.A. David, Prentice-Hall, 1992
		 */
		float wcn = (float) (Math.PI * fcn);

		x /= l;
		if (x < 0)
			x = 0;
		if (x > 1)
			x = 1;
		float x2 = x - .5f;

		float bkwn = 0.42f - 0.5f * (float) Math.cos(2 * x * Math.PI) + 0.08f
				* (float) Math.cos(4 * x * Math.PI);
		if (Math.abs(x2) < 1e-9)
			return (float) (wcn / Math.PI);
		else
			return (float) (bkwn * Math.sin(l * wcn * x2) / (Math.PI * l * x2));
	}

	/**
	 * Greatest common divisor.
	 * 
	 * Joint work of Euclid and M. Hendry
	 */
	private int gcd(final int i, final int j) {
		return j != 0 ? gcd(j, i % j) : i;
	}

	protected static class NumUsed {
		int num_used;
	}

	private int fill_buffer_resample(final LameGlobalFlags gfp,
			final float[] outbuf, final int outbufPos, final int desired_len,
			final float[] inbuf, final int in_bufferPos, final int len,
			final NumUsed num_used, final int ch) {
		final LameInternalFlags gfc = gfp.internal_flags;
		int i, j = 0, k;
		/* number of convolution functions to pre-compute */
		int bpc = gfp.out_samplerate
				/ gcd(gfp.out_samplerate, gfp.in_samplerate);
		if (bpc > LameInternalFlags.BPC)
			bpc = LameInternalFlags.BPC;

		float intratio = (Math.abs(gfc.resample_ratio
				- Math.floor(.5 + gfc.resample_ratio)) < .0001) ? 1 : 0;
		float fcn = 1.00f / (float) gfc.resample_ratio;
		if (fcn > 1.00)
			fcn = 1.00f;
		int filter_l = 31;
		if (0 == filter_l % 2)
			--filter_l; /* must be odd */
		filter_l += intratio; /* unless resample_ratio=int, it must be even */

		int BLACKSIZE = filter_l + 1; /* size of data needed for FIR */

		if (gfc.fill_buffer_resample_init == 0) {
			gfc.inbuf_old[0] = new float[BLACKSIZE];
			gfc.inbuf_old[1] = new float[BLACKSIZE];
			for (i = 0; i <= 2 * bpc; ++i)
				gfc.blackfilt[i] = new float[BLACKSIZE];

			gfc.itime[0] = 0;
			gfc.itime[1] = 0;

			/* precompute blackman filter coefficients */
			for (j = 0; j <= 2 * bpc; j++) {
				float sum = 0.f;
				float offset = (j - bpc) / (2.f * bpc);
				for (i = 0; i <= filter_l; i++)
					sum += gfc.blackfilt[j][i] = blackman(i - offset, fcn,
							filter_l);
				for (i = 0; i <= filter_l; i++)
					gfc.blackfilt[j][i] /= sum;
			}
			gfc.fill_buffer_resample_init = 1;
		}

		float[] inbuf_old = gfc.inbuf_old[ch];

		/* time of j'th element in inbuf = itime + j/ifreq; */
		/* time of k'th element in outbuf = j/ofreq */
		for (k = 0; k < desired_len; k++) {
			double time0;
			int joff;

			time0 = k * gfc.resample_ratio; /* time of k'th output sample */
			j = (int) Math.floor(time0 - gfc.itime[ch]);

			/* check if we need more input data */
			if ((filter_l + j - filter_l / 2) >= len)
				break;

			/* blackman filter. by default, window centered at j+.5(filter_l%2) */
			/* but we want a window centered at time0. */
			float offset = (float) (time0 - gfc.itime[ch] - (j + .5 * (filter_l % 2)));
			assert (Math.abs(offset) <= .501);

			/* find the closest precomputed window for this offset: */
			joff = (int) Math.floor((offset * 2 * bpc) + bpc + .5);

			float xvalue = 0.f;
			for (i = 0; i <= filter_l; ++i) {
				int j2 = i + j - filter_l / 2;
				float y;
				assert (j2 < len);
				assert (j2 + BLACKSIZE >= 0);
				y = (j2 < 0) ? inbuf_old[BLACKSIZE + j2] : inbuf[in_bufferPos
						+ j2];
				xvalue += y * gfc.blackfilt[joff][i];
			}
			outbuf[outbufPos + k] = xvalue;
		}

		/* k = number of samples added to outbuf */
		/* last k sample used data from [j-filter_l/2,j+filter_l-filter_l/2] */

		/* how many samples of input data were used: */
		num_used.num_used = Math.min(len, filter_l + j - filter_l / 2);

		/*
		 * adjust our input time counter. Incriment by the number of samples
		 * used, then normalize so that next output sample is at time 0, next
		 * input buffer is at time itime[ch]
		 */
		gfc.itime[ch] += num_used.num_used - k * gfc.resample_ratio;

		/* save the last BLACKSIZE samples into the inbuf_old buffer */
		if (num_used.num_used >= BLACKSIZE) {
			for (i = 0; i < BLACKSIZE; i++)
				inbuf_old[i] = inbuf[in_bufferPos + num_used.num_used + i
						- BLACKSIZE];
		} else {
			/* shift in num_used.num_used samples into inbuf_old */
			int n_shift = BLACKSIZE - num_used.num_used; /*
														 * number of samples to
														 * shift
														 */

			/*
			 * shift n_shift samples by num_used.num_used, to make room for the
			 * num_used new samples
			 */
			for (i = 0; i < n_shift; ++i)
				inbuf_old[i] = inbuf_old[i + num_used.num_used];

			/* shift in the num_used.num_used samples */
			for (j = 0; i < BLACKSIZE; ++i, ++j)
				inbuf_old[i] = inbuf[in_bufferPos + j];

			assert (j == num_used.num_used);
		}
		return k; /* return the number samples created at the new samplerate */
	}

	/*
	 * copy in new samples from in_buffer into mfbuf, with resampling if
	 * necessary. n_in = number of samples from the input buffer that were used.
	 * n_out = number of samples copied into mfbuf
	 */

	private void fill_buffer(final LameGlobalFlags gfp, float mfbuf[][],
			final float in_buffer[][], final int in_bufferPos,
			final int nsamples, final InOut io) {
		final LameInternalFlags gfc = gfp.internal_flags;

		/* copy in new samples into mfbuf, with resampling if necessary */
		if ((gfc.resample_ratio < .9999) || (gfc.resample_ratio > 1.0001)) {
			for (int ch = 0; ch < gfc.channels_out; ch++) {
				NumUsed numUsed = new NumUsed();
				io.n_out = fill_buffer_resample(gfp, mfbuf[ch], gfc.mf_size,
						gfp.framesize, in_buffer[ch], in_bufferPos, nsamples,
						numUsed, ch);
				io.n_in = numUsed.num_used;
			}
		} else {
			io.n_out = Math.min(gfp.framesize, nsamples);
			io.n_in = io.n_out;
			for (int i = 0; i < io.n_out; ++i) {
				mfbuf[0][gfc.mf_size + i] = in_buffer[0][in_bufferPos + i];
				if (gfc.channels_out == 2)
					mfbuf[1][gfc.mf_size + i] = in_buffer[1][in_bufferPos + i];
			}
		}
	}

	/********************************************************************
	 * initialize internal params based on data in gf (globalflags struct filled
	 * in by calling program)
	 * 
	 * OUTLINE:
	 * 
	 * We first have some complex code to determine bitrate, output samplerate
	 * and mode. It is complicated by the fact that we allow the user to set
	 * some or all of these parameters, and need to determine best possible
	 * values for the rest of them:
	 * 
	 * 1. set some CPU related flags 2. check if we are mono.mono, stereo.mono
	 * or stereo.stereo 3. compute bitrate and output samplerate: user may have
	 * set compression ratio user may have set a bitrate user may have set a
	 * output samplerate 4. set some options which depend on output samplerate
	 * 5. compute the actual compression ratio 6. set mode based on compression
	 * ratio
	 * 
	 * The remaining code is much simpler - it just sets options based on the
	 * mode & compression ratio:
	 * 
	 * set allow_diff_short based on mode select lowpass filter based on
	 * compression ratio & mode set the bitrate index, and min/max bitrates for
	 * VBR modes disable VBR tag if it is not appropriate initialize the
	 * bitstream initialize scalefac_band data set sideinfo_len (based on
	 * channels, CRC, out_samplerate) write an id3v2 tag into the bitstream
	 * write VBR tag into the bitstream set mpeg1/2 flag estimate the number of
	 * frames (based on a lot of data)
	 * 
	 * now we set more flags: nspsytune: see code VBR modes see code CBR/ABR see
	 * code
	 * 
	 * Finally, we set the algorithm flags based on the gfp.quality value
	 * lame_init_qval(gfp);
	 * 
	 ********************************************************************/
	public final int lame_init_params(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;

		gfc.Class_ID = 0;
		if (gfc.ATH == null)
			gfc.ATH = new ATH();
		if (gfc.PSY == null)
			gfc.PSY = new PSY();
		if (gfc.rgdata == null)
			gfc.rgdata = new ReplayGain();

		gfc.channels_in = gfp.num_channels;
		if (gfc.channels_in == 1)
			gfp.mode = MPEGMode.MONO;
		gfc.channels_out = (gfp.mode == MPEGMode.MONO) ? 1 : 2;
		gfc.mode_ext = Encoder.MPG_MD_MS_LR;
		if (gfp.mode == MPEGMode.MONO)
			gfp.force_ms = false;
		/*
		 * don't allow forced mid/side stereo for mono output
		 */

		if (gfp.VBR == VbrMode.vbr_off && gfp.VBR_mean_bitrate_kbps != 128
				&& gfp.brate == 0)
			gfp.brate = gfp.VBR_mean_bitrate_kbps;

		if (gfp.VBR == VbrMode.vbr_off || gfp.VBR == VbrMode.vbr_mtrh
				|| gfp.VBR == VbrMode.vbr_mt) {
			/* these modes can handle free format condition */
		} else {
			gfp.free_format = false; /* mode can't be mixed with free format */
		}

		if (gfp.VBR == VbrMode.vbr_off && gfp.brate == 0) {
			/* no bitrate or compression ratio specified, use 11.025 */
			if (BitStream.EQ(gfp.compression_ratio, 0))
				gfp.compression_ratio = 11.025f;
			/*
			 * rate to compress a CD down to exactly 128000 bps
			 */
		}

		/* find bitrate if user specify a compression ratio */
		if (gfp.VBR == VbrMode.vbr_off && gfp.compression_ratio > 0) {

			if (gfp.out_samplerate == 0)
				gfp.out_samplerate = map2MP3Frequency((int) (0.97 * gfp.in_samplerate));
			/*
			 * round up with a margin of 3 %
			 */

			/*
			 * choose a bitrate for the output samplerate which achieves
			 * specified compression ratio
			 */
			gfp.brate = (int) (gfp.out_samplerate * 16 * gfc.channels_out / (1.e3f * gfp.compression_ratio));

			/* we need the version for the bitrate table look up */
			gfc.samplerate_index = SmpFrqIndex(gfp.out_samplerate, gfp);

			if (!gfp.free_format) /*
								 * for non Free Format find the nearest allowed
								 * bitrate
								 */
				gfp.brate = FindNearestBitrate(gfp.brate, gfp.version,
						gfp.out_samplerate);
		}

		if (gfp.out_samplerate != 0) {
			if (gfp.out_samplerate < 16000) {
				gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps,
						8);
				gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps,
						64);
			} else if (gfp.out_samplerate < 32000) {
				gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps,
						8);
				gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps,
						160);
			} else {
				gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps,
						32);
				gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps,
						320);
			}
		}

		/****************************************************************/
		/* if a filter has not been enabled, see if we should add one: */
		/****************************************************************/
		if (gfp.lowpassfreq == 0) {
			double lowpass = 16000;

			switch (gfp.VBR) {
			case vbr_off: {
				LowPassHighPass lh = new LowPassHighPass();
				optimum_bandwidth(lh, gfp.brate);
				lowpass = lh.lowerlimit;
				break;
			}
			case vbr_abr: {
				LowPassHighPass lh = new LowPassHighPass();
				optimum_bandwidth(lh, gfp.VBR_mean_bitrate_kbps);
				lowpass = lh.lowerlimit;
				break;
			}
			case vbr_rh: {
				final int x[] = { 19500, 19000, 18600, 18000, 17500, 16000,
						15600, 14900, 12500, 10000, 3950 };
				if (0 <= gfp.VBR_q && gfp.VBR_q <= 9) {
					double a = x[gfp.VBR_q], b = x[gfp.VBR_q + 1], m = gfp.VBR_q_frac;
					lowpass = linear_int(a, b, m);
				} else {
					lowpass = 19500;
				}
				break;
			}
			default: {
				final int x[] = { 19500, 19000, 18500, 18000, 17500, 16500,
						15500, 14500, 12500, 9500, 3950 };
				if (0 <= gfp.VBR_q && gfp.VBR_q <= 9) {
					double a = x[gfp.VBR_q], b = x[gfp.VBR_q + 1], m = gfp.VBR_q_frac;
					lowpass = linear_int(a, b, m);
				} else {
					lowpass = 19500;
				}
			}
			}
			if (gfp.mode == MPEGMode.MONO
					&& (gfp.VBR == VbrMode.vbr_off || gfp.VBR == VbrMode.vbr_abr))
				lowpass *= 1.5;

			gfp.lowpassfreq = (int) lowpass;
		}

		if (gfp.out_samplerate == 0) {
			if (2 * gfp.lowpassfreq > gfp.in_samplerate) {
				gfp.lowpassfreq = gfp.in_samplerate / 2;
			}
			gfp.out_samplerate = optimum_samplefreq((int) gfp.lowpassfreq,
					gfp.in_samplerate);
		}

		gfp.lowpassfreq = Math.min(20500, gfp.lowpassfreq);
		gfp.lowpassfreq = Math.min(gfp.out_samplerate / 2, gfp.lowpassfreq);

		if (gfp.VBR == VbrMode.vbr_off) {
			gfp.compression_ratio = gfp.out_samplerate * 16 * gfc.channels_out
					/ (1.e3f * gfp.brate);
		}
		if (gfp.VBR == VbrMode.vbr_abr) {
			gfp.compression_ratio = gfp.out_samplerate * 16 * gfc.channels_out
					/ (1.e3f * gfp.VBR_mean_bitrate_kbps);
		}

		/*
		 * do not compute ReplayGain values and do not find the peak sample if
		 * we can't store them
		 */
		if (!gfp.bWriteVbrTag) {
			gfp.findReplayGain = false;
			gfp.decode_on_the_fly = false;
			gfc.findPeakSample = false;
		}
		gfc.findReplayGain = gfp.findReplayGain;
		gfc.decode_on_the_fly = gfp.decode_on_the_fly;

		if (gfc.decode_on_the_fly)
			gfc.findPeakSample = true;

		if (gfc.findReplayGain) {
			if (ga.InitGainAnalysis(gfc.rgdata, gfp.out_samplerate) == GainAnalysis.INIT_GAIN_ANALYSIS_ERROR) {
				gfp.internal_flags = null;
				return -6;
			}
		}

		if (gfc.decode_on_the_fly && !gfp.decode_only) {
			if (gfc.hip != null) {
				mpglib.hip_decode_exit(gfc.hip);
			}
			gfc.hip = mpglib.hip_decode_init();
		}

		gfc.mode_gr = gfp.out_samplerate <= 24000 ? 1 : 2;
		/*
		 * Number of granules per frame
		 */
		gfp.framesize = 576 * gfc.mode_gr;
		gfp.encoder_delay = Encoder.ENCDELAY;

		gfc.resample_ratio = (double) gfp.in_samplerate / gfp.out_samplerate;

		/**
		 * <PRE>
		 *  sample freq       bitrate     compression ratio
		 *     [kHz]      [kbps/channel]   for 16 bit input
		 *     44.1            56               12.6
		 *     44.1            64               11.025
		 *     44.1            80                8.82
		 *     22.05           24               14.7
		 *     22.05           32               11.025
		 *     22.05           40                8.82
		 *     16              16               16.0
		 *     16              24               10.667
		 * </PRE>
		 */
		/**
		 * <PRE>
		 *  For VBR, take a guess at the compression_ratio.
		 *  For example:
		 * 
		 *    VBR_q    compression     like
		 *     -        4.4         320 kbps/44 kHz
		 *   0...1      5.5         256 kbps/44 kHz
		 *     2        7.3         192 kbps/44 kHz
		 *     4        8.8         160 kbps/44 kHz
		 *     6       11           128 kbps/44 kHz
		 *     9       14.7          96 kbps
		 * 
		 *  for lower bitrates, downsample with --resample
		 * </PRE>
		 */
		switch (gfp.VBR) {
		case vbr_mt:
		case vbr_rh:
		case vbr_mtrh: {
			/* numbers are a bit strange, but they determine the lowpass value */
			final float cmp[] = { 5.7f, 6.5f, 7.3f, 8.2f, 10f, 11.9f, 13f, 14f,
					15f, 16.5f };
			gfp.compression_ratio = cmp[gfp.VBR_q];
		}
			break;
		case vbr_abr:
			gfp.compression_ratio = gfp.out_samplerate * 16 * gfc.channels_out
					/ (1.e3f * gfp.VBR_mean_bitrate_kbps);
			break;
		default:
			gfp.compression_ratio = gfp.out_samplerate * 16 * gfc.channels_out
					/ (1.e3f * gfp.brate);
			break;
		}

		/*
		 * mode = -1 (not set by user) or mode = MONO (because of only 1 input
		 * channel). If mode has not been set, then select J-STEREO
		 */
		if (gfp.mode == MPEGMode.NOT_SET) {
			gfp.mode = MPEGMode.JOINT_STEREO;
		}

		/* apply user driven high pass filter */
		if (gfp.highpassfreq > 0) {
			gfc.highpass1 = 2.f * gfp.highpassfreq;

			if (gfp.highpasswidth >= 0)
				gfc.highpass2 = 2.f * (gfp.highpassfreq + gfp.highpasswidth);
			else
				/* 0% above on default */
				gfc.highpass2 = (1 + 0.00f) * 2.f * gfp.highpassfreq;

			gfc.highpass1 /= gfp.out_samplerate;
			gfc.highpass2 /= gfp.out_samplerate;
		} else {
			gfc.highpass1 = 0;
			gfc.highpass2 = 0;
		}
		/* apply user driven low pass filter */
		if (gfp.lowpassfreq > 0) {
			gfc.lowpass2 = 2.f * gfp.lowpassfreq;
			if (gfp.lowpasswidth >= 0) {
				gfc.lowpass1 = 2.f * (gfp.lowpassfreq - gfp.lowpasswidth);
				if (gfc.lowpass1 < 0) /* has to be >= 0 */
					gfc.lowpass1 = 0;
			} else { /* 0% below on default */
				gfc.lowpass1 = (1 - 0.00f) * 2.f * gfp.lowpassfreq;
			}
			gfc.lowpass1 /= gfp.out_samplerate;
			gfc.lowpass2 /= gfp.out_samplerate;
		} else {
			gfc.lowpass1 = 0;
			gfc.lowpass2 = 0;
		}

		/**********************************************************************/
		/* compute info needed for polyphase filter (filter type==0, default) */
		/**********************************************************************/
		lame_init_params_ppflt(gfp);

		/*******************************************************
		 * samplerate and bitrate index
		 *******************************************************/
		gfc.samplerate_index = SmpFrqIndex(gfp.out_samplerate, gfp);
		if (gfc.samplerate_index < 0) {
			gfp.internal_flags = null;
			return -1;
		}

		if (gfp.VBR == VbrMode.vbr_off) {
			if (gfp.free_format) {
				gfc.bitrate_index = 0;
			} else {
				gfp.brate = FindNearestBitrate(gfp.brate, gfp.version,
						gfp.out_samplerate);
				gfc.bitrate_index = BitrateIndex(gfp.brate, gfp.version,
						gfp.out_samplerate);
				if (gfc.bitrate_index <= 0) {
					gfp.internal_flags = null;
					return -1;
				}
			}
		} else {
			gfc.bitrate_index = 1;
		}

		/* for CBR, we will write an "info" tag. */

		if (gfp.analysis)
			gfp.bWriteVbrTag = false;

		/* some file options not allowed if output is: not specified or stdout */
		if (gfc.pinfo != null)
			gfp.bWriteVbrTag = false; /* disable Xing VBR tag */

		bs.init_bit_stream_w(gfc);

		int j = gfc.samplerate_index + (3 * gfp.version) + 6
				* (gfp.out_samplerate < 16000 ? 1 : 0);
		for (int i = 0; i < Encoder.SBMAX_l + 1; i++)
			gfc.scalefac_band.l[i] = qupvt.sfBandIndex[j].l[i];

		for (int i = 0; i < Encoder.PSFB21 + 1; i++) {
			final int size = (gfc.scalefac_band.l[22] - gfc.scalefac_band.l[21])
					/ Encoder.PSFB21;
			final int start = gfc.scalefac_band.l[21] + i * size;
			gfc.scalefac_band.psfb21[i] = start;
		}
		gfc.scalefac_band.psfb21[Encoder.PSFB21] = 576;

		for (int i = 0; i < Encoder.SBMAX_s + 1; i++)
			gfc.scalefac_band.s[i] = qupvt.sfBandIndex[j].s[i];

		for (int i = 0; i < Encoder.PSFB12 + 1; i++) {
			final int size = (gfc.scalefac_band.s[13] - gfc.scalefac_band.s[12])
					/ Encoder.PSFB12;
			final int start = gfc.scalefac_band.s[12] + i * size;
			gfc.scalefac_band.psfb12[i] = start;
		}
		gfc.scalefac_band.psfb12[Encoder.PSFB12] = 192;

		/* determine the mean bitrate for main data */
		if (gfp.version == 1) /* MPEG 1 */
			gfc.sideinfo_len = (gfc.channels_out == 1) ? 4 + 17 : 4 + 32;
		else
			/* MPEG 2 */
			gfc.sideinfo_len = (gfc.channels_out == 1) ? 4 + 9 : 4 + 17;

		if (gfp.error_protection)
			gfc.sideinfo_len += 2;

		lame_init_bitstream(gfp);

		gfc.Class_ID = LAME_ID;

		{
			int k;

			for (k = 0; k < 19; k++)
				gfc.nsPsy.pefirbuf[k] = 700 * gfc.mode_gr * gfc.channels_out;

			if (gfp.ATHtype == -1)
				gfp.ATHtype = 4;
		}

		assert (gfp.VBR_q <= 9);
		assert (gfp.VBR_q >= 0);

		switch (gfp.VBR) {

		case vbr_mt:
			gfp.VBR = VbrMode.vbr_mtrh;
			//$FALL-THROUGH$
		case vbr_mtrh: {
			if (gfp.useTemporal == null) {
				gfp.useTemporal = false; /* off by default for this VBR mode */
			}

			p.apply_preset(gfp, 500 - (gfp.VBR_q * 10), 0);
			/**
			 * <PRE>
			 *   The newer VBR code supports only a limited
			 * 	 subset of quality levels:
			 * 	 9-5=5 are the same, uses x^3/4 quantization
			 *   4-0=0 are the same  5 plus best huffman divide code
			 * </PRE>
			 */
			if (gfp.quality < 0)
				gfp.quality = LAME_DEFAULT_QUALITY;
			if (gfp.quality < 5)
				gfp.quality = 0;
			if (gfp.quality > 5)
				gfp.quality = 5;

			gfc.PSY.mask_adjust = gfp.maskingadjust;
			gfc.PSY.mask_adjust_short = gfp.maskingadjust_short;

			/*
			 * sfb21 extra only with MPEG-1 at higher sampling rates
			 */
			if (gfp.experimentalY)
				gfc.sfb21_extra = false;
			else
				gfc.sfb21_extra = (gfp.out_samplerate > 44000);

			gfc.iteration_loop = new VBRNewIterationLoop(qu);
			break;

		}
		case vbr_rh: {

			p.apply_preset(gfp, 500 - (gfp.VBR_q * 10), 0);

			gfc.PSY.mask_adjust = gfp.maskingadjust;
			gfc.PSY.mask_adjust_short = gfp.maskingadjust_short;

			/*
			 * sfb21 extra only with MPEG-1 at higher sampling rates
			 */
			if (gfp.experimentalY)
				gfc.sfb21_extra = false;
			else
				gfc.sfb21_extra = (gfp.out_samplerate > 44000);

			/*
			 * VBR needs at least the output of GPSYCHO, so we have to garantee
			 * that by setting a minimum quality level, actually level 6 does
			 * it. down to level 6
			 */
			if (gfp.quality > 6)
				gfp.quality = 6;

			if (gfp.quality < 0)
				gfp.quality = LAME_DEFAULT_QUALITY;

			gfc.iteration_loop = new VBROldIterationLoop(qu);
			break;
		}

		default: /* cbr/abr */{
			VbrMode vbrmode;

			/*
			 * no sfb21 extra with CBR code
			 */
			gfc.sfb21_extra = false;

			if (gfp.quality < 0)
				gfp.quality = LAME_DEFAULT_QUALITY;

			vbrmode = gfp.VBR;
			if (vbrmode == VbrMode.vbr_off)
				gfp.VBR_mean_bitrate_kbps = gfp.brate;
			/* second, set parameters depending on bitrate */
			p.apply_preset(gfp, gfp.VBR_mean_bitrate_kbps, 0);
			gfp.VBR = vbrmode;

			gfc.PSY.mask_adjust = gfp.maskingadjust;
			gfc.PSY.mask_adjust_short = gfp.maskingadjust_short;

			if (vbrmode == VbrMode.vbr_off) {
				gfc.iteration_loop = new CBRNewIterationLoop(qu);
			} else {
				gfc.iteration_loop = new ABRIterationLoop(qu);
			}
			break;
		}
		}

		/* initialize default values common for all modes */

		if (gfp.VBR != VbrMode.vbr_off) { /* choose a min/max bitrate for VBR */
			/* if the user didn't specify VBR_max_bitrate: */
			gfc.VBR_min_bitrate = 1;
			/*
			 * default: allow 8 kbps (MPEG-2) or 32 kbps (MPEG-1)
			 */
			gfc.VBR_max_bitrate = 14;
			/*
			 * default: allow 160 kbps (MPEG-2) or 320 kbps (MPEG-1)
			 */
			if (gfp.out_samplerate < 16000)
				gfc.VBR_max_bitrate = 8; /* default: allow 64 kbps (MPEG-2.5) */
			if (gfp.VBR_min_bitrate_kbps != 0) {
				gfp.VBR_min_bitrate_kbps = FindNearestBitrate(
						gfp.VBR_min_bitrate_kbps, gfp.version,
						gfp.out_samplerate);
				gfc.VBR_min_bitrate = BitrateIndex(gfp.VBR_min_bitrate_kbps,
						gfp.version, gfp.out_samplerate);
				if (gfc.VBR_min_bitrate < 0)
					return -1;
			}
			if (gfp.VBR_max_bitrate_kbps != 0) {
				gfp.VBR_max_bitrate_kbps = FindNearestBitrate(
						gfp.VBR_max_bitrate_kbps, gfp.version,
						gfp.out_samplerate);
				gfc.VBR_max_bitrate = BitrateIndex(gfp.VBR_max_bitrate_kbps,
						gfp.version, gfp.out_samplerate);
				if (gfc.VBR_max_bitrate < 0)
					return -1;
			}
			gfp.VBR_min_bitrate_kbps = Tables.bitrate_table[gfp.version][gfc.VBR_min_bitrate];
			gfp.VBR_max_bitrate_kbps = Tables.bitrate_table[gfp.version][gfc.VBR_max_bitrate];
			gfp.VBR_mean_bitrate_kbps = Math.min(
					Tables.bitrate_table[gfp.version][gfc.VBR_max_bitrate],
					gfp.VBR_mean_bitrate_kbps);
			gfp.VBR_mean_bitrate_kbps = Math.max(
					Tables.bitrate_table[gfp.version][gfc.VBR_min_bitrate],
					gfp.VBR_mean_bitrate_kbps);
		}

		/* just another daily changing developer switch */
		if (gfp.tune) {
			gfc.PSY.mask_adjust += gfp.tune_value_a;
			gfc.PSY.mask_adjust_short += gfp.tune_value_a;
		}

		/* initialize internal qval settings */
		lame_init_qval(gfp);

		/*
		 * automatic ATH adjustment on
		 */
		if (gfp.athaa_type < 0)
			gfc.ATH.useAdjust = 3;
		else
			gfc.ATH.useAdjust = gfp.athaa_type;

		/* initialize internal adaptive ATH settings -jd */
		gfc.ATH.aaSensitivityP = (float) Math.pow(10.0, gfp.athaa_sensitivity
				/ -10.0);

		if (gfp.short_blocks == null) {
			gfp.short_blocks = ShortBlock.short_block_allowed;
		}

		/*
		 * Note Jan/2003: Many hardware decoders cannot handle short blocks in
		 * regular stereo mode unless they are coupled (same type in both
		 * channels) it is a rare event (1 frame per min. or so) that LAME would
		 * use uncoupled short blocks, so lets turn them off until we decide how
		 * to handle this. No other encoders allow uncoupled short blocks, even
		 * though it is in the standard.
		 */
		/*
		 * rh 20040217: coupling makes no sense for mono and dual-mono streams
		 */
		if (gfp.short_blocks == ShortBlock.short_block_allowed
				&& (gfp.mode == MPEGMode.JOINT_STEREO || gfp.mode == MPEGMode.STEREO)) {
			gfp.short_blocks = ShortBlock.short_block_coupled;
		}

		if (gfp.quant_comp < 0)
			gfp.quant_comp = 1;
		if (gfp.quant_comp_short < 0)
			gfp.quant_comp_short = 0;

		if (gfp.msfix < 0)
			gfp.msfix = 0;

		/* select psychoacoustic model */
		gfp.exp_nspsytune = gfp.exp_nspsytune | 1;

		if (gfp.internal_flags.nsPsy.attackthre < 0)
			gfp.internal_flags.nsPsy.attackthre = PsyModel.NSATTACKTHRE;
		if (gfp.internal_flags.nsPsy.attackthre_s < 0)
			gfp.internal_flags.nsPsy.attackthre_s = PsyModel.NSATTACKTHRE_S;

		if (gfp.scale < 0)
			gfp.scale = 1;

		if (gfp.ATHtype < 0)
			gfp.ATHtype = 4;

		if (gfp.ATHcurve < 0)
			gfp.ATHcurve = 4;

		if (gfp.athaa_loudapprox < 0)
			gfp.athaa_loudapprox = 2;

		if (gfp.interChRatio < 0)
			gfp.interChRatio = 0;

		if (gfp.useTemporal == null)
			gfp.useTemporal = true; /* on by default */

		/*
		 * padding method as described in
		 * "MPEG-Layer3 / Bitstream Syntax and Decoding" by Martin Sieler, Ralph
		 * Sperschneider
		 * 
		 * note: there is no padding for the very first frame
		 * 
		 * Robert Hegemann 2000-06-22
		 */
		gfc.slot_lag = gfc.frac_SpF = 0;
		if (gfp.VBR == VbrMode.vbr_off)
			gfc.slot_lag = gfc.frac_SpF = (int) (((gfp.version + 1) * 72000L * gfp.brate) % gfp.out_samplerate);

		qupvt.iteration_init(gfp);
		psy.psymodel_init(gfp);

		return 0;
	}

	/**
	 * Prints some selected information about the coding parameters via the
	 * macro command MSGF(), which is currently mapped to lame_errorf (reports
	 * via a error function?), which is a printf-like function for <stderr>.
	 */
	public final void lame_print_config(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;
		double out_samplerate = gfp.out_samplerate;
		double in_samplerate = gfp.out_samplerate * gfc.resample_ratio;

		System.out.printf("LAME %s %s (%s)\n", ver.getLameVersion(),
				ver.getLameOsBitness(), ver.getLameUrl());

		if (gfp.num_channels == 2 && gfc.channels_out == 1 /* mono */) {
			System.out
					.printf("Autoconverting from stereo to mono. Setting encoding to mono mode.\n");
		}

		if (BitStream.NEQ((float) gfc.resample_ratio, 1.f)) {
			System.out.printf("Resampling:  input %g kHz  output %g kHz\n",
					1.e-3 * in_samplerate, 1.e-3 * out_samplerate);
		}

		if (gfc.highpass2 > 0.) {
			System.out
					.printf("Using polyphase highpass filter, transition band: %5.0f Hz - %5.0f Hz\n",
							0.5 * gfc.highpass1 * out_samplerate, 0.5
									* gfc.highpass2 * out_samplerate);
		}
		if (0. < gfc.lowpass1 || 0. < gfc.lowpass2) {
			System.out
					.printf("Using polyphase lowpass filter, transition band: %5.0f Hz - %5.0f Hz\n",
							0.5 * gfc.lowpass1 * out_samplerate, 0.5
									* gfc.lowpass2 * out_samplerate);
		} else {
			System.out.printf("polyphase lowpass filter disabled\n");
		}

		if (gfp.free_format) {
			System.err
					.printf("Warning: many decoders cannot handle free format bitstreams\n");
			if (gfp.brate > 320) {
				System.err
						.printf("Warning: many decoders cannot handle free format bitrates >320 kbps (see documentation)\n");
			}
		}
	}

	/**
	 * rh: some pretty printing is very welcome at this point! so, if someone is
	 * willing to do so, please do it! add more, if you see more...
	 */
	public final void lame_print_internals(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;

		/*
		 * compiler/processor optimizations, operational, etc.
		 */
		System.err.printf("\nmisc:\n\n");

		System.err.printf("\tscaling: %g\n", gfp.scale);
		System.err.printf("\tch0 (left) scaling: %g\n", gfp.scale_left);
		System.err.printf("\tch1 (right) scaling: %g\n", gfp.scale_right);
		String pc;
		switch (gfc.use_best_huffman) {
		default:
			pc = "normal";
			break;
		case 1:
			pc = "best (outside loop)";
			break;
		case 2:
			pc = "best (inside loop, slow)";
			break;
		}
		System.err.printf("\thuffman search: %s\n", pc);
		System.err.printf("\texperimental Y=%d\n", gfp.experimentalY);
		System.err.printf("\t...\n");

		/*
		 * everything controlling the stream format
		 */
		System.err.printf("\nstream format:\n\n");
		switch (gfp.version) {
		case 0:
			pc = "2.5";
			break;
		case 1:
			pc = "1";
			break;
		case 2:
			pc = "2";
			break;
		default:
			pc = "?";
			break;
		}
		System.err.printf("\tMPEG-%s Layer 3\n", pc);
		switch (gfp.mode) {
		case JOINT_STEREO:
			pc = "joint stereo";
			break;
		case STEREO:
			pc = "stereo";
			break;
		case DUAL_CHANNEL:
			pc = "dual channel";
			break;
		case MONO:
			pc = "mono";
			break;
		case NOT_SET:
			pc = "not set (error)";
			break;
		default:
			pc = "unknown (error)";
			break;
		}
		System.err.printf("\t%d channel - %s\n", gfc.channels_out, pc);

		switch (gfp.VBR) {
		case vbr_off:
			pc = "off";
			break;
		default:
			pc = "all";
			break;
		}
		System.err.printf("\tpadding: %s\n", pc);

		if (VbrMode.vbr_default == gfp.VBR)
			pc = "(default)";
		else if (gfp.free_format)
			pc = "(free format)";
		else
			pc = "";
		switch (gfp.VBR) {
		case vbr_off:
			System.err.printf("\tconstant bitrate - CBR %s\n", pc);
			break;
		case vbr_abr:
			System.err.printf("\tvariable bitrate - ABR %s\n", pc);
			break;
		case vbr_rh:
			System.err.printf("\tvariable bitrate - VBR rh %s\n", pc);
			break;
		case vbr_mt:
			System.err.printf("\tvariable bitrate - VBR mt %s\n", pc);
			break;
		case vbr_mtrh:
			System.err.printf("\tvariable bitrate - VBR mtrh %s\n", pc);
			break;
		default:
			System.err.printf("\t ?? oops, some new one ?? \n");
			break;
		}
		if (gfp.bWriteVbrTag) {
			System.err.printf("\tusing LAME Tag\n");
		}
		System.err.printf("\t...\n");

		/*
		 * everything controlling psychoacoustic settings, like ATH, etc.
		 */
		System.err.printf("\npsychoacoustic:\n\n");

		switch (gfp.short_blocks) {
		default:
			pc = "?";
			break;
		case short_block_allowed:
			pc = "allowed";
			break;
		case short_block_coupled:
			pc = "channel coupled";
			break;
		case short_block_dispensed:
			pc = "dispensed";
			break;
		case short_block_forced:
			pc = "forced";
			break;
		}
		System.err.printf("\tusing short blocks: %s\n", pc);
		System.err.printf("\tsubblock gain: %d\n", gfc.subblock_gain);
		System.err.printf("\tadjust masking: %g dB\n", gfc.PSY.mask_adjust);
		System.err.printf("\tadjust masking short: %g dB\n",
				gfc.PSY.mask_adjust_short);
		System.err.printf("\tquantization comparison: %d\n", gfp.quant_comp);
		System.err.printf("\t ^ comparison short blocks: %d\n",
				gfp.quant_comp_short);
		System.err.printf("\tnoise shaping: %d\n", gfc.noise_shaping);
		System.err.printf("\t ^ amplification: %d\n", gfc.noise_shaping_amp);
		System.err.printf("\t ^ stopping: %d\n", gfc.noise_shaping_stop);

		pc = "using";
		if (gfp.ATHshort)
			pc = "the only masking for short blocks";
		if (gfp.ATHonly)
			pc = "the only masking";
		if (gfp.noATH)
			pc = "not used";
		System.err.printf("\tATH: %s\n", pc);
		System.err.printf("\t ^ type: %d\n", gfp.ATHtype);
		System.err.printf("\t ^ shape: %g%s\n", gfp.ATHcurve,
				" (only for type 4)");
		System.err.printf("\t ^ level adjustement: %g\n", gfp.ATHlower);
		System.err.printf("\t ^ adjust type: %d\n", gfc.ATH.useAdjust);
		System.err.printf("\t ^ adjust sensitivity power: %f\n",
				gfc.ATH.aaSensitivityP);
		System.err.printf("\t ^ adapt threshold type: %d\n",
				gfp.athaa_loudapprox);

		System.err.printf("\texperimental psy tunings by Naoki Shibata\n");
		System.err
				.printf("\t   adjust masking bass=%g dB, alto=%g dB, treble=%g dB, sfb21=%g dB\n",
						10 * Math.log10(gfc.nsPsy.longfact[0]),
						10 * Math.log10(gfc.nsPsy.longfact[7]),
						10 * Math.log10(gfc.nsPsy.longfact[14]),
						10 * Math.log10(gfc.nsPsy.longfact[21]));

		pc = gfp.useTemporal ? "yes" : "no";
		System.err.printf("\tusing temporal masking effect: %s\n", pc);
		System.err.printf("\tinterchannel masking ratio: %g\n",
				gfp.interChRatio);
		System.err.printf("\t...\n");

		/*
		 * that's all ?
		 */
		System.err.printf("\n");
	}

	/**
	 * routine to feed exactly one frame (gfp.framesize) worth of data to the
	 * encoding engine. All buffering, resampling, etc, handled by calling
	 * program.
	 */
	private int lame_encode_frame(final LameGlobalFlags gfp,
			final float inbuf_l[], final float inbuf_r[], final byte[] mp3buf,
			final int mp3bufPos, final int mp3buf_size) {
		int ret = enc.lame_encode_mp3_frame(gfp, inbuf_l, inbuf_r, mp3buf,
				mp3bufPos, mp3buf_size);
		gfp.frameNum++;
		return ret;
	}

	private void update_inbuffer_size(final LameInternalFlags gfc,
			final int nsamples) {
		if (gfc.in_buffer_0 == null || gfc.in_buffer_nsamples < nsamples) {
			gfc.in_buffer_0 = new float[nsamples];
			gfc.in_buffer_1 = new float[nsamples];
			gfc.in_buffer_nsamples = nsamples;
		}
	}

	private int calcNeeded(final LameGlobalFlags gfp) {
		int mf_needed = Encoder.BLKSIZE + gfp.framesize - Encoder.FFTOFFSET;
		/*
		 * amount needed for FFT
		 */
		mf_needed = Math.max(mf_needed, 512 + gfp.framesize - 32);
		assert (LameInternalFlags.MFSIZE >= mf_needed);

		return mf_needed;
	}

	protected static class InOut {
		int n_in;
		int n_out;
	}

	/**
	 * <PRE>
	 * THE MAIN LAME ENCODING INTERFACE
	 * mt 3/00
	 * 
	 * input pcm data, output (maybe) mp3 frames.
	 * This routine handles all buffering, resampling and filtering for you.
	 * The required mp3buffer_size can be computed from num_samples,
	 * samplerate and encoding rate, but here is a worst case estimate:
	 * 
	 * mp3buffer_size in bytes = 1.25*num_samples + 7200
	 * 
	 * return code = number of bytes output in mp3buffer.  can be 0
	 * 
	 * NOTE: this routine uses LAME's internal PCM data representation,
	 * 'sample_t'.  It should not be used by any application.
	 * applications should use lame_encode_buffer(),
	 *                         lame_encode_buffer_float()
	 *                         lame_encode_buffer_int()
	 * etc... depending on what type of data they are working with.
	 * </PRE>
	 */
	private int lame_encode_buffer_sample(final LameGlobalFlags gfp,
			final float buffer_l[], final float buffer_r[], int nsamples,
			final byte[] mp3buf, int mp3bufPos, final int mp3buf_size) {
		final LameInternalFlags gfc = gfp.internal_flags;
		int mp3size = 0, ret, i, ch, mf_needed;
		int mp3out;
		float mfbuf[][] = new float[2][];
		float in_buffer[][] = new float[2][];

		if (gfc.Class_ID != LAME_ID)
			return -3;

		if (nsamples == 0)
			return 0;

		/* copy out any tags that may have been written into bitstream */
		mp3out = bs.copy_buffer(gfc, mp3buf, mp3bufPos, mp3buf_size, 0);
		if (mp3out < 0)
			return mp3out; /* not enough buffer space */
		mp3bufPos += mp3out;
		mp3size += mp3out;

		in_buffer[0] = buffer_l;
		in_buffer[1] = buffer_r;

		/* Apply user defined re-scaling */

		/* user selected scaling of the samples */
		if (BitStream.NEQ(gfp.scale, 0) && BitStream.NEQ(gfp.scale, 1.0f)) {
			for (i = 0; i < nsamples; ++i) {
				in_buffer[0][i] *= gfp.scale;
				if (gfc.channels_out == 2)
					in_buffer[1][i] *= gfp.scale;
			}
		}

		/* user selected scaling of the channel 0 (left) samples */
		if (BitStream.NEQ(gfp.scale_left, 0)
				&& BitStream.NEQ(gfp.scale_left, 1.0f)) {
			for (i = 0; i < nsamples; ++i) {
				in_buffer[0][i] *= gfp.scale_left;
			}
		}

		/* user selected scaling of the channel 1 (right) samples */
		if (BitStream.NEQ(gfp.scale_right, 0)
				&& BitStream.NEQ(gfp.scale_right, 1.0f)) {
			for (i = 0; i < nsamples; ++i) {
				in_buffer[1][i] *= gfp.scale_right;
			}
		}

		/* Downsample to Mono if 2 channels in and 1 channel out */
		if (gfp.num_channels == 2 && gfc.channels_out == 1) {
			for (i = 0; i < nsamples; ++i) {
				in_buffer[0][i] = 0.5f * ((float) in_buffer[0][i] + in_buffer[1][i]);
				in_buffer[1][i] = 0.0f;
			}
		}

		mf_needed = calcNeeded(gfp);

		mfbuf[0] = gfc.mfbuf[0];
		mfbuf[1] = gfc.mfbuf[1];

		int in_bufferPos = 0;
		while (nsamples > 0) {
			final float in_buffer_ptr[][] = new float[2][];
			int n_in = 0; /* number of input samples processed with fill_buffer */
			int n_out = 0; /* number of samples output with fill_buffer */
			/* n_in <> n_out if we are resampling */

			in_buffer_ptr[0] = in_buffer[0];
			in_buffer_ptr[1] = in_buffer[1];
			/* copy in new samples into mfbuf, with resampling */
			InOut inOut = new InOut();
			fill_buffer(gfp, mfbuf, in_buffer_ptr, in_bufferPos, nsamples,
					inOut);
			n_in = inOut.n_in;
			n_out = inOut.n_out;

			/* compute ReplayGain of resampled input if requested */
			if (gfc.findReplayGain && !gfc.decode_on_the_fly)
				if (ga.AnalyzeSamples(gfc.rgdata, mfbuf[0], gfc.mf_size,
						mfbuf[1], gfc.mf_size, n_out, gfc.channels_out) == GainAnalysis.GAIN_ANALYSIS_ERROR)
					return -6;

			/* update in_buffer counters */
			nsamples -= n_in;
			in_bufferPos += n_in;
			if (gfc.channels_out == 2)
				;// in_bufferPos += n_in;

			/* update mfbuf[] counters */
			gfc.mf_size += n_out;
			assert (gfc.mf_size <= LameInternalFlags.MFSIZE);

			/*
			 * lame_encode_flush may have set gfc.mf_sample_to_encode to 0 so we
			 * have to reinitialize it here when that happened.
			 */
			if (gfc.mf_samples_to_encode < 1) {
				gfc.mf_samples_to_encode = Encoder.ENCDELAY + Encoder.POSTDELAY;
			}
			gfc.mf_samples_to_encode += n_out;

			if (gfc.mf_size >= mf_needed) {
				/* encode the frame. */
				/* mp3buf = pointer to current location in buffer */
				/* mp3buf_size = size of original mp3 output buffer */
				/* = 0 if we should not worry about the */
				/* buffer size because calling program is */
				/* to lazy to compute it */
				/* mp3size = size of data written to buffer so far */
				/* mp3buf_size-mp3size = amount of space avalable */

				int buf_size = mp3buf_size - mp3size;
				if (mp3buf_size == 0)
					buf_size = 0;

				ret = lame_encode_frame(gfp, mfbuf[0], mfbuf[1], mp3buf,
						mp3bufPos, buf_size);

				if (ret < 0)
					return ret;
				mp3bufPos += ret;
				mp3size += ret;

				/* shift out old samples */
				gfc.mf_size -= gfp.framesize;
				gfc.mf_samples_to_encode -= gfp.framesize;
				for (ch = 0; ch < gfc.channels_out; ch++)
					for (i = 0; i < gfc.mf_size; i++)
						mfbuf[ch][i] = mfbuf[ch][i + gfp.framesize];
			}
		}
		assert (nsamples == 0);

		return mp3size;
	}

	private int lame_encode_buffer(final LameGlobalFlags gfp,
			final short buffer_l[], final short buffer_r[], final int nsamples,
			final byte[] mp3buf, final int mp3bufPos, final int mp3buf_size) {
		final LameInternalFlags gfc = gfp.internal_flags;
		float in_buffer[][] = new float[2][];

		if (gfc.Class_ID != LAME_ID)
			return -3;

		if (nsamples == 0)
			return 0;

		update_inbuffer_size(gfc, nsamples);

		in_buffer[0] = gfc.in_buffer_0;
		in_buffer[1] = gfc.in_buffer_1;

		/* make a copy of input buffer, changing type to sample_t */
		for (int i = 0; i < nsamples; i++) {
			in_buffer[0][i] = buffer_l[i];
			if (gfc.channels_in > 1)
				in_buffer[1][i] = buffer_r[i];
		}

		return lame_encode_buffer_sample(gfp, in_buffer[0], in_buffer[1],
				nsamples, mp3buf, mp3bufPos, mp3buf_size);
	}

	public int lame_encode_buffer_int(final LameGlobalFlags gfp,
			final int buffer_l[], final int buffer_r[], final int nsamples,
			byte[] mp3buf, int mp3bufPos, final int mp3buf_size) {
		final LameInternalFlags gfc = gfp.internal_flags;
		float[][] in_buffer = new float[2][];

		if (gfc.Class_ID != LAME_ID)
			return -3;

		if (nsamples == 0)
			return 0;

		update_inbuffer_size(gfc, nsamples);

		in_buffer[0] = gfc.in_buffer_0;
		in_buffer[1] = gfc.in_buffer_1;

		/* make a copy of input buffer, changing type to sample_t */
		for (int i = 0; i < nsamples; i++) {
			/* internal code expects +/- 32768.0 */
			in_buffer[0][i] = buffer_l[i];
			if (gfc.channels_in > 1)
				in_buffer[1][i] = buffer_r[i];
		}

		return lame_encode_buffer_sample(gfp, in_buffer[0], in_buffer[1],
				nsamples, mp3buf, mp3bufPos, mp3buf_size);
	}

	/**
	 * Flush mp3 buffer, pad with ancillary data so last frame is complete.
	 * Reset reservoir size to 0 but keep all PCM samples and MDCT data in
	 * memory This option is used to break a large file into several mp3 files
	 * that when concatenated together will decode with no gaps Because we set
	 * the reservoir=0, they will also decode seperately with no errors.
	 */
	public final int lame_encode_flush_nogap(final LameGlobalFlags gfp,
			final byte[] mp3buffer, final int mp3buffer_size) {
		final LameInternalFlags gfc = gfp.internal_flags;
		bs.flush_bitstream(gfp);
		return bs.copy_buffer(gfc, mp3buffer, 0, mp3buffer_size, 1);
	}

	/*
	 * called by lame_init_params. You can also call this after flush_nogap if
	 * you want to write new id3v2 and Xing VBR tags into the bitstream
	 */
	public final void lame_init_bitstream(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;
		gfp.frameNum = 0;

		if (gfp.write_id3tag_automatic) {
			id3.id3tag_write_v2(gfp);
		}
		/* initialize histogram data optionally used by frontend */

		gfc.bitrate_stereoMode_Hist = new int[16][4 + 1];
		gfc.bitrate_blockType_Hist = new int[16][4 + 1 + 1];

		gfc.PeakSample = 0.0f;

		/* Write initial VBR Header to bitstream and init VBR data */
		if (gfp.bWriteVbrTag)
			vbr.InitVbrTag(gfp);
	}

	/**
	 * flush internal PCM sample buffers, then mp3 buffers then write id3 v1
	 * tags into bitstream.
	 */
	public final int lame_encode_flush(final LameGlobalFlags gfp,
			final byte[] mp3buffer, int mp3bufferPos, final int mp3buffer_size) {
		final LameInternalFlags gfc = gfp.internal_flags;
		short buffer[][] = new short[2][1152];
		int imp3 = 0, mp3count, mp3buffer_size_remaining;

		/*
		 * we always add POSTDELAY=288 padding to make sure granule with real
		 * data can be complety decoded (because of 50% overlap with next
		 * granule
		 */
		int end_padding;
		int frames_left;
		int samples_to_encode = gfc.mf_samples_to_encode - Encoder.POSTDELAY;
		int mf_needed = calcNeeded(gfp);

		/* Was flush already called? */
		if (gfc.mf_samples_to_encode < 1) {
			return 0;
		}
		mp3count = 0;

		if (gfp.in_samplerate != gfp.out_samplerate) {
			/*
			 * delay due to resampling; needs to be fixed, if resampling code
			 * gets changed
			 */
			samples_to_encode += 16. * gfp.out_samplerate / gfp.in_samplerate;
		}
		end_padding = gfp.framesize - (samples_to_encode % gfp.framesize);
		if (end_padding < 576)
			end_padding += gfp.framesize;
		gfp.encoder_padding = end_padding;

		frames_left = (samples_to_encode + end_padding) / gfp.framesize;

		/*
		 * send in a frame of 0 padding until all internal sample buffers are
		 * flushed
		 */
		while (frames_left > 0 && imp3 >= 0) {
			int bunch = mf_needed - gfc.mf_size;
			int frame_num = gfp.frameNum;

			bunch *= gfp.in_samplerate;
			bunch /= gfp.out_samplerate;
			if (bunch > 1152)
				bunch = 1152;
			if (bunch < 1)
				bunch = 1;

			mp3buffer_size_remaining = mp3buffer_size - mp3count;

			/* if user specifed buffer size = 0, dont check size */
			if (mp3buffer_size == 0)
				mp3buffer_size_remaining = 0;

			imp3 = lame_encode_buffer(gfp, buffer[0], buffer[1], bunch,
					mp3buffer, mp3bufferPos, mp3buffer_size_remaining);

			mp3bufferPos += imp3;
			mp3count += imp3;
			frames_left -= (frame_num != gfp.frameNum) ? 1 : 0;
		}
		/*
		 * Set gfc.mf_samples_to_encode to 0, so we may detect and break loops
		 * calling it more than once in a row.
		 */
		gfc.mf_samples_to_encode = 0;

		if (imp3 < 0) {
			/* some type of fatal error */
			return imp3;
		}

		mp3buffer_size_remaining = mp3buffer_size - mp3count;
		/* if user specifed buffer size = 0, dont check size */
		if (mp3buffer_size == 0)
			mp3buffer_size_remaining = 0;

		/* mp3 related stuff. bit buffer might still contain some mp3 data */
		bs.flush_bitstream(gfp);
		imp3 = bs.copy_buffer(gfc, mp3buffer, mp3bufferPos,
				mp3buffer_size_remaining, 1);
		if (imp3 < 0) {
			/* some type of fatal error */
			return imp3;
		}
		mp3bufferPos += imp3;
		mp3count += imp3;
		mp3buffer_size_remaining = mp3buffer_size - mp3count;
		/* if user specifed buffer size = 0, dont check size */
		if (mp3buffer_size == 0)
			mp3buffer_size_remaining = 0;

		if (gfp.write_id3tag_automatic) {
			/* write a id3 tag to the bitstream */
			id3.id3tag_write_v1(gfp);

			imp3 = bs.copy_buffer(gfc, mp3buffer, mp3bufferPos,
					mp3buffer_size_remaining, 0);

			if (imp3 < 0) {
				return imp3;
			}
			mp3count += imp3;
		}
		return mp3count;
	}

	/**
	 * frees internal buffers
	 */
	public final int lame_close(final LameGlobalFlags gfp) {
		int ret = 0;
		if (gfp != null && gfp.class_id == LAME_ID) {
			final LameInternalFlags gfc = gfp.internal_flags;
			gfp.class_id = 0;
			if (null == gfc || gfc.Class_ID != LAME_ID) {
				ret = -3;
			}
			gfc.Class_ID = 0;
			gfp.internal_flags = null;
			gfp.lame_allocated_gfp = 0;
		}
		return ret;
	}

	private int lame_init_old(final LameGlobalFlags gfp) {
		LameInternalFlags gfc;

		gfp.class_id = LAME_ID;

		gfc = gfp.internal_flags = new LameInternalFlags();

		/* Global flags. set defaults here for non-zero values */
		/* see lame.h for description */
		/*
		 * set integer values to -1 to mean that LAME will compute the best
		 * value, UNLESS the calling program as set it (and the value is no
		 * longer -1)
		 */

		gfp.mode = MPEGMode.NOT_SET;
		gfp.original = 1;
		gfp.in_samplerate = 44100;
		gfp.num_channels = 2;
		gfp.num_samples = -1;

		gfp.bWriteVbrTag = true;
		gfp.quality = -1;
		gfp.short_blocks = null;
		gfc.subblock_gain = -1;

		gfp.lowpassfreq = 0;
		gfp.highpassfreq = 0;
		gfp.lowpasswidth = -1;
		gfp.highpasswidth = -1;

		gfp.VBR = VbrMode.vbr_off;
		gfp.VBR_q = 4;
		gfp.ATHcurve = -1;
		gfp.VBR_mean_bitrate_kbps = 128;
		gfp.VBR_min_bitrate_kbps = 0;
		gfp.VBR_max_bitrate_kbps = 0;
		gfp.VBR_hard_min = 0;
		gfc.VBR_min_bitrate = 1; /* not 0 ????? */
		gfc.VBR_max_bitrate = 13; /* not 14 ????? */

		gfp.quant_comp = -1;
		gfp.quant_comp_short = -1;

		gfp.msfix = -1;

		gfc.resample_ratio = 1;

		gfc.OldValue[0] = 180;
		gfc.OldValue[1] = 180;
		gfc.CurrentStep[0] = 4;
		gfc.CurrentStep[1] = 4;
		gfc.masking_lower = 1;
		gfc.nsPsy.attackthre = -1;
		gfc.nsPsy.attackthre_s = -1;

		gfp.scale = -1;

		gfp.athaa_type = -1;
		gfp.ATHtype = -1; /* default = -1 = set in lame_init_params */
		gfp.athaa_loudapprox = -1; /* 1 = flat loudness approx. (total energy) */
		/* 2 = equal loudness curve */
		gfp.athaa_sensitivity = 0.0f; /* no offset */
		gfp.useTemporal = null;
		gfp.interChRatio = -1;

		/*
		 * The reason for int mf_samples_to_encode = ENCDELAY + POSTDELAY;
		 * ENCDELAY = internal encoder delay. And then we have to add
		 * POSTDELAY=288 because of the 50% MDCT overlap. A 576 MDCT granule
		 * decodes to 1152 samples. To synthesize the 576 samples centered under
		 * this granule we need the previous granule for the first 288 samples
		 * (no problem), and the next granule for the next 288 samples (not
		 * possible if this is last granule). So we need to pad with 288 samples
		 * to make sure we can encode the 576 samples we are interested in.
		 */
		gfc.mf_samples_to_encode = Encoder.ENCDELAY + Encoder.POSTDELAY;
		gfp.encoder_padding = 0;
		gfc.mf_size = Encoder.ENCDELAY - Encoder.MDCTDELAY;
		/*
		 * we pad input with this many 0's
		 */

		gfp.findReplayGain = false;
		gfp.decode_on_the_fly = false;

		gfc.decode_on_the_fly = false;
		gfc.findReplayGain = false;
		gfc.findPeakSample = false;

		gfc.RadioGain = 0;
		gfc.AudiophileGain = 0;
		gfc.noclipGainChange = 0;
		gfc.noclipScale = -1.0f;

		gfp.preset = 0;

		gfp.write_id3tag_automatic = true;
		return 0;
	}

	public final LameGlobalFlags lame_init() {
		LameGlobalFlags gfp = new LameGlobalFlags();

		int ret = lame_init_old(gfp);
		if (ret != 0) {
			return null;
		}

		gfp.lame_allocated_gfp = 1;
		return gfp;
	}

	/***********************************************************************
	 * 
	 * some simple statistics
	 * 
	 * Robert Hegemann 2000-10-11
	 * 
	 ***********************************************************************/

	/**
	 * <PRE>
	 *  histogram of used bitrate indexes:
	 *  One has to weight them to calculate the average bitrate in kbps
	 * 
	 *  bitrate indices:
	 *  there are 14 possible bitrate indices, 0 has the special meaning
	 *  "free format" which is not possible to mix with VBR and 15 is forbidden
	 *  anyway.
	 * 
	 *  stereo modes:
	 *  0: LR   number of left-right encoded frames
	 *  1: LR-I number of left-right and intensity encoded frames
	 *  2: MS   number of mid-side encoded frames
	 *  3: MS-I number of mid-side and intensity encoded frames
	 * 
	 *  4: number of encoded frames
	 * </PRE>
	 */
	public final void lame_bitrate_kbps(final LameGlobalFlags gfp,
			final int bitrate_kbps[]) {
		final LameInternalFlags gfc;

		if (null == bitrate_kbps)
			return;
		if (null == gfp)
			return;
		gfc = gfp.internal_flags;
		if (null == gfc)
			return;

		if (gfp.free_format) {
			for (int i = 0; i < 14; i++)
				bitrate_kbps[i] = -1;
			bitrate_kbps[0] = gfp.brate;
		} else {
			for (int i = 0; i < 14; i++)
				bitrate_kbps[i] = Tables.bitrate_table[gfp.version][i + 1];
		}
	}

	public final void lame_bitrate_hist(final LameGlobalFlags gfp,
			final int bitrate_count[]) {

		if (null == bitrate_count)
			return;
		if (null == gfp)
			return;
		final LameInternalFlags gfc = gfp.internal_flags;
		if (null == gfc)
			return;

		if (gfp.free_format) {
			for (int i = 0; i < 14; i++)
				bitrate_count[i] = 0;
			bitrate_count[0] = gfc.bitrate_stereoMode_Hist[0][4];
		} else {
			for (int i = 0; i < 14; i++)
				bitrate_count[i] = gfc.bitrate_stereoMode_Hist[i + 1][4];
		}
	}

	public final void lame_stereo_mode_hist(final LameGlobalFlags gfp,
			final int stmode_count[]) {
		if (null == stmode_count)
			return;
		if (null == gfp)
			return;
		final LameInternalFlags gfc = gfp.internal_flags;
		if (null == gfc)
			return;

		for (int i = 0; i < 4; i++) {
			stmode_count[i] = gfc.bitrate_stereoMode_Hist[15][i];
		}
	}

	public final void lame_bitrate_stereo_mode_hist(final LameGlobalFlags gfp,
			final int bitrate_stmode_count[][]) {
		if (null == bitrate_stmode_count)
			return;
		if (null == gfp)
			return;
		final LameInternalFlags gfc = gfp.internal_flags;
		if (null == gfc)
			return;

		if (gfp.free_format) {
			for (int j = 0; j < 14; j++)
				for (int i = 0; i < 4; i++)
					bitrate_stmode_count[j][i] = 0;
			for (int i = 0; i < 4; i++)
				bitrate_stmode_count[0][i] = gfc.bitrate_stereoMode_Hist[0][i];
		} else {
			for (int j = 0; j < 14; j++)
				for (int i = 0; i < 4; i++)
					bitrate_stmode_count[j][i] = gfc.bitrate_stereoMode_Hist[j + 1][i];
		}
	}

	public final void lame_block_type_hist(final LameGlobalFlags gfp,
			final int btype_count[]) {
		if (null == btype_count)
			return;
		if (null == gfp)
			return;
		final LameInternalFlags gfc = gfp.internal_flags;
		if (null == gfc)
			return;

		for (int i = 0; i < 6; ++i) {
			btype_count[i] = gfc.bitrate_blockType_Hist[15][i];
		}
	}

	public final void lame_bitrate_block_type_hist(final LameGlobalFlags gfp,
			final int bitrate_btype_count[][]) {
		if (null == bitrate_btype_count)
			return;
		if (null == gfp)
			return;
		final LameInternalFlags gfc = gfp.internal_flags;
		if (null == gfc)
			return;

		if (gfp.free_format) {
			for (int j = 0; j < 14; ++j)
				for (int i = 0; i < 6; ++i)
					bitrate_btype_count[j][i] = 0;
			for (int i = 0; i < 6; ++i)
				bitrate_btype_count[0][i] = gfc.bitrate_blockType_Hist[0][i];
		} else {
			for (int j = 0; j < 14; ++j)
				for (int i = 0; i < 6; ++i)
					bitrate_btype_count[j][i] = gfc.bitrate_blockType_Hist[j + 1][i];
		}
	}

}
