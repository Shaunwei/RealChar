/*
 *	MP3 huffman table selecting and bit counting
 *
 *	Copyright (c) 1999-2005 Takehiro TOMINAGA
 *	Copyright (c) 2002-2005 Gabriel Bouvigne
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

/* $Id: Takehiro.java,v 1.26 2011/05/24 20:48:06 kenchis Exp $ */

package mp3;

import java.util.Arrays;


public class Takehiro {

	QuantizePVT qupvt;

	public final void setModules(QuantizePVT qupvt) {
		this.qupvt = qupvt;
	}

	static class Bits {
		public Bits(int b) {
			bits = b;
		}

		int bits;
	}

	private int subdv_table[][] = { { 0, 0 }, /* 0 bands */
	{ 0, 0 }, /* 1 bands */
	{ 0, 0 }, /* 2 bands */
	{ 0, 0 }, /* 3 bands */
	{ 0, 0 }, /* 4 bands */
	{ 0, 1 }, /* 5 bands */
	{ 1, 1 }, /* 6 bands */
	{ 1, 1 }, /* 7 bands */
	{ 1, 2 }, /* 8 bands */
	{ 2, 2 }, /* 9 bands */
	{ 2, 3 }, /* 10 bands */
	{ 2, 3 }, /* 11 bands */
	{ 3, 4 }, /* 12 bands */
	{ 3, 4 }, /* 13 bands */
	{ 3, 4 }, /* 14 bands */
	{ 4, 5 }, /* 15 bands */
	{ 4, 5 }, /* 16 bands */
	{ 4, 6 }, /* 17 bands */
	{ 5, 6 }, /* 18 bands */
	{ 5, 6 }, /* 19 bands */
	{ 5, 7 }, /* 20 bands */
	{ 6, 7 }, /* 21 bands */
	{ 6, 7 }, /* 22 bands */
	};

	/**
	 * nonlinear quantization of xr More accurate formula than the ISO formula.
	 * Takes into account the fact that we are quantizing xr . ix, but we want
	 * ix^4/3 to be as close as possible to x^4/3. (taking the nearest int would
	 * mean ix is as close as possible to xr, which is different.)
	 * 
	 * From Segher Boessenkool <segher@eastsite.nl> 11/1999
	 * 
	 * 09/2000: ASM code removed in favor of IEEE754 hack by Takehiro Tominaga.
	 * If you need the ASM code, check CVS circa Aug 2000.
	 * 
	 * 01/2004: Optimizations by Gabriel Bouvigne
	 */
	private void quantize_lines_xrpow_01(int l, float istep, final float[] xr,
			int xrPos, int[] ix, int ixPos) {
		final float compareval0 = (1.0f - 0.4054f) / istep;

		assert (l > 0);
		l = l >> 1;
		while ((l--) != 0) {
			ix[ixPos++] = (compareval0 > xr[xrPos++]) ? 0 : 1;
			ix[ixPos++] = (compareval0 > xr[xrPos++]) ? 0 : 1;
		}
	}

	/**
	 * XRPOW_FTOI is a macro to convert floats to ints.<BR>
	 * if XRPOW_FTOI(x) = nearest_int(x), then QUANTFAC(x)=adj43asm[x]<BR>
	 * ROUNDFAC= -0.0946<BR>
	 * 
	 * if XRPOW_FTOI(x) = floor(x), then QUANTFAC(x)=asj43[x]<BR>
	 * ROUNDFAC=0.4054<BR>
	 * 
	 * Note: using floor() or (int) is extremely slow. On machines where the
	 * TAKEHIRO_IEEE754_HACK code above does not work, it is worthwile to write
	 * some ASM for XRPOW_FTOI().
	 */
	private void quantize_lines_xrpow(int l, float istep, final float[] xr,
			int xrPos, int[] ix, int ixPos) {
		assert (l > 0);

		l = l >> 1;
		int remaining = l % 2;
		l = l >> 1;
		while (l-- != 0) {
			float x0, x1, x2, x3;
			int rx0, rx1, rx2, rx3;

			x0 = xr[xrPos++] * istep;
			x1 = xr[xrPos++] * istep;
			rx0 = (int) x0;
			x2 = xr[xrPos++] * istep;
			rx1 = (int) x1;
			x3 = xr[xrPos++] * istep;
			rx2 = (int) x2;
			x0 += qupvt.adj43[rx0];
			rx3 = (int) x3;
			x1 += qupvt.adj43[rx1];
			ix[ixPos++] = (int) x0;
			x2 += qupvt.adj43[rx2];
			ix[ixPos++] = (int) x1;
			x3 += qupvt.adj43[rx3];
			ix[ixPos++] = (int) x2;
			ix[ixPos++] = (int) x3;
		}
		if (remaining != 0) {
			float x0, x1;
			int rx0, rx1;

			x0 = xr[xrPos++] * istep;
			x1 = xr[xrPos++] * istep;
			rx0 = (int) x0;
			rx1 = (int) x1;
			x0 += qupvt.adj43[rx0];
			x1 += qupvt.adj43[rx1];
			ix[ixPos++] = (int) x0;
			ix[ixPos++] = (int) x1;
		}
	}

	/**
	 * Quantization function This function will select which lines to quantize
	 * and call the proper quantization function
	 */
	private void quantize_xrpow(final float[] xp, int[] pi, float istep,
			final GrInfo codInfo, final CalcNoiseData prevNoise) {
		/* quantize on xr^(3/4) instead of xr */
		int sfb;
		int sfbmax;
		int j = 0;
		boolean prev_data_use;
		int accumulate = 0;
		int accumulate01 = 0;

		int xpPos = 0;

		int[] iData = pi;
		int iDataPos = 0;
		int[] acc_iData = iData;
		int acc_iDataPos = 0;
		float[] acc_xp = xp;
		int acc_xpPos = 0;

		/*
		 * Reusing previously computed data does not seems to work if global
		 * gain is changed. Finding why it behaves this way would allow to use a
		 * cache of previously computed values (let's 10 cached values per sfb)
		 * that would probably provide a noticeable speedup
		 */
		prev_data_use = (prevNoise != null && (codInfo.global_gain == prevNoise.global_gain));

		if (codInfo.block_type == Encoder.SHORT_TYPE)
			sfbmax = 38;
		else
			sfbmax = 21;

		for (sfb = 0; sfb <= sfbmax; sfb++) {
			int step = -1;

			if (prev_data_use || codInfo.block_type == Encoder.NORM_TYPE) {
				step = codInfo.global_gain
						- ((codInfo.scalefac[sfb] + (codInfo.preflag != 0 ? qupvt.pretab[sfb]
								: 0)) << (codInfo.scalefac_scale + 1))
						- codInfo.subblock_gain[codInfo.window[sfb]] * 8;
			}
			assert (codInfo.width[sfb] >= 0);
			if (prev_data_use && (prevNoise.step[sfb] == step)) {
				/*
				 * do not recompute this part, but compute accumulated lines
				 */
				if (accumulate != 0) {
					quantize_lines_xrpow(accumulate, istep, acc_xp, acc_xpPos,
							acc_iData, acc_iDataPos);
					accumulate = 0;
				}
				if (accumulate01 != 0) {
					quantize_lines_xrpow_01(accumulate01, istep, acc_xp,
							acc_xpPos, acc_iData, acc_iDataPos);
					accumulate01 = 0;
				}
			} else { /* should compute this part */
				int l = codInfo.width[sfb];

				if ((j + codInfo.width[sfb]) > codInfo.max_nonzero_coeff) {
					/* do not compute upper zero part */
					int usefullsize;
					usefullsize = codInfo.max_nonzero_coeff - j + 1;
					Arrays.fill(pi, codInfo.max_nonzero_coeff, 576, 0);
					l = usefullsize;

					if (l < 0) {
						l = 0;
					}

					/* no need to compute higher sfb values */
					sfb = sfbmax + 1;
				}

				/* accumulate lines to quantize */
				if (0 == accumulate && 0 == accumulate01) {
					acc_iData = iData;
					acc_iDataPos = iDataPos;
					acc_xp = xp;
					acc_xpPos = xpPos;
				}
				if (prevNoise != null && prevNoise.sfb_count1 > 0
						&& sfb >= prevNoise.sfb_count1
						&& prevNoise.step[sfb] > 0
						&& step >= prevNoise.step[sfb]) {

					if (accumulate != 0) {
						quantize_lines_xrpow(accumulate, istep, acc_xp,
								acc_xpPos, acc_iData, acc_iDataPos);
						accumulate = 0;
						acc_iData = iData;
						acc_iDataPos = iDataPos;
						acc_xp = xp;
						acc_xpPos = xpPos;
					}
					accumulate01 += l;
				} else {
					if (accumulate01 != 0) {
						quantize_lines_xrpow_01(accumulate01, istep, acc_xp,
								acc_xpPos, acc_iData, acc_iDataPos);
						accumulate01 = 0;
						acc_iData = iData;
						acc_iDataPos = iDataPos;
						acc_xp = xp;
						acc_xpPos = xpPos;
					}
					accumulate += l;
				}

				if (l <= 0) {
					/*
					 * rh: 20040215 may happen due to "prev_data_use"
					 * optimization
					 */
					if (accumulate01 != 0) {
						quantize_lines_xrpow_01(accumulate01, istep, acc_xp,
								acc_xpPos, acc_iData, acc_iDataPos);
						accumulate01 = 0;
					}
					if (accumulate != 0) {
						quantize_lines_xrpow(accumulate, istep, acc_xp,
								acc_xpPos, acc_iData, acc_iDataPos);
						accumulate = 0;
					}

					break; /* ends for-loop */
				}
			}
			if (sfb <= sfbmax) {
				iDataPos += codInfo.width[sfb];
				xpPos += codInfo.width[sfb];
				j += codInfo.width[sfb];
			}
		}
		if (accumulate != 0) { /* last data part */
			quantize_lines_xrpow(accumulate, istep, acc_xp, acc_xpPos,
					acc_iData, acc_iDataPos);
			accumulate = 0;
		}
		if (accumulate01 != 0) { /* last data part */
			quantize_lines_xrpow_01(accumulate01, istep, acc_xp, acc_xpPos,
					acc_iData, acc_iDataPos);
			accumulate01 = 0;
		}

	}

	/**
	 * ix_max
	 */
	private int ix_max(final int[] ix, int ixPos, final int endPos) {
		int max1 = 0, max2 = 0;

		do {
			final int x1 = ix[ixPos++];
			final int x2 = ix[ixPos++];
			if (max1 < x1)
				max1 = x1;

			if (max2 < x2)
				max2 = x2;
		} while (ixPos < endPos);
		if (max1 < max2)
			max1 = max2;
		return max1;
	}

	private int count_bit_ESC(final int[] ix, int ixPos, final int end, int t1,
			final int t2, Bits s) {
		/* ESC-table is used */
		final int linbits = Tables.ht[t1].xlen * 65536 + Tables.ht[t2].xlen;
		int sum = 0, sum2;

		do {
			int x = ix[ixPos++];
			int y = ix[ixPos++];

			if (x != 0) {
				if (x > 14) {
					x = 15;
					sum += linbits;
				}
				x *= 16;
			}

			if (y != 0) {
				if (y > 14) {
					y = 15;
					sum += linbits;
				}
				x += y;
			}

			sum += Tables.largetbl[x];
		} while (ixPos < end);

		sum2 = sum & 0xffff;
		sum >>= 16;

		if (sum > sum2) {
			sum = sum2;
			t1 = t2;
		}

		s.bits += sum;
		return t1;
	}

	private int count_bit_noESC(final int[] ix, int ixPos, final int end, Bits s) {
		/* No ESC-words */
		int sum1 = 0;
		final int[] hlen1 = Tables.ht[1].hlen;

		do {
			final int x = ix[ixPos + 0] * 2 + ix[ixPos + 1];
			ixPos += 2;
			sum1 += hlen1[x];
		} while (ixPos < end);

		s.bits += sum1;
		return 1;
	}

	private int count_bit_noESC_from2(final int[] ix, int ixPos, final int end,
			int t1, Bits s) {
		/* No ESC-words */
		int sum = 0, sum2;
		final int xlen = Tables.ht[t1].xlen;
		final int[] hlen;
		if (t1 == 2)
			hlen = Tables.table23;
		else
			hlen = Tables.table56;

		do {
			final int x = ix[ixPos + 0] * xlen + ix[ixPos + 1];
			ixPos += 2;
			sum += hlen[x];
		} while (ixPos < end);

		sum2 = sum & 0xffff;
		sum >>= 16;

		if (sum > sum2) {
			sum = sum2;
			t1++;
		}

		s.bits += sum;
		return t1;
	}

	private int count_bit_noESC_from3(final int[] ix, int ixPos, final int end,
			int t1, Bits s) {
		/* No ESC-words */
		int sum1 = 0;
		int sum2 = 0;
		int sum3 = 0;
		final int xlen = Tables.ht[t1].xlen;
		final int[] hlen1 = Tables.ht[t1].hlen;
		final int[] hlen2 = Tables.ht[t1 + 1].hlen;
		final int[] hlen3 = Tables.ht[t1 + 2].hlen;

		do {
			final int x = ix[ixPos + 0] * xlen + ix[ixPos + 1];
			ixPos += 2;
			sum1 += hlen1[x];
			sum2 += hlen2[x];
			sum3 += hlen3[x];
		} while (ixPos < end);

		int t = t1;
		if (sum1 > sum2) {
			sum1 = sum2;
			t++;
		}
		if (sum1 > sum3) {
			sum1 = sum3;
			t = t1 + 2;
		}
		s.bits += sum1;

		return t;
	}

	/*************************************************************************/
	/* choose table */
	/*************************************************************************/

	private final static int huf_tbl_noESC[] = { 1, 2, 5, 7, 7, 10, 10, 13, 13,
			13, 13, 13, 13, 13, 13 };

	/**
	 * Choose the Huffman table that will encode ix[begin..end] with the fewest
	 * bits.
	 * 
	 * Note: This code contains knowledge about the sizes and characteristics of
	 * the Huffman tables as defined in the IS (Table B.7), and will not work
	 * with any arbitrary tables.
	 */
	private int choose_table(final int[] ix, final int ixPos, final int endPos,
			final Bits s) {
		int max = ix_max(ix, ixPos, endPos);

		switch (max) {
		case 0:
			return max;

		case 1:
			return count_bit_noESC(ix, ixPos, endPos, s);

		case 2:
		case 3:
			return count_bit_noESC_from2(ix, ixPos, endPos,
					huf_tbl_noESC[max - 1], s);

		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
		case 10:
		case 11:
		case 12:
		case 13:
		case 14:
		case 15:
			return count_bit_noESC_from3(ix, ixPos, endPos,
					huf_tbl_noESC[max - 1], s);

		default:
			/* try tables with linbits */
			if (max > QuantizePVT.IXMAX_VAL) {
				s.bits = QuantizePVT.LARGE_BITS;
				return -1;
			}
			max -= 15;
			int choice2;
			for (choice2 = 24; choice2 < 32; choice2++) {
				if (Tables.ht[choice2].linmax >= max) {
					break;
				}
			}
			int choice;
			for (choice = choice2 - 8; choice < 24; choice++) {
				if (Tables.ht[choice].linmax >= max) {
					break;
				}
			}
			return count_bit_ESC(ix, ixPos, endPos, choice, choice2, s);
		}
	}

	/**
	 * count_bit
	 */
	public int noquant_count_bits(final LameInternalFlags gfc,
			final GrInfo gi, CalcNoiseData prev_noise) {
		final int[] ix = gi.l3_enc;

		int i = Math.min(576, ((gi.max_nonzero_coeff + 2) >> 1) << 1);

		if (prev_noise != null)
			prev_noise.sfb_count1 = 0;

		/* Determine count1 region */
		for (; i > 1; i -= 2)
			if ((ix[i - 1] | ix[i - 2]) != 0)
				break;
		gi.count1 = i;

		/* Determines the number of bits to encode the quadruples. */
		int a1 = 0;
		int a2 = 0;
		for (; i > 3; i -= 4) {
			int p;
			/* hack to check if all values <= 1 */
			if ((((long) ix[i - 1] | (long) ix[i - 2] | (long) ix[i - 3] | (long) ix[i - 4]) & 0xffffffffL) > 1L)
				break;

			p = ((ix[i - 4] * 2 + ix[i - 3]) * 2 + ix[i - 2]) * 2 + ix[i - 1];
			a1 += Tables.t32l[p];
			a2 += Tables.t33l[p];
		}

		int bits = a1;
		gi.count1table_select = 0;
		if (a1 > a2) {
			bits = a2;
			gi.count1table_select = 1;
		}

		gi.count1bits = bits;
		gi.big_values = i;
		if (i == 0)
			return bits;

		if (gi.block_type == Encoder.SHORT_TYPE) {
			a1 = 3 * gfc.scalefac_band.s[3];
			if (a1 > gi.big_values)
				a1 = gi.big_values;
			a2 = gi.big_values;

		} else if (gi.block_type == Encoder.NORM_TYPE) {
			assert (i <= 576); /* bv_scf has 576 entries (0..575) */
			a1 = gi.region0_count = gfc.bv_scf[i - 2];
			a2 = gi.region1_count = gfc.bv_scf[i - 1];

			assert (a1 + a2 + 2 < Encoder.SBPSY_l);
			a2 = gfc.scalefac_band.l[a1 + a2 + 2];
			a1 = gfc.scalefac_band.l[a1 + 1];
			if (a2 < i) {
				Bits bi = new Bits(bits);
				gi.table_select[2] = choose_table(ix, a2, i, bi);
				bits = bi.bits;
			}
		} else {
			gi.region0_count = 7;
			/* gi.region1_count = SBPSY_l - 7 - 1; */
			gi.region1_count = Encoder.SBMAX_l - 1 - 7 - 1;
			a1 = gfc.scalefac_band.l[7 + 1];
			a2 = i;
			if (a1 > a2) {
				a1 = a2;
			}
		}

		/* have to allow for the case when bigvalues < region0 < region1 */
		/* (and region0, region1 are ignored) */
		a1 = Math.min(a1, i);
		a2 = Math.min(a2, i);

		assert (a1 >= 0);
		assert (a2 >= 0);

		/* Count the number of bits necessary to code the bigvalues region. */
		if (0 < a1) {
			Bits bi = new Bits(bits);
			gi.table_select[0] = choose_table(ix, 0, a1, bi);
			bits = bi.bits;
		}
		if (a1 < a2) {
			Bits bi = new Bits(bits);
			gi.table_select[1] = choose_table(ix, a1, a2, bi);
			bits = bi.bits;
		}
		if (gfc.use_best_huffman == 2) {
			gi.part2_3_length = bits;
			best_huffman_divide(gfc, gi);
			bits = gi.part2_3_length;
		}

		if (prev_noise != null) {
			if (gi.block_type == Encoder.NORM_TYPE) {
				int sfb = 0;
				while (gfc.scalefac_band.l[sfb] < gi.big_values) {
					sfb++;
				}
				prev_noise.sfb_count1 = sfb;
			}
		}

		return bits;
	}

	public int count_bits(final LameInternalFlags gfc, final float[] xr,
			final GrInfo gi, CalcNoiseData prev_noise) {
		final int[] ix = gi.l3_enc;

		/* since quantize_xrpow uses table lookup, we need to check this first: */
		final float w = (QuantizePVT.IXMAX_VAL) / qupvt.IPOW20(gi.global_gain);

		if (gi.xrpow_max > w)
			return QuantizePVT.LARGE_BITS;

		quantize_xrpow(xr, ix, qupvt.IPOW20(gi.global_gain), gi, prev_noise);

		if ((gfc.substep_shaping & 2) != 0) {
			int j = 0;
			/* 0.634521682242439 = 0.5946*2**(.5*0.1875) */
			final int gain = gi.global_gain + gi.scalefac_scale;
			final float roundfac = 0.634521682242439f / qupvt.IPOW20(gain);
			for (int sfb = 0; sfb < gi.sfbmax; sfb++) {
				final int width = gi.width[sfb];
				assert (width >= 0);
				if (0 == gfc.pseudohalf[sfb]) {
					j += width;
				} else {
					int k;
					for (k = j, j += width; k < j; ++k) {
						ix[k] = (xr[k] >= roundfac) ? ix[k] : 0;
					}
				}
			}
		}
		return noquant_count_bits(gfc, gi, prev_noise);
	}

	/**
	 * re-calculate the best scalefac_compress using scfsi the saved bits are
	 * kept in the bit reservoir.
	 */
	private void recalc_divide_init(final LameInternalFlags gfc,
			final GrInfo cod_info, final int[] ix, int r01_bits[],
			int r01_div[], int r0_tbl[], int r1_tbl[]) {
		int bigv = cod_info.big_values;

		for (int r0 = 0; r0 <= 7 + 15; r0++) {
			r01_bits[r0] = QuantizePVT.LARGE_BITS;
		}

		for (int r0 = 0; r0 < 16; r0++) {
			final int a1 = gfc.scalefac_band.l[r0 + 1];
			if (a1 >= bigv)
				break;
			int r0bits = 0;
			Bits bi = new Bits(r0bits);
			int r0t = choose_table(ix, 0, a1, bi);
			r0bits = bi.bits;

			for (int r1 = 0; r1 < 8; r1++) {
				final int a2 = gfc.scalefac_band.l[r0 + r1 + 2];
				if (a2 >= bigv)
					break;

				int bits = r0bits;
				bi = new Bits(bits);
				int r1t = choose_table(ix, a1, a2, bi);
				bits = bi.bits;
				if (r01_bits[r0 + r1] > bits) {
					r01_bits[r0 + r1] = bits;
					r01_div[r0 + r1] = r0;
					r0_tbl[r0 + r1] = r0t;
					r1_tbl[r0 + r1] = r1t;
				}
			}
		}
	}

	private void recalc_divide_sub(final LameInternalFlags gfc,
			final GrInfo cod_info2, GrInfo gi, final int[] ix,
			final int r01_bits[], final int r01_div[], final int r0_tbl[],
			final int r1_tbl[]) {
		int bigv = cod_info2.big_values;

		for (int r2 = 2; r2 < Encoder.SBMAX_l + 1; r2++) {
			int a2 = gfc.scalefac_band.l[r2];
			if (a2 >= bigv)
				break;

			int bits = r01_bits[r2 - 2] + cod_info2.count1bits;
			if (gi.part2_3_length <= bits)
				break;

			Bits bi = new Bits(bits);
			int r2t = choose_table(ix, a2, bigv, bi);
			bits = bi.bits;
			if (gi.part2_3_length <= bits)
				continue;

			gi.assign(cod_info2);
			gi.part2_3_length = bits;
			gi.region0_count = r01_div[r2 - 2];
			gi.region1_count = r2 - 2 - r01_div[r2 - 2];
			gi.table_select[0] = r0_tbl[r2 - 2];
			gi.table_select[1] = r1_tbl[r2 - 2];
			gi.table_select[2] = r2t;
		}
	}

	public void best_huffman_divide(final LameInternalFlags gfc,
			GrInfo gi) {
		GrInfo cod_info2 = new GrInfo();
		final int[] ix = gi.l3_enc;

		int r01_bits[] = new int[7 + 15 + 1];
		int r01_div[] = new int[7 + 15 + 1];
		int r0_tbl[] = new int[7 + 15 + 1];
		int r1_tbl[] = new int[7 + 15 + 1];

		/* SHORT BLOCK stuff fails for MPEG2 */
		if (gi.block_type == Encoder.SHORT_TYPE && gfc.mode_gr == 1)
			return;

		cod_info2.assign(gi);
		if (gi.block_type == Encoder.NORM_TYPE) {
			recalc_divide_init(gfc, gi, ix, r01_bits, r01_div, r0_tbl, r1_tbl);
			recalc_divide_sub(gfc, cod_info2, gi, ix, r01_bits, r01_div,
					r0_tbl, r1_tbl);
		}

		int i = cod_info2.big_values;
		if (i == 0 || (ix[i - 2] | ix[i - 1]) > 1)
			return;

		i = gi.count1 + 2;
		if (i > 576)
			return;

		/* Determines the number of bits to encode the quadruples. */
		cod_info2.assign(gi);
		cod_info2.count1 = i;
		int a1 = 0;
		int a2 = 0;

		assert (i <= 576);

		for (; i > cod_info2.big_values; i -= 4) {
			final int p = ((ix[i - 4] * 2 + ix[i - 3]) * 2 + ix[i - 2]) * 2
					+ ix[i - 1];
			a1 += Tables.t32l[p];
			a2 += Tables.t33l[p];
		}
		cod_info2.big_values = i;

		cod_info2.count1table_select = 0;
		if (a1 > a2) {
			a1 = a2;
			cod_info2.count1table_select = 1;
		}

		cod_info2.count1bits = a1;

		if (cod_info2.block_type == Encoder.NORM_TYPE)
			recalc_divide_sub(gfc, cod_info2, gi, ix, r01_bits, r01_div,
					r0_tbl, r1_tbl);
		else {
			/* Count the number of bits necessary to code the bigvalues region. */
			cod_info2.part2_3_length = a1;
			a1 = gfc.scalefac_band.l[7 + 1];
			if (a1 > i) {
				a1 = i;
			}
			if (a1 > 0) {
				Bits bi = new Bits(cod_info2.part2_3_length);
				cod_info2.table_select[0] = choose_table(ix, 0, a1, bi);
				cod_info2.part2_3_length = bi.bits;
			}
			if (i > a1) {
				Bits bi = new Bits(cod_info2.part2_3_length);
				cod_info2.table_select[1] = choose_table(ix, a1, i, bi);
				cod_info2.part2_3_length = bi.bits;
			}
			if (gi.part2_3_length > cod_info2.part2_3_length)
				gi.assign(cod_info2);
		}
	}

	private static final int slen1_n[] = { 1, 1, 1, 1, 8, 2, 2, 2, 4, 4, 4, 8,
			8, 8, 16, 16 };
	private static final int slen2_n[] = { 1, 2, 4, 8, 1, 2, 4, 8, 2, 4, 8, 2,
			4, 8, 4, 8 };
	public static final int slen1_tab[] = { 0, 0, 0, 0, 3, 1, 1, 1, 2, 2, 2, 3,
			3, 3, 4, 4 };
	public static final int slen2_tab[] = { 0, 1, 2, 3, 0, 1, 2, 3, 1, 2, 3, 1,
			2, 3, 2, 3 };

	private void scfsi_calc(int ch, final IIISideInfo l3_side) {
		int sfb;
		final GrInfo gi = l3_side.tt[1][ch];
		final GrInfo g0 = l3_side.tt[0][ch];

		for (int i = 0; i < Tables.scfsi_band.length - 1; i++) {
			for (sfb = Tables.scfsi_band[i]; sfb < Tables.scfsi_band[i + 1]; sfb++) {
				if (g0.scalefac[sfb] != gi.scalefac[sfb]
						&& gi.scalefac[sfb] >= 0)
					break;
			}
			if (sfb == Tables.scfsi_band[i + 1]) {
				for (sfb = Tables.scfsi_band[i]; sfb < Tables.scfsi_band[i + 1]; sfb++) {
					gi.scalefac[sfb] = -1;
				}
				l3_side.scfsi[ch][i] = 1;
			}
		}

		int s1 = 0;
		int c1 = 0;
		for (sfb = 0; sfb < 11; sfb++) {
			if (gi.scalefac[sfb] == -1)
				continue;
			c1++;
			if (s1 < gi.scalefac[sfb])
				s1 = gi.scalefac[sfb];
		}

		int s2 = 0;
		int c2 = 0;
		for (; sfb < Encoder.SBPSY_l; sfb++) {
			if (gi.scalefac[sfb] == -1)
				continue;
			c2++;
			if (s2 < gi.scalefac[sfb])
				s2 = gi.scalefac[sfb];
		}

		for (int i = 0; i < 16; i++) {
			if (s1 < slen1_n[i] && s2 < slen2_n[i]) {
				final int c = slen1_tab[i] * c1 + slen2_tab[i] * c2;
				if (gi.part2_length > c) {
					gi.part2_length = c;
					gi.scalefac_compress = i;
				}
			}
		}
	}

	/**
	 * Find the optimal way to store the scalefactors. Only call this routine
	 * after final scalefactors have been chosen and the channel/granule will
	 * not be re-encoded.
	 */
	public void best_scalefac_store(final LameInternalFlags gfc, final int gr,
			final int ch, final IIISideInfo l3_side) {
		/* use scalefac_scale if we can */
		final GrInfo gi = l3_side.tt[gr][ch];
		int sfb, i, j, l;
		int recalc = 0;

		/*
		 * remove scalefacs from bands with ix=0. This idea comes from the AAC
		 * ISO docs. added mt 3/00
		 */
		/* check if l3_enc=0 */
		j = 0;
		for (sfb = 0; sfb < gi.sfbmax; sfb++) {
			final int width = gi.width[sfb];
			assert (width >= 0);
			j += width;
			for (l = -width; l < 0; l++) {
				if (gi.l3_enc[l + j] != 0)
					break;
			}
			if (l == 0)
				gi.scalefac[sfb] = recalc = -2; /* anything goes. */
			/*
			 * only best_scalefac_store and calc_scfsi know--and only they
			 * should know--about the magic number -2.
			 */
		}

		if (0 == gi.scalefac_scale && 0 == gi.preflag) {
			int s = 0;
			for (sfb = 0; sfb < gi.sfbmax; sfb++)
				if (gi.scalefac[sfb] > 0)
					s |= gi.scalefac[sfb];

			if (0 == (s & 1) && s != 0) {
				for (sfb = 0; sfb < gi.sfbmax; sfb++)
					if (gi.scalefac[sfb] > 0)
						gi.scalefac[sfb] >>= 1;

				gi.scalefac_scale = recalc = 1;
			}
		}

		if (0 == gi.preflag && gi.block_type != Encoder.SHORT_TYPE
				&& gfc.mode_gr == 2) {
			for (sfb = 11; sfb < Encoder.SBPSY_l; sfb++)
				if (gi.scalefac[sfb] < qupvt.pretab[sfb]
						&& gi.scalefac[sfb] != -2)
					break;
			if (sfb == Encoder.SBPSY_l) {
				for (sfb = 11; sfb < Encoder.SBPSY_l; sfb++)
					if (gi.scalefac[sfb] > 0)
						gi.scalefac[sfb] -= qupvt.pretab[sfb];

				gi.preflag = recalc = 1;
			}
		}

		for (i = 0; i < 4; i++)
			l3_side.scfsi[ch][i] = 0;

		if (gfc.mode_gr == 2 && gr == 1
				&& l3_side.tt[0][ch].block_type != Encoder.SHORT_TYPE
				&& l3_side.tt[1][ch].block_type != Encoder.SHORT_TYPE) {
			scfsi_calc(ch, l3_side);
			recalc = 0;
		}
		for (sfb = 0; sfb < gi.sfbmax; sfb++) {
			if (gi.scalefac[sfb] == -2) {
				gi.scalefac[sfb] = 0; /* if anything goes, then 0 is a good choice */
			}
		}
		if (recalc != 0) {
			if (gfc.mode_gr == 2) {
				scale_bitcount(gi);
			} else {
				scale_bitcount_lsf(gfc, gi);
			}
		}
	}

	private boolean all_scalefactors_not_negative(final int[] scalefac, int n) {
		for (int i = 0; i < n; ++i) {
			if (scalefac[i] < 0)
				return false;
		}
		return true;
	}

	/**
	 * number of bits used to encode scalefacs.
	 * 
	 * 18*slen1_tab[i] + 18*slen2_tab[i]
	 */
	private static final int scale_short[] = { 0, 18, 36, 54, 54, 36, 54, 72,
			54, 72, 90, 72, 90, 108, 108, 126 };

	/**
	 * number of bits used to encode scalefacs.
	 * 
	 * 17*slen1_tab[i] + 18*slen2_tab[i]
	 */
	private static final int scale_mixed[] = { 0, 18, 36, 54, 51, 35, 53, 71,
			52, 70, 88, 69, 87, 105, 104, 122 };

	/**
	 * number of bits used to encode scalefacs.
	 * 
	 * 11*slen1_tab[i] + 10*slen2_tab[i]
	 */
	private static final int scale_long[] = { 0, 10, 20, 30, 33, 21, 31, 41, 32, 42,
			52, 43, 53, 63, 64, 74 };

	/**
	 * Also calculates the number of bits necessary to code the scalefactors.
	 */
	public boolean scale_bitcount(final GrInfo cod_info) {
		int k, sfb, max_slen1 = 0, max_slen2 = 0;

		/* maximum values */
		int[] tab;
		final int[] scalefac = cod_info.scalefac;

		assert (all_scalefactors_not_negative(scalefac, cod_info.sfbmax));

		if (cod_info.block_type == Encoder.SHORT_TYPE) {
			tab = scale_short;
			if (cod_info.mixed_block_flag != 0)
				tab = scale_mixed;
		} else { /* block_type == 1,2,or 3 */
			tab = scale_long;
			if (0 == cod_info.preflag) {
				for (sfb = 11; sfb < Encoder.SBPSY_l; sfb++)
					if (scalefac[sfb] < qupvt.pretab[sfb])
						break;

				if (sfb == Encoder.SBPSY_l) {
					cod_info.preflag = 1;
					for (sfb = 11; sfb < Encoder.SBPSY_l; sfb++)
						scalefac[sfb] -= qupvt.pretab[sfb];
				}
			}
		}

		for (sfb = 0; sfb < cod_info.sfbdivide; sfb++)
			if (max_slen1 < scalefac[sfb])
				max_slen1 = scalefac[sfb];

		for (; sfb < cod_info.sfbmax; sfb++)
			if (max_slen2 < scalefac[sfb])
				max_slen2 = scalefac[sfb];

		/*
		 * from Takehiro TOMINAGA <tominaga@isoternet.org> 10/99 loop over *all*
		 * posible values of scalefac_compress to find the one which uses the
		 * smallest number of bits. ISO would stop at first valid index
		 */
		cod_info.part2_length = QuantizePVT.LARGE_BITS;
		for (k = 0; k < 16; k++) {
			if (max_slen1 < slen1_n[k] && max_slen2 < slen2_n[k]
					&& cod_info.part2_length > tab[k]) {
				cod_info.part2_length = tab[k];
				cod_info.scalefac_compress = k;
			}
		}
		return cod_info.part2_length == QuantizePVT.LARGE_BITS;
	}

	/**
	 * table of largest scalefactor values for MPEG2
	 */
	private static final int max_range_sfac_tab[][] = { { 15, 15, 7, 7 },
			{ 15, 15, 7, 0 }, { 7, 3, 0, 0 }, { 15, 31, 31, 0 },
			{ 7, 7, 7, 0 }, { 3, 3, 0, 0 } };

	/**
	 * Also counts the number of bits to encode the scalefacs but for MPEG 2
	 * Lower sampling frequencies (24, 22.05 and 16 kHz.)
	 * 
	 * This is reverse-engineered from section 2.4.3.2 of the MPEG2 IS,
	 * "Audio Decoding Layer III"
	 */
	public boolean scale_bitcount_lsf(final LameInternalFlags gfc,
			final GrInfo cod_info) {
		int table_number, row_in_table, partition, nr_sfb, window;
		boolean over;
		int i, sfb, max_sfac[] = new int[4];
		final int[] partition_table;
		final int[] scalefac = cod_info.scalefac;

		/*
		 * Set partition table. Note that should try to use table one, but do
		 * not yet...
		 */
		if (cod_info.preflag != 0)
			table_number = 2;
		else
			table_number = 0;

		for (i = 0; i < 4; i++)
			max_sfac[i] = 0;

		if (cod_info.block_type == Encoder.SHORT_TYPE) {
			row_in_table = 1;
			partition_table = qupvt.nr_of_sfb_block[table_number][row_in_table];
			for (sfb = 0, partition = 0; partition < 4; partition++) {
				nr_sfb = partition_table[partition] / 3;
				for (i = 0; i < nr_sfb; i++, sfb++)
					for (window = 0; window < 3; window++)
						if (scalefac[sfb * 3 + window] > max_sfac[partition])
							max_sfac[partition] = scalefac[sfb * 3 + window];
			}
		} else {
			row_in_table = 0;
			partition_table = qupvt.nr_of_sfb_block[table_number][row_in_table];
			for (sfb = 0, partition = 0; partition < 4; partition++) {
				nr_sfb = partition_table[partition];
				for (i = 0; i < nr_sfb; i++, sfb++)
					if (scalefac[sfb] > max_sfac[partition])
						max_sfac[partition] = scalefac[sfb];
			}
		}

		for (over = false, partition = 0; partition < 4; partition++) {
			if (max_sfac[partition] > max_range_sfac_tab[table_number][partition])
				over = true;
		}
		if (!over) {

			int slen1, slen2, slen3, slen4;

			cod_info.sfb_partition_table = qupvt.nr_of_sfb_block[table_number][row_in_table];
			for (partition = 0; partition < 4; partition++)
				cod_info.slen[partition] = log2tab[max_sfac[partition]];

			/* set scalefac_compress */
			slen1 = cod_info.slen[0];
			slen2 = cod_info.slen[1];
			slen3 = cod_info.slen[2];
			slen4 = cod_info.slen[3];

			switch (table_number) {
			case 0:
				cod_info.scalefac_compress = (((slen1 * 5) + slen2) << 4)
						+ (slen3 << 2) + slen4;
				break;

			case 1:
				cod_info.scalefac_compress = 400 + (((slen1 * 5) + slen2) << 2)
						+ slen3;
				break;

			case 2:
				cod_info.scalefac_compress = 500 + (slen1 * 3) + slen2;
				break;

			default:
				System.err.printf("intensity stereo not implemented yet\n");
				break;
			}
		}
		if (!over) {
			assert (cod_info.sfb_partition_table != null);
			cod_info.part2_length = 0;
			for (partition = 0; partition < 4; partition++)
				cod_info.part2_length += cod_info.slen[partition]
						* cod_info.sfb_partition_table[partition];
		}
		return over;
	}

	/*
	 * Since no bands have been over-amplified, we can set scalefac_compress and
	 * slen[] for the formatter
	 */
	private static final int log2tab[] = { 0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
			4, 4, 4,			4 };

	public void huffman_init(final LameInternalFlags gfc) {
		for (int i = 2; i <= 576; i += 2) {
			int scfb_anz = 0, bv_index;
			while (gfc.scalefac_band.l[++scfb_anz] < i)
				;

			bv_index = subdv_table[scfb_anz][0]; // .region0_count
			while (gfc.scalefac_band.l[bv_index + 1] > i)
				bv_index--;

			if (bv_index < 0) {
				/*
				 * this is an indication that everything is going to be encoded
				 * as region0: bigvalues < region0 < region1 so lets set
				 * region0, region1 to some value larger than bigvalues
				 */
				bv_index = subdv_table[scfb_anz][0]; // .region0_count
			}

			gfc.bv_scf[i - 2] = bv_index;

			bv_index = subdv_table[scfb_anz][1]; // .region1_count
			while (gfc.scalefac_band.l[bv_index + gfc.bv_scf[i - 2] + 2] > i)
				bv_index--;

			if (bv_index < 0) {
				bv_index = subdv_table[scfb_anz][1]; // .region1_count
			}

			gfc.bv_scf[i - 1] = bv_index;
		}
	}
}
