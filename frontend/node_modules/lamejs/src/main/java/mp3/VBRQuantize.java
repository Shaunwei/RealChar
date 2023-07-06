/*
 *	MP3 quantization
 *
 *	Copyright (c) 1999-2000 Mark Taylor
 *	Copyright (c) 2000-2007 Robert Hegemann
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	 See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */

/* $Id: VBRQuantize.java,v 1.18 2011/08/27 18:57:12 kenchis Exp $ */

package mp3;

import java.util.Arrays;

public class VBRQuantize {

	QuantizePVT qupvt;
	Takehiro tak;

	public final void setModules(QuantizePVT qupvt, Takehiro tk) {
		this.qupvt = qupvt;
		this.tak = tk;
	}

	protected static class algo_t {
		alloc_sf_f alloc;
		float[] xr34orig;
		LameInternalFlags gfc;
		GrInfo cod_info;
		int mingain_l;
		int mingain_s[] = new int[3];
	}

	interface alloc_sf_f {
		void alloc(final algo_t al, final int[] x, final int[] y, final int z);
	}

	private float max_x34(final float[] xr34, int x34Pos, final int bw) {
		float xfsf = 0;
		int j = bw >> 1;
		final int remaining = (j & 0x01);

		for (j >>= 1; j > 0; --j) {
			if (xfsf < xr34[x34Pos + 0]) {
				xfsf = xr34[x34Pos + 0];
			}
			if (xfsf < xr34[x34Pos + 1]) {
				xfsf = xr34[x34Pos + 1];
			}
			if (xfsf < xr34[x34Pos + 2]) {
				xfsf = xr34[x34Pos + 2];
			}
			if (xfsf < xr34[x34Pos + 3]) {
				xfsf = xr34[x34Pos + 3];
			}
			x34Pos += 4;
		}
		if (remaining != 0) {
			if (xfsf < xr34[x34Pos + 0]) {
				xfsf = xr34[x34Pos + 0];
			}
			if (xfsf < xr34[x34Pos + 1]) {
				xfsf = xr34[x34Pos + 1];
			}
		}
		return xfsf;
	}

	private int findLowestScalefac(final float xr34) {
		int sfOk = 255;
		int sf = 128, delsf = 64;
		for (int i = 0; i < 8; ++i) {
			final float xfsf = qupvt.ipow20[sf] * xr34;
			if (xfsf <= QuantizePVT.IXMAX_VAL) {
				sfOk = sf;
				sf -= delsf;
			} else {
				sf += delsf;
			}
			delsf >>= 1;
		}
		return sfOk;
	}

	private int belowNoiseFloor(final float[] xr, int xrPos, float l3xmin,
			final int bw) {
		float sum = 0.0f;
		for (int i = 0, j = bw; j > 0; ++i, --j) {
			final float x = xr[xrPos + i];
			sum += x * x;
		}
		return (l3xmin - sum) >= -1E-20 ? 1 : 0;
	}

	private void k_34_4(final double x[], final int l3[], final int l3Pos) {
		assert (x[0] <= QuantizePVT.IXMAX_VAL && x[1] <= QuantizePVT.IXMAX_VAL
				&& x[2] <= QuantizePVT.IXMAX_VAL && x[3] <= QuantizePVT.IXMAX_VAL);
		l3[l3Pos + 0] = (int) x[0];
		l3[l3Pos + 1] = (int) x[1];
		l3[l3Pos + 2] = (int) x[2];
		l3[l3Pos + 3] = (int) x[3];
		x[0] += qupvt.adj43[l3[l3Pos + 0]];
		x[1] += qupvt.adj43[l3[l3Pos + 1]];
		x[2] += qupvt.adj43[l3[l3Pos + 2]];
		x[3] += qupvt.adj43[l3[l3Pos + 3]];
		l3[l3Pos + 0] = (int) x[0];
		l3[l3Pos + 1] = (int) x[1];
		l3[l3Pos + 2] = (int) x[2];
		l3[l3Pos + 3] = (int) x[3];
	}

	private void k_34_2(final double x[], final int l3[], final int l3Pos) {
		assert (x[0] <= QuantizePVT.IXMAX_VAL && x[1] <= QuantizePVT.IXMAX_VAL);
		l3[l3Pos + 0] = (int) x[0];
		l3[l3Pos + 1] = (int) x[1];
		x[0] += qupvt.adj43[l3[l3Pos + 0]];
		x[1] += qupvt.adj43[l3[l3Pos + 1]];
		l3[l3Pos + 0] = (int) x[0];
		l3[l3Pos + 1] = (int) x[1];
	}

	private float calc_sfb_noise_x34(final float[] xr, final float[] xr34,
			int xrPos, int bw, int sf) {
		double x[] = new double[4];
		int l3[] = new int[4];
		final float sfpow = qupvt.pow20[sf + QuantizePVT.Q_MAX2];
		final float sfpow34 = qupvt.ipow20[sf];

		float xfsf = 0;
		int j = bw >> 1;
		final int remaining = (j & 0x01);

		for (j >>= 1; j > 0; --j) {
			x[0] = sfpow34 * xr34[xrPos + 0];
			x[1] = sfpow34 * xr34[xrPos + 1];
			x[2] = sfpow34 * xr34[xrPos + 2];
			x[3] = sfpow34 * xr34[xrPos + 3];

			k_34_4(x, l3, 0);

			x[0] = Math.abs(xr[xrPos + 0]) - sfpow * qupvt.pow43[l3[0]];
			x[1] = Math.abs(xr[xrPos + 1]) - sfpow * qupvt.pow43[l3[1]];
			x[2] = Math.abs(xr[xrPos + 2]) - sfpow * qupvt.pow43[l3[2]];
			x[3] = Math.abs(xr[xrPos + 3]) - sfpow * qupvt.pow43[l3[3]];
			xfsf += (x[0] * x[0] + x[1] * x[1]) + (x[2] * x[2] + x[3] * x[3]);

			xrPos += 4;
		}
		if (remaining != 0) {
			x[0] = sfpow34 * xr34[xrPos + 0];
			x[1] = sfpow34 * xr34[xrPos + 1];

			k_34_2(x, l3, 0);

			x[0] = Math.abs(xr[xrPos + 0]) - sfpow * qupvt.pow43[l3[0]];
			x[1] = Math.abs(xr[xrPos + 1]) - sfpow * qupvt.pow43[l3[1]];
			xfsf += x[0] * x[0] + x[1] * x[1];
		}
		return xfsf;
	}

	protected static class CalcNoiseCache {
		int valid;
		float value;
	};

	private boolean tri_calc_sfb_noise_x34(final float[] xr,
			final float[] xr34, final int xrPos, final float l3_xmin,
			final int bw, final int sf, final CalcNoiseCache[] did_it) {
		if (did_it[sf].valid == 0) {
			did_it[sf].valid = 1;
			did_it[sf].value = calc_sfb_noise_x34(xr, xr34, xrPos, bw, sf);
		}
		if (l3_xmin < did_it[sf].value) {
			return true;
		}
		if (sf < 255) {
			final int sf_x = sf + 1;
			if (did_it[sf_x].valid == 0) {
				did_it[sf_x].valid = 1;
				did_it[sf_x].value = calc_sfb_noise_x34(xr, xr34, xrPos, bw,
						sf_x);
			}
			if (l3_xmin < did_it[sf_x].value) {
				return true;
			}
		}
		if (sf > 0) {
			final int sf_x = sf - 1;
			if (did_it[sf_x].valid == 0) {
				did_it[sf_x].valid = 1;
				did_it[sf_x].value = calc_sfb_noise_x34(xr, xr34, xrPos, bw,
						sf_x);
			}
			if (l3_xmin < did_it[sf_x].value) {
				return true;
			}
		}
		return false;
	}

	/**
	 * the find_scalefac* routines calculate a quantization step size which
	 * would introduce as much noise as is allowed. The larger the step size the
	 * more quantization noise we'll get. The scalefactors are there to lower
	 * the global step size, allowing limited differences in quantization step
	 * sizes per band (shaping the noise).
	 */
	private int find_scalefac_x34(final float[] xr, final float[] xr34,
			final int xrPos, final float l3_xmin, final int bw, final int sf_min) {
		CalcNoiseCache did_it[] = new CalcNoiseCache[256];
		int sf = 128, sf_ok = 255, delsf = 128, seen_good_one = 0, i;
		for (int j = 0; j < did_it.length; j++) {
			did_it[j] = new CalcNoiseCache();
		}
		for (i = 0; i < 8; ++i) {
			delsf >>= 1;
			if (sf <= sf_min) {
				sf += delsf;
			} else {
				final boolean bad = tri_calc_sfb_noise_x34(xr, xr34, xrPos,
						l3_xmin, bw, sf, did_it);
				if (bad) {
					/* distortion. try a smaller scalefactor */
					sf -= delsf;
				} else {
					sf_ok = sf;
					sf += delsf;
					seen_good_one = 1;
				}
			}
		}
		// returning a scalefac without distortion, if possible
		if (seen_good_one > 0) {
			return sf_ok;
		}
		if (sf <= sf_min) {
			return sf_min;
		}
		return sf;
	}

	/**
	 * 
	 * calc_short_block_vbr_sf(), calc_long_block_vbr_sf()
	 * 
	 * a variation for vbr-mtrh
	 * 
	 * @author Mark Taylor 2000-??-??
	 * @author Robert Hegemann 2000-10-25 made functions of it
	 */
	private int block_sf(final algo_t that, final float l3_xmin[],
			final int vbrsf[], final int vbrsfmin[]) {
		float max_xr34;
		final float[] xr = that.cod_info.xr;
		final float[] xr34_orig = that.xr34orig;
		final int[] width = that.cod_info.width;
		final int max_nonzero_coeff = that.cod_info.max_nonzero_coeff;
		int maxsf = 0;
		int sfb = 0;
		int j = 0, i = 0;
		final int psymax = that.cod_info.psymax;

		assert (that.cod_info.max_nonzero_coeff >= 0);

		that.mingain_l = 0;
		that.mingain_s[0] = 0;
		that.mingain_s[1] = 0;
		that.mingain_s[2] = 0;
		while (j <= max_nonzero_coeff) {
			final int w = width[sfb];
			final int m = (max_nonzero_coeff - j + 1);
			int l = w;
			int m1, m2;
			if (l > m) {
				l = m;
			}
			max_xr34 = max_x34(xr34_orig, j, l);

			m1 = findLowestScalefac(max_xr34);
			vbrsfmin[sfb] = m1;
			if (that.mingain_l < m1) {
				that.mingain_l = m1;
			}
			if (that.mingain_s[i] < m1) {
				that.mingain_s[i] = m1;
			}
			if (++i > 2) {
				i = 0;
			}
			if (sfb < psymax) {
				if (belowNoiseFloor(xr, j, l3_xmin[sfb], l) == 0) {
					m2 = find_scalefac_x34(xr, xr34_orig, j, l3_xmin[sfb], l,
							m1);
					if (maxsf < m2) {
						maxsf = m2;
					}
				} else {
					m2 = 255;
					maxsf = 255;
				}
			} else {
				if (maxsf < m1) {
					maxsf = m1;
				}
				m2 = maxsf;
			}
			vbrsf[sfb] = m2;
			++sfb;
			j += w;
		}
		for (; sfb < L3Side.SFBMAX; ++sfb) {
			vbrsf[sfb] = maxsf;
			vbrsfmin[sfb] = 0;
		}
		return maxsf;
	}

	/**
	 * quantize xr34 based on scalefactors
	 * 
	 * block_xr34
	 * 
	 * @author Mark Taylor 2000-??-??
	 * @author Robert Hegemann 2000-10-20 made functions of them
	 */
	private final void quantize_x34(final algo_t that) {
		double x[] = new double[4];
		int xr34_orig = 0;
		final GrInfo cod_info = that.cod_info;
		final int ifqstep = (cod_info.scalefac_scale == 0) ? 2 : 4;
		int l3 = 0;
		int j = 0, sfb = 0;
		final int max_nonzero_coeff = cod_info.max_nonzero_coeff;

		assert (cod_info.max_nonzero_coeff >= 0);
		assert (cod_info.max_nonzero_coeff < 576);

		while (j <= max_nonzero_coeff) {
			final int s = (cod_info.scalefac[sfb] + (cod_info.preflag != 0 ? qupvt.pretab[sfb]
					: 0))
					* ifqstep
					+ cod_info.subblock_gain[cod_info.window[sfb]]
					* 8;
			final int sfac = (cod_info.global_gain - s);
			final float sfpow34 = qupvt.ipow20[sfac];
			final int w = cod_info.width[sfb];
			final int m = (max_nonzero_coeff - j + 1);
			int l = w;
			int remaining;

			assert ((cod_info.global_gain - s) >= 0);
			assert (cod_info.width[sfb] >= 0);

			if (l > m) {
				l = m;
			}
			j += w;
			++sfb;
			l >>= 1;
			remaining = (l & 1);

			for (l >>= 1; l > 0; --l) {
				x[0] = sfpow34 * that.xr34orig[xr34_orig + 0];
				x[1] = sfpow34 * that.xr34orig[xr34_orig + 1];
				x[2] = sfpow34 * that.xr34orig[xr34_orig + 2];
				x[3] = sfpow34 * that.xr34orig[xr34_orig + 3];

				k_34_4(x, cod_info.l3_enc, l3);

				l3 += 4;
				xr34_orig += 4;
			}
			if (remaining != 0) {
				x[0] = sfpow34 * that.xr34orig[xr34_orig + 0];
				x[1] = sfpow34 * that.xr34orig[xr34_orig + 1];

				k_34_2(x, cod_info.l3_enc, l3);

				l3 += 2;
				xr34_orig += 2;
			}
		}
	}

	protected static final int max_range_short[] = { 15, 15, 15, 15, 15, 15,
			15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 7, 7, 7, 7, 7, 7,
			7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0 };

	protected static final int max_range_long[] = { 15, 15, 15, 15, 15, 15, 15,
			15, 15, 15, 15, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0 };

	protected static final int max_range_long_lsf_pretab[] = { 7, 7, 7, 7, 7,
			7, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

	protected void set_subblock_gain(final GrInfo cod_info,
			final int mingain_s[], final int sf[]) {
		final int maxrange1 = 15, maxrange2 = 7;
		final int ifqstepShift = (cod_info.scalefac_scale == 0) ? 1 : 2;
		int[] sbg = cod_info.subblock_gain;
		final int psymax = (int) cod_info.psymax;
		int psydiv = 18;
		int sbg0, sbg1, sbg2;
		int sfb;
		int min_sbg = 7;

		if (psydiv > psymax) {
			psydiv = psymax;
		}
		for (int i = 0; i < 3; ++i) {
			int maxsf1 = 0, maxsf2 = 0, minsf = 1000;
			/* see if we should use subblock gain */
			for (sfb = i; sfb < psydiv; sfb += 3) {
				/* part 1 */
				final int v = -sf[sfb];
				if (maxsf1 < v) {
					maxsf1 = v;
				}
				if (minsf > v) {
					minsf = v;
				}
			}
			for (; sfb < L3Side.SFBMAX; sfb += 3) {
				/* part 2 */
				final int v = -sf[sfb];
				if (maxsf2 < v) {
					maxsf2 = v;
				}
				if (minsf > v) {
					minsf = v;
				}
			}

			/*
			 * boost subblock gain as little as possible so we can reach maxsf1
			 * with scalefactors 8*sbg >= maxsf1
			 */
			{
				final int m1 = maxsf1 - (maxrange1 << ifqstepShift);
				final int m2 = maxsf2 - (maxrange2 << ifqstepShift);

				maxsf1 = Math.max(m1, m2);
			}
			if (minsf > 0) {
				sbg[i] = minsf >> 3;
			} else {
				sbg[i] = 0;
			}
			if (maxsf1 > 0) {
				final int m1 = sbg[i];
				final int m2 = (maxsf1 + 7) >> 3;
				sbg[i] = Math.max(m1, m2);
			}
			if (sbg[i] > 0
					&& mingain_s[i] > (cod_info.global_gain - sbg[i] * 8)) {
				sbg[i] = (cod_info.global_gain - mingain_s[i]) >> 3;
			}
			if (sbg[i] > 7) {
				sbg[i] = 7;
			}
			if (min_sbg > sbg[i]) {
				min_sbg = sbg[i];
			}
		}
		sbg0 = sbg[0] * 8;
		sbg1 = sbg[1] * 8;
		sbg2 = sbg[2] * 8;
		for (sfb = 0; sfb < L3Side.SFBMAX; sfb += 3) {
			sf[sfb + 0] += sbg0;
			sf[sfb + 1] += sbg1;
			sf[sfb + 2] += sbg2;
		}
		if (min_sbg > 0) {
			for (int i = 0; i < 3; ++i) {
				sbg[i] -= min_sbg;
			}
			cod_info.global_gain -= min_sbg * 8;
		}
	}

	protected void set_scalefacs(final GrInfo cod_info,
			final int[] vbrsfmin, final int sf[], final int[] max_range) {
		final int ifqstep = (cod_info.scalefac_scale == 0) ? 2 : 4;
		final int ifqstepShift = (cod_info.scalefac_scale == 0) ? 1 : 2;
		final int[] scalefac = cod_info.scalefac;
		final int sfbmax = cod_info.sfbmax;
		final int[] sbg = cod_info.subblock_gain;
		final int[] window = cod_info.window;
		final int preflag = cod_info.preflag;

		if (preflag != 0) {
			for (int sfb = 11; sfb < sfbmax; ++sfb) {
				sf[sfb] += qupvt.pretab[sfb] * ifqstep;
			}
		}
		for (int sfb = 0; sfb < sfbmax; ++sfb) {
			final int gain = cod_info.global_gain - (sbg[window[sfb]] * 8)
					- ((preflag != 0 ? qupvt.pretab[sfb] : 0) * ifqstep);

			if (sf[sfb] < 0) {
				final int m = gain - vbrsfmin[sfb];
				/* ifqstep*scalefac >= -sf[sfb], so round UP */
				scalefac[sfb] = (ifqstep - 1 - sf[sfb]) >> ifqstepShift;

				if (scalefac[sfb] > max_range[sfb]) {
					scalefac[sfb] = max_range[sfb];
				}
				if (scalefac[sfb] > 0 && (scalefac[sfb] << ifqstepShift) > m) {
					scalefac[sfb] = m >> ifqstepShift;
				}
			} else {
				scalefac[sfb] = 0;
			}
		}
		for (int sfb = sfbmax; sfb < L3Side.SFBMAX; ++sfb) {
			scalefac[sfb] = 0; /* sfb21 */
		}
	}

	protected boolean checkScalefactor(final GrInfo cod_info,
			final int vbrsfmin[]) {
		final int ifqstep = cod_info.scalefac_scale == 0 ? 2 : 4;
		for (int sfb = 0; sfb < cod_info.psymax; ++sfb) {
			final int s = ((cod_info.scalefac[sfb] + (cod_info.preflag != 0 ? qupvt.pretab[sfb]
					: 0)) * ifqstep)
					+ cod_info.subblock_gain[cod_info.window[sfb]] * 8;

			if ((cod_info.global_gain - s) < vbrsfmin[sfb]) {
				/**
				 * <CODE>
				 * fprintf( stdout, "sf %d\n", sfb );
				 * fprintf( stdout, "min %d\n", vbrsfmin[sfb] );
				 * fprintf( stdout, "ggain %d\n", cod_info.global_gain );
				 * fprintf( stdout, "scalefac %d\n", cod_info.scalefac[sfb] );
				 * fprintf( stdout, "pretab %d\n", (cod_info.preflag ? pretab[sfb] : 0) );
				 * fprintf( stdout, "scale %d\n", (cod_info.scalefac_scale + 1) );
				 * fprintf( stdout, "subgain %d\n", cod_info.subblock_gain[cod_info.window[sfb]] * 8 );
				 * fflush( stdout );
				 * exit(-1);
				 * </CODE>
				 */
				return false;
			}
		}
		return true;
	}

	private void bitcount(final algo_t that) {
		boolean rc;

		if (that.gfc.mode_gr == 2) {
			rc = tak.scale_bitcount(that.cod_info);
		} else {
			rc = tak.scale_bitcount_lsf(that.gfc, that.cod_info);
		}
		if (!rc) {
			return;
		}
		/* this should not happen due to the way the scalefactors are selected */
		throw new RuntimeException("INTERNAL ERROR IN VBR NEW CODE (986), please send bug report");
	}

	private int quantizeAndCountBits(final algo_t that) {
		quantize_x34(that);
		that.cod_info.part2_3_length = tak.noquant_count_bits(that.gfc,
				that.cod_info, null);
		return that.cod_info.part2_3_length;
	}

	private int tryGlobalStepsize(final algo_t that, final int sfwork[],
			final int vbrsfmin[], int delta) {
		final float xrpow_max = that.cod_info.xrpow_max;
		int sftemp[] = new int[L3Side.SFBMAX], nbits;
		int vbrmax = 0;
		for (int i = 0; i < L3Side.SFBMAX; ++i) {
			int gain = sfwork[i] + delta;
			if (gain < vbrsfmin[i]) {
				gain = vbrsfmin[i];
			}
			if (gain > 255) {
				gain = 255;
			}
			if (vbrmax < gain) {
				vbrmax = gain;
			}
			sftemp[i] = gain;
		}
		that.alloc.alloc(that, sftemp, vbrsfmin, vbrmax);
		bitcount(that);
		nbits = quantizeAndCountBits(that);
		that.cod_info.xrpow_max = xrpow_max;
		return nbits;
	}

	private void searchGlobalStepsizeMax(final algo_t that, final int sfwork[],
			final int vbrsfmin[], final int target) {
		final GrInfo cod_info = that.cod_info;
		final int gain = cod_info.global_gain;
		int curr = gain;
		int gain_ok = 1024;
		int nbits = QuantizePVT.LARGE_BITS;
		int l = gain, r = 512;

		assert (gain >= 0);
		while (l <= r) {
			curr = (l + r) >> 1;
			nbits = tryGlobalStepsize(that, sfwork, vbrsfmin, curr - gain);
			if (nbits == 0 || (nbits + cod_info.part2_length) < target) {
				r = curr - 1;
				gain_ok = curr;
			} else {
				l = curr + 1;
				if (gain_ok == 1024) {
					gain_ok = curr;
				}
			}
		}
		if (gain_ok != curr) {
			curr = gain_ok;
			nbits = tryGlobalStepsize(that, sfwork, vbrsfmin, curr - gain);
		}
	}

	private int sfDepth(final int sfwork[]) {
		int m = 0;
		for (int j = L3Side.SFBMAX, i = 0; j > 0; --j, ++i) {
			final int di = 255 - sfwork[i];
			if (m < di) {
				m = di;
			}
			assert (sfwork[i] >= 0);
			assert (sfwork[i] <= 255);
		}
		assert (m >= 0);
		assert (m <= 255);
		return m;
	}

	private void cutDistribution(final int sfwork[], final int sf_out[],
			final int cut) {
		for (int j = L3Side.SFBMAX, i = 0; j > 0; --j, ++i) {
			final int x = sfwork[i];
			sf_out[i] = x < cut ? x : cut;
		}
	}

	private int flattenDistribution(final int sfwork[], final int sf_out[],
			final int dm, final int k, final int p) {
		int sfmax = 0;
		if (dm > 0) {
			for (int j = L3Side.SFBMAX, i = 0; j > 0; --j, ++i) {
				final int di = p - sfwork[i];
				int x = sfwork[i] + (k * di) / dm;
				if (x < 0) {
					x = 0;
				} else {
					if (x > 255) {
						x = 255;
					}
				}
				sf_out[i] = x;
				if (sfmax < x) {
					sfmax = x;
				}
			}
		} else {
			for (int j = L3Side.SFBMAX, i = 0; j > 0; --j, ++i) {
				int x = sfwork[i];
				sf_out[i] = x;
				if (sfmax < x) {
					sfmax = x;
				}
			}
		}
		return sfmax;
	}

	private int tryThatOne(final algo_t that, final int sftemp[],
			final int vbrsfmin[], final int vbrmax) {
		final float xrpow_max = that.cod_info.xrpow_max;
		int nbits = QuantizePVT.LARGE_BITS;
		that.alloc.alloc(that, sftemp, vbrsfmin, vbrmax);
		bitcount(that);
		nbits = quantizeAndCountBits(that);
		nbits += that.cod_info.part2_length;
		that.cod_info.xrpow_max = xrpow_max;
		return nbits;
	}

	private void outOfBitsStrategy(final algo_t that, final int sfwork[],
			final int vbrsfmin[], final int target) {
		int wrk[] = new int[L3Side.SFBMAX];
		final int dm = sfDepth(sfwork);
		final int p = that.cod_info.global_gain;

		/* PART 1 */
		{
			int bi = dm / 2;
			int bi_ok = -1;
			int bu = 0;
			int bo = dm;
			for (;;) {
				final int sfmax = flattenDistribution(sfwork, wrk, dm, bi, p);
				int nbits = tryThatOne(that, wrk, vbrsfmin, sfmax);
				if (nbits <= target) {
					bi_ok = bi;
					bo = bi - 1;
				} else {
					bu = bi + 1;
				}
				if (bu <= bo) {
					bi = (bu + bo) / 2;
				} else {
					break;
				}
			}
			if (bi_ok >= 0) {
				if (bi != bi_ok) {
					final int sfmax = flattenDistribution(sfwork, wrk, dm,
							bi_ok, p);
					tryThatOne(that, wrk, vbrsfmin, sfmax);
				}
				return;
			}
		}

		/* PART 2: */
		{
			int bi = (255 + p) / 2;
			int bi_ok = -1;
			int bu = p;
			int bo = 255;
			for (;;) {
				final int sfmax = flattenDistribution(sfwork, wrk, dm, dm, bi);
				int nbits = tryThatOne(that, wrk, vbrsfmin, sfmax);
				if (nbits <= target) {
					bi_ok = bi;
					bo = bi - 1;
				} else {
					bu = bi + 1;
				}
				if (bu <= bo) {
					bi = (bu + bo) / 2;
				} else {
					break;
				}
			}
			if (bi_ok >= 0) {
				if (bi != bi_ok) {
					final int sfmax = flattenDistribution(sfwork, wrk, dm, dm,
							bi_ok);
					tryThatOne(that, wrk, vbrsfmin, sfmax);
				}
				return;
			}
		}

		/* fall back to old code, likely to be never called */
		searchGlobalStepsizeMax(that, wrk, vbrsfmin, target);
	}

	private int reduce_bit_usage(final LameInternalFlags gfc, final int gr,
			final int ch) {
		final GrInfo cod_info = gfc.l3_side.tt[gr][ch];
		// try some better scalefac storage
		tak.best_scalefac_store(gfc, gr, ch, gfc.l3_side);

		// best huffman_divide may save some bits too
		if (gfc.use_best_huffman == 1)
			tak.best_huffman_divide(gfc, cod_info);
		return cod_info.part2_3_length + cod_info.part2_length;
	}

	public int VBR_encode_frame(final LameInternalFlags gfc,
			final float xr34orig[][][], final float l3_xmin[][][],
			final int max_bits[][]) {
		int sfwork_[][][] = new int[2][2][L3Side.SFBMAX];
		int vbrsfmin_[][][] = new int[2][2][L3Side.SFBMAX];
		algo_t that_[][] = new algo_t[2][2];
		final int ngr = gfc.mode_gr;
		final int nch = gfc.channels_out;
		int max_nbits_ch[][] = new int[2][2];
		int max_nbits_gr[] = new int[2];
		int max_nbits_fr = 0;
		int use_nbits_ch[][] = new int[2][2];
		int use_nbits_gr[] = new int[2];
		int use_nbits_fr = 0;

		/*
		 * set up some encoding parameters
		 */
		for (int gr = 0; gr < ngr; ++gr) {
			max_nbits_gr[gr] = 0;
			for (int ch = 0; ch < nch; ++ch) {
				max_nbits_ch[gr][ch] = max_bits[gr][ch];
				use_nbits_ch[gr][ch] = 0;
				max_nbits_gr[gr] += max_bits[gr][ch];
				max_nbits_fr += max_bits[gr][ch];
				that_[gr][ch] = new algo_t();
				that_[gr][ch].gfc = gfc;
				that_[gr][ch].cod_info = gfc.l3_side.tt[gr][ch];
				that_[gr][ch].xr34orig = xr34orig[gr][ch];
				if (that_[gr][ch].cod_info.block_type == Encoder.SHORT_TYPE) {
					that_[gr][ch].alloc = new ShortBlockConstrain(this);
				} else {
					that_[gr][ch].alloc = new LongBlockConstrain(this);
				}
			} /* for ch */
		}

		/*
		 * searches scalefactors
		 */
		for (int gr = 0; gr < ngr; ++gr) {
			for (int ch = 0; ch < nch; ++ch) {
				if (max_bits[gr][ch] > 0) {
					algo_t that = that_[gr][ch];
					int[] sfwork = sfwork_[gr][ch];
					int[] vbrsfmin = vbrsfmin_[gr][ch];
					int vbrmax;

					vbrmax = block_sf(that, l3_xmin[gr][ch], sfwork, vbrsfmin);
					that.alloc.alloc(that, sfwork, vbrsfmin, vbrmax);
					bitcount(that);
				} else {
					/*
					 * xr contains no energy l3_enc, our encoding data, will be
					 * quantized to zero continue with next channel
					 */
				}
			} /* for ch */
		}

		/*
		 * encode 'as is'
		 */
		use_nbits_fr = 0;
		for (int gr = 0; gr < ngr; ++gr) {
			use_nbits_gr[gr] = 0;
			for (int ch = 0; ch < nch; ++ch) {
				algo_t that = that_[gr][ch];
				if (max_bits[gr][ch] > 0) {
					final int max_nonzero_coeff = that.cod_info.max_nonzero_coeff;

					assert (max_nonzero_coeff < 576);
					Arrays.fill(that.cod_info.l3_enc, max_nonzero_coeff, 576, 0);

					quantizeAndCountBits(that);
				} else {
					/*
					 * xr contains no energy l3_enc, our encoding data, will be
					 * quantized to zero continue with next channel
					 */
				}
				use_nbits_ch[gr][ch] = reduce_bit_usage(gfc, gr, ch);
				use_nbits_gr[gr] += use_nbits_ch[gr][ch];
			} /* for ch */
			use_nbits_fr += use_nbits_gr[gr];
		}

		/*
		 * check bit constrains
		 */
		if (use_nbits_fr <= max_nbits_fr) {
			boolean ok = true;
			for (int gr = 0; gr < ngr; ++gr) {
				if (use_nbits_gr[gr] > LameInternalFlags.MAX_BITS_PER_GRANULE) {
					/*
					 * violates the rule that every granule has to use no more
					 * bits than MAX_BITS_PER_GRANULE
					 */
					ok = false;
				}
				for (int ch = 0; ch < nch; ++ch) {
					if (use_nbits_ch[gr][ch] > LameInternalFlags.MAX_BITS_PER_CHANNEL) {
						/*
						 * violates the rule that every gr_ch has to use no more
						 * bits than MAX_BITS_PER_CHANNEL
						 * 
						 * This isn't explicitly stated in the ISO docs, but the
						 * part2_3_length field has only 12 bits, that makes it
						 * up to a maximum size of 4095 bits!!!
						 */
						ok = false;
					}
				}
			}
			if (ok) {
				return use_nbits_fr;
			}
		}

		/*
		 * OK, we are in trouble and have to define how many bits are to be used
		 * for each granule
		 */
		{
			boolean ok = true;
			int sum_fr = 0;

			for (int gr = 0; gr < ngr; ++gr) {
				max_nbits_gr[gr] = 0;
				for (int ch = 0; ch < nch; ++ch) {
					if (use_nbits_ch[gr][ch] > LameInternalFlags.MAX_BITS_PER_CHANNEL) {
						max_nbits_ch[gr][ch] = LameInternalFlags.MAX_BITS_PER_CHANNEL;
					} else {
						max_nbits_ch[gr][ch] = use_nbits_ch[gr][ch];
					}
					max_nbits_gr[gr] += max_nbits_ch[gr][ch];
				}
				if (max_nbits_gr[gr] > LameInternalFlags.MAX_BITS_PER_GRANULE) {
					float f[] = new float[2], s = 0;
					for (int ch = 0; ch < nch; ++ch) {
						if (max_nbits_ch[gr][ch] > 0) {
							f[ch] = (float) Math.sqrt(Math
									.sqrt(max_nbits_ch[gr][ch]));
							s += f[ch];
						} else {
							f[ch] = 0;
						}
					}
					for (int ch = 0; ch < nch; ++ch) {
						if (s > 0) {
							max_nbits_ch[gr][ch] = (int) (LameInternalFlags.MAX_BITS_PER_GRANULE
									* f[ch] / s);
						} else {
							max_nbits_ch[gr][ch] = 0;
						}
					}
					if (nch > 1) {
						if (max_nbits_ch[gr][0] > use_nbits_ch[gr][0] + 32) {
							max_nbits_ch[gr][1] += max_nbits_ch[gr][0];
							max_nbits_ch[gr][1] -= use_nbits_ch[gr][0] + 32;
							max_nbits_ch[gr][0] = use_nbits_ch[gr][0] + 32;
						}
						if (max_nbits_ch[gr][1] > use_nbits_ch[gr][1] + 32) {
							max_nbits_ch[gr][0] += max_nbits_ch[gr][1];
							max_nbits_ch[gr][0] -= use_nbits_ch[gr][1] + 32;
							max_nbits_ch[gr][1] = use_nbits_ch[gr][1] + 32;
						}
						if (max_nbits_ch[gr][0] > LameInternalFlags.MAX_BITS_PER_CHANNEL) {
							max_nbits_ch[gr][0] = LameInternalFlags.MAX_BITS_PER_CHANNEL;
						}
						if (max_nbits_ch[gr][1] > LameInternalFlags.MAX_BITS_PER_CHANNEL) {
							max_nbits_ch[gr][1] = LameInternalFlags.MAX_BITS_PER_CHANNEL;
						}
					}
					max_nbits_gr[gr] = 0;
					for (int ch = 0; ch < nch; ++ch) {
						max_nbits_gr[gr] += max_nbits_ch[gr][ch];
					}
				}
				sum_fr += max_nbits_gr[gr];
			}
			if (sum_fr > max_nbits_fr) {
				{
					float f[] = new float[2], s = 0;
					for (int gr = 0; gr < ngr; ++gr) {
						if (max_nbits_gr[gr] > 0) {
							f[gr] = (float) Math.sqrt(max_nbits_gr[gr]);
							s += f[gr];
						} else {
							f[gr] = 0;
						}
					}
					for (int gr = 0; gr < ngr; ++gr) {
						if (s > 0) {
							max_nbits_gr[gr] = (int) (max_nbits_fr * f[gr] / s);
						} else {
							max_nbits_gr[gr] = 0;
						}
					}
				}
				if (ngr > 1) {
					if (max_nbits_gr[0] > use_nbits_gr[0] + 125) {
						max_nbits_gr[1] += max_nbits_gr[0];
						max_nbits_gr[1] -= use_nbits_gr[0] + 125;
						max_nbits_gr[0] = use_nbits_gr[0] + 125;
					}
					if (max_nbits_gr[1] > use_nbits_gr[1] + 125) {
						max_nbits_gr[0] += max_nbits_gr[1];
						max_nbits_gr[0] -= use_nbits_gr[1] + 125;
						max_nbits_gr[1] = use_nbits_gr[1] + 125;
					}
					for (int gr = 0; gr < ngr; ++gr) {
						if (max_nbits_gr[gr] > LameInternalFlags.MAX_BITS_PER_GRANULE) {
							max_nbits_gr[gr] = LameInternalFlags.MAX_BITS_PER_GRANULE;
						}
					}
				}
				for (int gr = 0; gr < ngr; ++gr) {
					float f[] = new float[2], s = 0;
					for (int ch = 0; ch < nch; ++ch) {
						if (max_nbits_ch[gr][ch] > 0) {
							f[ch] = (float) Math.sqrt(max_nbits_ch[gr][ch]);
							s += f[ch];
						} else {
							f[ch] = 0;
						}
					}
					for (int ch = 0; ch < nch; ++ch) {
						if (s > 0) {
							max_nbits_ch[gr][ch] = (int) (max_nbits_gr[gr]
									* f[ch] / s);
						} else {
							max_nbits_ch[gr][ch] = 0;
						}
					}
					if (nch > 1) {
						if (max_nbits_ch[gr][0] > use_nbits_ch[gr][0] + 32) {
							max_nbits_ch[gr][1] += max_nbits_ch[gr][0];
							max_nbits_ch[gr][1] -= use_nbits_ch[gr][0] + 32;
							max_nbits_ch[gr][0] = use_nbits_ch[gr][0] + 32;
						}
						if (max_nbits_ch[gr][1] > use_nbits_ch[gr][1] + 32) {
							max_nbits_ch[gr][0] += max_nbits_ch[gr][1];
							max_nbits_ch[gr][0] -= use_nbits_ch[gr][1] + 32;
							max_nbits_ch[gr][1] = use_nbits_ch[gr][1] + 32;
						}
						for (int ch = 0; ch < nch; ++ch) {
							if (max_nbits_ch[gr][ch] > LameInternalFlags.MAX_BITS_PER_CHANNEL) {
								max_nbits_ch[gr][ch] = LameInternalFlags.MAX_BITS_PER_CHANNEL;
							}
						}
					}
				}
			}
			/* sanity check */
			sum_fr = 0;
			for (int gr = 0; gr < ngr; ++gr) {
				int sum_gr = 0;
				for (int ch = 0; ch < nch; ++ch) {
					sum_gr += max_nbits_ch[gr][ch];
					if (max_nbits_ch[gr][ch] > LameInternalFlags.MAX_BITS_PER_CHANNEL) {
						ok = false;
					}
				}
				sum_fr += sum_gr;
				if (sum_gr > LameInternalFlags.MAX_BITS_PER_GRANULE) {
					ok = false;
				}
			}
			if (sum_fr > max_nbits_fr) {
				ok = false;
			}
			if (!ok) {
				/*
				 * we must have done something wrong, fallback to 'on_pe' based
				 * constrain
				 */
				for (int gr = 0; gr < ngr; ++gr) {
					for (int ch = 0; ch < nch; ++ch) {
						max_nbits_ch[gr][ch] = max_bits[gr][ch];
					}
				}
			}
		}

		/*
		 * we already called the 'best_scalefac_store' function, so we need to
		 * reset some variables before we can do it again.
		 */
		for (int ch = 0; ch < nch; ++ch) {
			gfc.l3_side.scfsi[ch][0] = 0;
			gfc.l3_side.scfsi[ch][1] = 0;
			gfc.l3_side.scfsi[ch][2] = 0;
			gfc.l3_side.scfsi[ch][3] = 0;
		}
		for (int gr = 0; gr < ngr; ++gr) {
			for (int ch = 0; ch < nch; ++ch) {
				gfc.l3_side.tt[gr][ch].scalefac_compress = 0;
			}
		}

		/*
		 * alter our encoded data, until it fits into the target bitrate
		 */
		use_nbits_fr = 0;
		for (int gr = 0; gr < ngr; ++gr) {
			use_nbits_gr[gr] = 0;
			for (int ch = 0; ch < nch; ++ch) {
				algo_t that = that_[gr][ch];
				use_nbits_ch[gr][ch] = 0;
				if (max_bits[gr][ch] > 0) {
					int[] sfwork = sfwork_[gr][ch];
					int[] vbrsfmin = vbrsfmin_[gr][ch];
					cutDistribution(sfwork, sfwork, that.cod_info.global_gain);
					outOfBitsStrategy(that, sfwork, vbrsfmin,
							max_nbits_ch[gr][ch]);
				}
				use_nbits_ch[gr][ch] = reduce_bit_usage(gfc, gr, ch);
				assert (use_nbits_ch[gr][ch] <= max_nbits_ch[gr][ch]);
				use_nbits_gr[gr] += use_nbits_ch[gr][ch];
			} /* for ch */
			use_nbits_fr += use_nbits_gr[gr];
		}

		/*
		 * check bit constrains, but it should always be ok, if there are no
		 * bugs ;-)
		 */
		if (use_nbits_fr <= max_nbits_fr) {
			return use_nbits_fr;
		}

		throw new RuntimeException(String.format(
				"INTERNAL ERROR IN VBR NEW CODE (1313), please send bug report\n"
						+ "maxbits=%d usedbits=%d\n", max_nbits_fr,
				use_nbits_fr));
	}

}
