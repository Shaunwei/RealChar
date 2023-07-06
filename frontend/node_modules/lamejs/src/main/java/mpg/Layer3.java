/* 
 * layer3.c: Mpeg Layer-3 audio decoder 
 *
 * Copyright (C) 1999-2010 The L.A.M.E. project
 *
 * Initially written by Michael Hipp, see also AUTHORS and README.
 *  
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */
/* $Id: Layer3.java,v 1.19 2011/06/17 05:26:42 kenchis Exp $ */
package mpg;

import mpg.Decode.Factory;
import mpg.Huffman.newhuff;
import mpg.Interface.ISynth;
import mpg.MPG123.III_sideinfo;
import mpg.MPG123.gr_info_s;
import mpg.MPGLib.ProcessedBytes;
import mpg.MPGLib.mpstr_tag;

public class Layer3 {
	private Common common;

	public void setModules(final Common c) {
		common = c;
	}
	
	private float ispow[] = new float[8207];
	private float aa_ca[] = new float[8], aa_cs[] = new float[8];
	private float COS1[][] = new float[12][6];
	private float win[][] = new float[4][36];
	private float win1[][] = new float[4][36];
	private float gainpow2[] = new float[256 + 118 + 4];
	private float COS9[] = new float[9];
	private float COS6_1, COS6_2;
	private float tfcos36[] = new float[9];
	private float tfcos12[] = new float[3];

	private static class bandInfoStruct {
		public bandInfoStruct(final short[] lIdx, final short[] lDiff,
				final short[] sIdx, final short[] sDiff) {
			longIdx = lIdx;
			longDiff = lDiff;
			shortIdx = sIdx;
			shortDiff = sDiff;
		}

		short longIdx[] = new short[23];
		short longDiff[] = new short[22];
		short shortIdx[] = new short[14];
		short shortDiff[] = new short[13];
	};

	private int longLimit[][] = new int[9][23];
	private int shortLimit[][] = new int[9][14];

	private static bandInfoStruct bandInfo[] = { 

			/* MPEG 1.0 */
	new bandInfoStruct(
	new short[]{0,4,8,12,16,20,24,30,36,44,52,62,74, 90,110,134,162,196,238,288,342,418,576},
	new short[]{4,4,4,4,4,4,6,6,8, 8,10,12,16,20,24,28,34,42,50,54, 76,158},
	new short[]{0,4*3,8*3,12*3,16*3,22*3,30*3,40*3,52*3,66*3, 84*3,106*3,136*3,192*3},
	new short[]{4,4,4,4,6,8,10,12,14,18,22,30,56}) ,

	new bandInfoStruct(
	new short[]{0,4,8,12,16,20,24,30,36,42,50,60,72, 88,106,128,156,190,230,276,330,384,576},
	new short[]{4,4,4,4,4,4,6,6,6, 8,10,12,16,18,22,28,34,40,46,54, 54,192},
	new short[]{0,4*3,8*3,12*3,16*3,22*3,28*3,38*3,50*3,64*3, 80*3,100*3,126*3,192*3},
	new short[]{4,4,4,4,6,6,10,12,14,16,20,26,66}) ,

	new bandInfoStruct(
	new short[]{0,4,8,12,16,20,24,30,36,44,54,66,82,102,126,156,194,240,296,364,448,550,576} ,
	new short[]{4,4,4,4,4,4,6,6,8,10,12,16,20,24,30,38,46,56,68,84,102, 26} ,
	new short[]{0,4*3,8*3,12*3,16*3,22*3,30*3,42*3,58*3,78*3,104*3,138*3,180*3,192*3} ,
	new short[]{4,4,4,4,6,8,12,16,20,26,34,42,12}) ,

			/* MPEG 2.0 */
	new bandInfoStruct(
	new short[]{0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576},
	new short[]{6,6,6,6,6,6,8,10,12,14,16,20,24,28,32,38,46,52,60,68,58,54 } ,
	new short[]{0,4*3,8*3,12*3,18*3,24*3,32*3,42*3,56*3,74*3,100*3,132*3,174*3,192*3} ,
	new short[]{4,4,4,6,6,8,10,14,18,26,32,42,18 }) ,
			                                             /* docs: 332. mpg123: 330 */
	new bandInfoStruct(
	new short[]{0,6,12,18,24,30,36,44,54,66,80,96,114,136,162,194,232,278,332,394,464,540,576},
	new short[]{6,6,6,6,6,6,8,10,12,14,16,18,22,26,32,38,46,54,62,70,76,36 } ,
	new short[]{0,4*3,8*3,12*3,18*3,26*3,36*3,48*3,62*3,80*3,104*3,136*3,180*3,192*3} ,
	new short[]{4,4,4,6,8,10,12,14,18,24,32,44,12 } ) ,

	new bandInfoStruct(
	new short[]{0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576},
	new short[]{6,6,6,6,6,6,8,10,12,14,16,20,24,28,32,38,46,52,60,68,58,54 },
	new short[]{0,4*3,8*3,12*3,18*3,26*3,36*3,48*3,62*3,80*3,104*3,134*3,174*3,192*3},
	new short[]{4,4,4,6,8,10,12,14,18,24,30,40,18 } ) ,
			/* MPEG 2.5 */
	new bandInfoStruct(
	new short[]{0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576} ,
	new short[]{6,6,6,6,6,6,8,10,12,14,16,20,24,28,32,38,46,52,60,68,58,54},
	new short[]{0,12,24,36,54,78,108,144,186,240,312,402,522,576},
	new short[]{4,4,4,6,8,10,12,14,18,24,30,40,18} ),
	new bandInfoStruct(
	new short[]{0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576} ,
	new short[]{6,6,6,6,6,6,8,10,12,14,16,20,24,28,32,38,46,52,60,68,58,54},
	new short[]{0,12,24,36,54,78,108,144,186,240,312,402,522,576},
	new short[]{4,4,4,6,8,10,12,14,18,24,30,40,18} ),
	new bandInfoStruct(
	new short[]{0,12,24,36,48,60,72,88,108,132,160,192,232,280,336,400,476,566,568,570,572,574,576},
	new short[]{12,12,12,12,12,12,16,20,24,28,32,40,48,56,64,76,90,2,2,2,2,2},
	new short[]{0, 24, 48, 72,108,156,216,288,372,480,486,492,498,576},
	new short[]{8,8,8,12,16,20,24,28,36,2,2,2,26} ) ,
	};

	private int mapbuf0[][] = new int[9][152];
	private int mapbuf1[][] = new int[9][156];
	private int mapbuf2[][] = new int[9][44];
	private int map[][][] = new int[9][3][];
	private int mapend[][] = new int[9][3];

	/**
	 * MPEG 2.0 slen for 'normal' mode.
	 */
	private int n_slen2[] = new int[512];
	/**
	 * MPEG 2.0 slen for intensity stereo.
	 */
	private int i_slen2[] = new int[256];

	private float tan1_1[] = new float[16], tan2_1[] = new float[16],
			tan1_2[] = new float[16], tan2_2[] = new float[16];
	private float pow1_1[][] = new float[2][16], pow2_1[][] = new float[2][16],
			pow1_2[][] = new float[2][16], pow2_2[][] = new float[2][16];

	private int get1bit(final mpstr_tag mp) {
		int rval = (mp.wordpointer[mp.wordpointerPos] & 0xff) << mp.bitindex;
		rval &= 0xff;
		mp.bitindex++;
		mp.wordpointerPos += (mp.bitindex >> 3);
		mp.bitindex &= 7;

		return rval >> 7;
	}

	private static double Ci[] = { -0.6, -0.535, -0.33, -0.185, -0.095, -0.041,
			-0.0142, -0.0037 };
	private static int len[] = { 36, 36, 12, 36 };

	/* 
	 * init tables for layer-3 
	 */
	public void init_layer3(final int down_sample_sblimit) {
		for (int i = -256; i < 118 + 4; i++)
			gainpow2[i + 256] = (float) Math.pow((double) 2.0, -0.25
					* (double) (i + 210));

		for (int i = 0; i < 8207; i++)
			ispow[i] = (float) Math.pow((double) i, (double) 4.0 / 3.0);

		for (int i = 0; i < 8; i++) {
			double sq = Math.sqrt(1.0 + Ci[i] * Ci[i]);
			aa_cs[i] = (float) (1.0 / sq);
			aa_ca[i] = (float) (Ci[i] / sq);
		}

		for (int i = 0; i < 18; i++) {
			win[0][i] = win[1][i] = (float) (0.5 * Math.sin(MPG123.M_PI / 72.0
					* (double) (2 * (i + 0) + 1)) / Math.cos(MPG123.M_PI
					* (double) (2 * (i + 0) + 19) / 72.0));
			win[0][i + 18] = win[3][i + 18] = (float) (0.5 * Math
					.sin(MPG123.M_PI / 72.0 * (double) (2 * (i + 18) + 1)) / Math
					.cos(MPG123.M_PI * (double) (2 * (i + 18) + 19) / 72.0));
		}
		for (int i = 0; i < 6; i++) {
			win[1][i + 18] = (float) (0.5 / Math.cos(MPG123.M_PI
					* (double) (2 * (i + 18) + 19) / 72.0));
			win[3][i + 12] = (float) (0.5 / Math.cos(MPG123.M_PI
					* (double) (2 * (i + 12) + 19) / 72.0));
			win[1][i + 24] = (float) (0.5 * Math.sin(MPG123.M_PI / 24.0
					* (double) (2 * i + 13)) / Math.cos(MPG123.M_PI
					* (double) (2 * (i + 24) + 19) / 72.0));
			win[1][i + 30] = win[3][i] = 0.0f;
			win[3][i + 6] = (float) (0.5 * Math.sin(MPG123.M_PI / 24.0
					* (double) (2 * i + 1)) / Math.cos(MPG123.M_PI
					* (double) (2 * (i + 6) + 19) / 72.0));
		}

		for (int i = 0; i < 9; i++)
			COS9[i] = (float) Math.cos(MPG123.M_PI / 18.0 * (double) i);

		for (int i = 0; i < 9; i++)
			tfcos36[i] = (float) (0.5 / Math.cos(MPG123.M_PI
					* (double) (i * 2 + 1) / 36.0));
		for (int i = 0; i < 3; i++)
			tfcos12[i] = (float) (0.5 / Math.cos(MPG123.M_PI
					* (double) (i * 2 + 1) / 12.0));

		COS6_1 = (float) Math.cos(MPG123.M_PI / 6.0 * (double) 1);
		COS6_2 = (float) Math.cos(MPG123.M_PI / 6.0 * (double) 2);

		for (int i = 0; i < 12; i++) {
			win[2][i] = (float) (0.5 * Math.sin(MPG123.M_PI / 24.0
					* (double) (2 * i + 1)) / Math.cos(MPG123.M_PI
					* (double) (2 * i + 7) / 24.0));
			for (int j = 0; j < 6; j++)
				COS1[i][j] = (float) Math.cos(MPG123.M_PI / 24.0
						* (double) ((2 * i + 7) * (2 * j + 1)));
		}

		for (int j = 0; j < 4; j++) {
			for (int i = 0; i < len[j]; i += 2)
				win1[j][i] = +win[j][i];
			for (int i = 1; i < len[j]; i += 2)
				win1[j][i] = -win[j][i];
		}

		for (int i = 0; i < 16; i++) {
			double t = Math.tan((double) i * MPG123.M_PI / 12.0);
			tan1_1[i] = (float) (t / (1.0 + t));
			tan2_1[i] = (float) (1.0 / (1.0 + t));
			tan1_2[i] = (float) (MPG123.M_SQRT2 * t / (1.0 + t));
			tan2_2[i] = (float) (MPG123.M_SQRT2 / (1.0 + t));

			for (int j = 0; j < 2; j++) {
				double base = Math.pow(2.0, -0.25 * (j + 1.0));
				double p1 = 1.0, p2 = 1.0;
				if (i > 0) {
					if ((i & 1) != 0)
						p1 = Math.pow(base, (i + 1.0) * 0.5);
					else
						p2 = Math.pow(base, i * 0.5);
				}
				pow1_1[j][i] = (float) p1;
				pow2_1[j][i] = (float) p2;
				pow1_2[j][i] = (float) (MPG123.M_SQRT2 * p1);
				pow2_2[j][i] = (float) (MPG123.M_SQRT2 * p2);
			}
		}

		for (int j = 0; j < 9; j++) {
			final bandInfoStruct bi = bandInfo[j];
			int mp;
			int cb, lwin;
			int bdf;

			map[j][0] = mapbuf0[j];
			mp = 0;
			bdf = 0;
			int i;
			for (i = 0, cb = 0; cb < 8; cb++, i += bi.longDiff[bdf++]) {
				map[j][0][mp++] = (bi.longDiff[bdf]) >> 1;
				map[j][0][mp++] = i;
				map[j][0][mp++] = 3;
				map[j][0][mp++] = cb;
			}
			bdf = +3;
			for (cb = 3; cb < 13; cb++) {
				int l = (bi.shortDiff[bdf++]) >> 1;
				for (lwin = 0; lwin < 3; lwin++) {
					map[j][0][mp++] = l;
					map[j][0][mp++] = i + lwin;
					map[j][0][mp++] = lwin;
					map[j][0][mp++] = cb;
				}
				i += 6 * l;
			}
			mapend[j][0] = mp;

			map[j][1] = mapbuf1[j];
			mp = 0;
			bdf = 0;
			for (i = 0, cb = 0; cb < 13; cb++) {
				int l = (bi.shortDiff[bdf++]) >> 1;
				for (lwin = 0; lwin < 3; lwin++) {
					map[j][1][mp++] = l;
					map[j][1][mp++] = i + lwin;
					map[j][1][mp++] = lwin;
					map[j][1][mp++] = cb;
				}
				i += 6 * l;
			}
			mapend[j][1] = mp;

			map[j][2] = mapbuf2[j];
			mp = 0;
			bdf = 0;
			for (cb = 0; cb < 22; cb++) {
				map[j][2][mp++] = (bi.longDiff[bdf++]) >> 1;
				map[j][2][mp++] = cb;
			}
			mapend[j][2] = mp;

		}

		for (int j = 0; j < 9; j++) {
			for (int i = 0; i < 23; i++) {
				longLimit[j][i] = (bandInfo[j].longIdx[i] - 1 + 8) / 18 + 1;
				if (longLimit[j][i] > (down_sample_sblimit))
					longLimit[j][i] = down_sample_sblimit;
			}
			for (int i = 0; i < 14; i++) {
				shortLimit[j][i] = (bandInfo[j].shortIdx[i] - 1) / 18 + 1;
				if (shortLimit[j][i] > (down_sample_sblimit))
					shortLimit[j][i] = down_sample_sblimit;
			}
		}

		for (int i = 0; i < 5; i++) {
			for (int j = 0; j < 6; j++) {
				for (int k = 0; k < 6; k++) {
					int n = k + j * 6 + i * 36;
					i_slen2[n] = i | (j << 3) | (k << 6) | (3 << 12);
				}
			}
		}
		for (int i = 0; i < 4; i++) {
			for (int j = 0; j < 4; j++) {
				for (int k = 0; k < 4; k++) {
					int n = k + j * 4 + i * 16;
					i_slen2[n + 180] = i | (j << 3) | (k << 6) | (4 << 12);
				}
			}
		}
		for (int i = 0; i < 4; i++) {
			for (int j = 0; j < 3; j++) {
				int n = j + i * 3;
				i_slen2[n + 244] = i | (j << 3) | (5 << 12);
				n_slen2[n + 500] = i | (j << 3) | (2 << 12) | (1 << 15);
			}
		}

		for (int i = 0; i < 5; i++) {
			for (int j = 0; j < 5; j++) {
				for (int k = 0; k < 4; k++) {
					int l;
					for (l = 0; l < 4; l++) {
						int n = l + k * 4 + j * 16 + i * 80;
						n_slen2[n] = i | (j << 3) | (k << 6) | (l << 9)
								| (0 << 12);
					}
				}
			}
		}
		for (int i = 0; i < 5; i++) {
			for (int j = 0; j < 5; j++) {
				for (int k = 0; k < 4; k++) {
					int n = k + j * 4 + i * 20;
					n_slen2[n + 400] = i | (j << 3) | (k << 6) | (1 << 12);
				}
			}
		}
	}
	
	/*
	 * read additional side information
	 */

	private void III_get_side_info_1(final mpstr_tag mp, final III_sideinfo si,
			final int stereo, final int ms_stereo, final int sfreq,
			final int single) {
	    int     ch, gr;
	    int     powdiff = (single == 3) ? 4 : 0;

	    si.main_data_begin = common.getbits(mp, 9);
	    if (stereo == 1)
	        si.private_bits = common.getbits_fast(mp, 5);
	    else
	        si.private_bits = common.getbits_fast(mp, 3);

	    for (ch = 0; ch < stereo; ch++) {
	        si.ch[ch].gr[0].scfsi = -1;
	        si.ch[ch].gr[1].scfsi = common.getbits_fast(mp, 4);
	    }

	    for (gr = 0; gr < 2; gr++) {
	        for (ch = 0; ch < stereo; ch++) {
	            gr_info_s gr_infos = si.ch[ch].gr[gr];

	            gr_infos.part2_3_length = common.getbits(mp, 12);
	            gr_infos.big_values = common.getbits_fast(mp, 9);
	            if (gr_infos.big_values > 288) {
	                System.err.printf("big_values too large! %d\n", gr_infos.big_values);
	                gr_infos.big_values = 288;
	            }
	            {
	                int qss = common.getbits_fast(mp, 8);
	                gr_infos.pow2gain = gainpow2;
	                gr_infos.pow2gainPos = 256 - qss + powdiff;
	                if (mp.pinfo != null) {
	                    mp.pinfo.qss[gr][ch] = qss;
	                }
	            }
	            if (ms_stereo!=0)
	                gr_infos.pow2gainPos += 2;
	            gr_infos.scalefac_compress = common.getbits_fast(mp, 4);
	/* window-switching flag == 1 for block_Type != 0 .. and block-type == 0 . win-sw-flag = 0 */
	            if (get1bit(mp)!=0) {
	                int     i;
	                gr_infos.block_type = common.getbits_fast(mp, 2);
	                gr_infos.mixed_block_flag = get1bit(mp);
	                gr_infos.table_select[0] = common.getbits_fast(mp, 5);
	                gr_infos.table_select[1] = common.getbits_fast(mp, 5);


	                /*
	                 * table_select[2] not needed, because there is no region2,
	                 * but to satisfy some verifications tools we set it either.
	                 */
	                gr_infos.table_select[2] = 0;
	                for (i = 0; i < 3; i++) {
	                    int sbg = (common.getbits_fast(mp, 3) << 3);
	                    gr_infos.full_gain[i] = gr_infos.pow2gain;
	                    gr_infos.full_gainPos[i] = gr_infos.pow2gainPos + sbg;
	                    if (mp.pinfo != null)
	                        mp.pinfo.sub_gain[gr][ch][i] = sbg / 8;
	                }

	                if (gr_infos.block_type == 0) {
	                    System.err.printf("Blocktype == 0 and window-switching == 1 not allowed.\n");
	                    /* error seems to be very good recoverable, so don't exit */
	                    /* exit(1); */
	                }
	                /* region_count/start parameters are implicit in this case. */
	                gr_infos.region1start = 36 >> 1;
	                gr_infos.region2start = 576 >> 1;
	            }
	            else {
	                int     i, r0c, r1c;
	                for (i = 0; i < 3; i++)
	                    gr_infos.table_select[i] = common.getbits_fast(mp, 5);
	                r0c = common.getbits_fast(mp, 4);
	                r1c = common.getbits_fast(mp, 3);
	                gr_infos.region1start = bandInfo[sfreq].longIdx[r0c + 1] >> 1;
	                gr_infos.region2start = bandInfo[sfreq].longIdx[r0c + 1 + r1c + 1] >> 1;
	                gr_infos.block_type = 0;
	                gr_infos.mixed_block_flag = 0;
	            }
	            gr_infos.preflag = get1bit(mp);
	            gr_infos.scalefac_scale = get1bit(mp);
	            gr_infos.count1table_select = get1bit(mp);
	        }
	    }
	}

	/*
	 * Side Info for MPEG 2.0 / LSF
	 */
	private void III_get_side_info_2(final mpstr_tag mp, final III_sideinfo si,
			final int stereo, final int ms_stereo, final int sfreq,
			final int single) {
	    int     ch;
	    int     powdiff = (single == 3) ? 4 : 0;

	    si.main_data_begin = common.getbits(mp, 8);

	    if (stereo == 1)
	        si.private_bits = get1bit(mp);
	    else
	        si.private_bits = common.getbits_fast(mp, 2);

	    for (ch = 0; ch < stereo; ch++) {
	        gr_info_s gr_infos = si.ch[ch].gr[0];
	        int qss;

	        gr_infos.part2_3_length = common.getbits(mp, 12);
	        gr_infos.big_values = common.getbits_fast(mp, 9);
	        if (gr_infos.big_values > 288) {
	            System.err.printf("big_values too large! %d\n", gr_infos.big_values);
	            gr_infos.big_values = 288;
	        }
	        qss = common.getbits_fast(mp, 8);
	        gr_infos.pow2gain = gainpow2;
	        gr_infos.pow2gainPos = 256 - qss + powdiff;
	        if (mp.pinfo != null) {
	            mp.pinfo.qss[0][ch] = qss;
	        }

	        if (ms_stereo!=0)
	            gr_infos.pow2gainPos += 2;
	        gr_infos.scalefac_compress = common.getbits(mp, 9);
	/* window-switching flag == 1 for block_Type != 0 .. and block-type == 0 . win-sw-flag = 0 */
	        if (get1bit(mp)!=0) {
	            int     i;
	            gr_infos.block_type = common.getbits_fast(mp, 2);
	            gr_infos.mixed_block_flag = get1bit(mp);
	            gr_infos.table_select[0] = common.getbits_fast(mp, 5);
	            gr_infos.table_select[1] = common.getbits_fast(mp, 5);
	            /*
	             * table_select[2] not needed, because there is no region2,
	             * but to satisfy some verifications tools we set it either.
	             */
	            gr_infos.table_select[2] = 0;
	            for (i = 0; i < 3; i++) {
	                int sbg = (common.getbits_fast(mp, 3) << 3);
	                gr_infos.full_gain[i] = gr_infos.pow2gain;
	                gr_infos.full_gainPos[i] = gr_infos.pow2gainPos+sbg;
	                if (mp.pinfo != null)
	                    mp.pinfo.sub_gain[0][ch][i] = sbg / 8;

	            }

	            if (gr_infos.block_type == 0) {
	                System.err.printf("Blocktype == 0 and window-switching == 1 not allowed.\n");
	                /* error seems to be very good recoverable, so don't exit */
	                /* exit(1); */
	            }
	            /* region_count/start parameters are implicit in this case. */
	/* check this again! */
	            if (gr_infos.block_type == 2) {
	                if (sfreq == 8)
	                    gr_infos.region1start = 36;
	                else
	                    gr_infos.region1start = 36 >> 1;
	            }
	            else if (sfreq == 8)
	/* check this for 2.5 and sfreq=8 */
	                gr_infos.region1start = 108 >> 1;
	            else
	                gr_infos.region1start = 54 >> 1;
	            gr_infos.region2start = 576 >> 1;
	        }
	        else {
	            int     i, r0c, r1c;
	            for (i = 0; i < 3; i++)
	                gr_infos.table_select[i] = common.getbits_fast(mp, 5);
	            r0c = common.getbits_fast(mp, 4);
	            r1c = common.getbits_fast(mp, 3);
	            gr_infos.region1start = bandInfo[sfreq].longIdx[r0c + 1] >> 1;
	            gr_infos.region2start = bandInfo[sfreq].longIdx[r0c + 1 + r1c + 1] >> 1;
	            gr_infos.block_type = 0;
	            gr_infos.mixed_block_flag = 0;
	        }
	        gr_infos.scalefac_scale = get1bit(mp);
	        gr_infos.count1table_select = get1bit(mp);
	    }
	}

	private static final int slen[][] = {
        {0, 0, 0, 0, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4},
        {0, 1, 2, 3, 0, 1, 2, 3, 1, 2, 3, 1, 2, 3, 2, 3}
    };
	/*
	 * read scalefactors
	 */

	private int
	III_get_scale_factors_1(mpstr_tag mp, int []scf, gr_info_s gr_infos)
	{
		int scfPos=0;
	    int     numbits;
	    int     num0 = slen[0][gr_infos.scalefac_compress];
	    int     num1 = slen[1][gr_infos.scalefac_compress];

	    if (gr_infos.block_type == 2) {
	        int     i = 18;
	        numbits = (num0 + num1) * 18;

	        if (gr_infos.mixed_block_flag!=0) {
	            for (i = 8; i!=0; i--)
	                scf[scfPos++] = common.getbits_fast(mp, num0);
	            i = 9;
	            numbits -= num0; /* num0 * 17 + num1 * 18 */
	        }

	        for (; i!=0; i--)
	            scf[scfPos++] = common.getbits_fast(mp, num0);
	        for (i = 18; i!=0; i--)
	            scf[scfPos++] = common.getbits_fast(mp, num1);
	        scf[scfPos++] = 0;
	        scf[scfPos++] = 0;
	        scf[scfPos++] = 0;     /* short[13][0..2] = 0 */
	    }
	    else {
	        int     i;
	        int     scfsi = gr_infos.scfsi;

	        if (scfsi < 0) { /* scfsi < 0 => granule == 0 */
	            for (i = 11; i!=0; i--)
	                scf[scfPos++] = common.getbits_fast(mp, num0);
	            for (i = 10; i!=0; i--)
	                scf[scfPos++] = common.getbits_fast(mp, num1);
	            numbits = (num0 + num1) * 10 + num0;
	        }
	        else {
	            numbits = 0;
	            if (0==(scfsi & 0x8)) {
	                for (i = 6; i!=0; i--)
	                    scf[scfPos++] = common.getbits_fast(mp, num0);
	                numbits += num0 * 6;
	            }
	            else {
	                scfPos += 6;
	            }

	            if (0==(scfsi & 0x4)) {
	                for (i = 5; i!=0; i--)
	                    scf[scfPos++] = common.getbits_fast(mp, num0);
	                numbits += num0 * 5;
	            }
	            else {
	            	scfPos += 5;
	            }

	            if (0==(scfsi & 0x2)) {
	                for (i = 5; i!=0; i--)
	                    scf[scfPos++] = common.getbits_fast(mp, num1);
	                numbits += num1 * 5;
	            }
	            else {
	            	scfPos += 5;
	            }

	            if (0==(scfsi & 0x1)) {
	                for (i = 5; i!=0; i--)
	                    scf[scfPos++] = common.getbits_fast(mp, num1);
	                numbits += num1 * 5;
	            }
	            else {
	            	scfPos += 5;
	            }
	        }

	        scf[scfPos++] = 0;     /* no l[21] in original sources */
	    }
	    return numbits;
	}

	private static final int stab[][][] = {
	   { { 6, 5, 5,5 } , { 6, 5, 7,3 } , { 11,10,0,0} ,
	     { 7, 7, 7,0 } , { 6, 6, 6,3 } , {  8, 8,5,0} } ,
	   { { 9, 9, 9,9 } , { 9, 9,12,6 } , { 18,18,0,0} ,
	     {12,12,12,0 } , {12, 9, 9,6 } , { 15,12,9,0} } ,
	   { { 6, 9, 9,9 } , { 6, 9,12,6 } , { 15,18,0,0} ,
	     { 6,15,12,0 } , { 6,12, 9,6 } , {  6,18,9,0} } }; 

	private int
	III_get_scale_factors_2(mpstr_tag mp, int []scf, gr_info_s gr_infos, int i_stereo)
	{
		int scfPos=0;
	    int[] pnt;
	    int     i, j;
	    int slen;
	    int     n = 0;
	    int     numbits = 0;

	    if (i_stereo!=0)       /* i_stereo AND second channel . do_layer3() checks this */
	        slen = i_slen2[gr_infos.scalefac_compress >> 1];
	    else
	        slen = n_slen2[gr_infos.scalefac_compress];

	    gr_infos.preflag = (slen >> 15) & 0x1;

	    n = 0;
	    if (gr_infos.block_type == 2) {
	        n++;
	        if (gr_infos.mixed_block_flag!=0)
	            n++;
	    }

	    pnt = stab[n][(slen >> 12) & 0x7];

	    for (i = 0; i < 4; i++) {
	        int     num = slen & 0x7;
	        slen >>= 3;
	        if (num!=0) {
	            for (j = 0; j < (int) (pnt[i]); j++)
	                scf[scfPos++] = common.getbits_fast(mp, num);
	            numbits += pnt[i] * num;
	        }
	        else {
	            for (j = 0; j < (int) (pnt[i]); j++)
	                scf[scfPos++] = 0;
	        }
	    }

	    n = (n << 1) + 1;
	    for (i = 0; i < n; i++)
	        scf[scfPos++] = 0;

	    return numbits;
	}

	private static final int pretab1 [] = {0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,3,3,3,2,0}; /* char enough ? */
	private static final int pretab2 [] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};

	private int
	III_dequantize_sample(mpstr_tag mp, float xr[], int []scf,
	                      gr_info_s gr_infos, int sfreq, int part2bits)
	{
		int scfPos = 0;
	    int     shift = 1 + gr_infos.scalefac_scale;
	    float []xrpnt = (float []) xr;
	    int xrpntPos=0;
	    int     l[]=new int[3], l3;
	    int     part2remain = gr_infos.part2_3_length - part2bits;
	    int    me;

	    /* fprintf(stderr,"part2remain = %d, gr_infos.part2_3_length = %d, part2bits = %d\n",
	       part2remain, gr_infos.part2_3_length, part2bits); */

	    {
	        int     i;

	        for (i = ((MPG123.SBLIMIT*MPG123.SSLIMIT) - xrpntPos) >> 1; i > 0; i--) {
	            xrpnt[xrpntPos++] = 0.0f;
	            xrpnt[xrpntPos++] = 0.0f;
	        }

	        xrpnt = (float [])xr;
	        xrpntPos = 0;
	    }

	    {
	        int     bv = gr_infos.big_values;
	        int     region1 = gr_infos.region1start;
	        int     region2 = gr_infos.region2start;

	        l3 = ((576 >> 1) - bv) >> 1;
	/*
	 * we may lose the 'odd' bit here !! 
	 * check this later again 
	 */
	        if (bv <= region1) {
	            l[0] = bv;
	            l[1] = 0;
	            l[2] = 0;
	        }
	        else {
	            l[0] = region1;
	            if (bv <= region2) {
	                l[1] = bv - l[0];
	                l[2] = 0;
	            }
	            else {
	                l[1] = region2 - l[0];
	                l[2] = bv - region2;
	            }
	        }
	    }
	    /* MDH crash fix */
	    {
	        int     i;
	        for (i = 0; i < 3; i++) {
	            if (l[i] < 0) {
	                System.err.printf("hip: Bogus region length (%d)\n", l[i]);
	                l[i] = 0;
	            }
	        }
	    }
	    /* end MDH crash fix */

	    if (gr_infos.block_type == 2) {
	        /*
	         * decoding with short or mixed mode BandIndex table 
	         */
	        int     i, max[]=new int[4];
	        int     step = 0, lwin = 0, cb = 0;
	        float    v = 0.0f;
	        int    []m;
	        int mc;
	        int mPos=0;
	        if (gr_infos.mixed_block_flag!=0) {
	            max[3] = -1;
	            max[0] = max[1] = max[2] = 2;
	            m = map[sfreq][0];
	            mPos = 0;
	            me = mapend[sfreq][0];
	        }
	        else {
	            max[0] = max[1] = max[2] = max[3] = -1;
	            /* max[3] not really needed in this case */
	            m = map[sfreq][1];
	            mPos = 0;
	            me = mapend[sfreq][1];
	        }

	        mc = 0;
	        for (i = 0; i < 2; i++) {
	            int     lp = l[i];
	            newhuff []h = Huffman.ht;
	            int hPos = (gr_infos.table_select[i]);
	            
	            for (; lp!=0; lp--, mc--) {
	                int     x, y;
	                if ((0==mc)) {
	                    mc = m[mPos++];
	                    xrpnt = (float[]) xr;
	                    xrpntPos = (m[mPos++]);
	                    lwin = m[mPos++];
	                    cb = m[mPos++];
	                    if (lwin == 3) {
	                        v = gr_infos.pow2gain[gr_infos.pow2gainPos+(((scf[scfPos++]) << shift))];
	                        step = 1;
	                    }
	                    else {
	                        v = gr_infos.full_gain[lwin][gr_infos.full_gainPos[lwin]+((scf[scfPos++]) << shift)];
	                        step = 3;
	                    }
	                }
	                {
	                    short []val = h[hPos].table;
	                    int valPos=0;
	                    while ((y = val[valPos++]) < 0) {
	                        if (get1bit(mp)!=0)
	                            valPos -= y;
	                        part2remain--;
	                    }
	                    x = y >> 4;
	                    y &= 0xf;
	                }
	                if (x == 15) {
	                    max[lwin] = cb;
	                    part2remain -= h[hPos].linbits + 1;
	                    x += common.getbits(mp, (int) h[hPos].linbits);
	                    if (get1bit(mp)!=0)
	                    	xrpnt[xrpntPos] = -ispow[x] * v;
	                    else
	                        xrpnt[xrpntPos] = ispow[x] * v;
	                }
	                else if (x!=0) {
	                    max[lwin] = cb;
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos] = -ispow[x] * v;
	                    else
	                        xrpnt[xrpntPos] = ispow[x] * v;
	                    part2remain--;
	                }
	                else
	                    xrpnt[xrpntPos] = 0.0f;
	                xrpntPos += step;
	                if (y == 15) {
	                    max[lwin] = cb;
	                    part2remain -= h[hPos].linbits + 1;
	                    y += common.getbits(mp, (int) h[hPos].linbits);
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos] = -ispow[y] * v;
	                    else
	                        xrpnt[xrpntPos] = ispow[y] * v;
	                }
	                else if (y!=0) {
	                    max[lwin] = cb;
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos] = -ispow[y] * v;
	                    else
	                        xrpnt[xrpntPos] = ispow[y] * v;
	                    part2remain--;
	                }
	                else
	                    xrpnt[xrpntPos] = 0.0f;
	                xrpntPos += step;
	            }
	        }
	        for (; l3!=0 && (part2remain > 0); l3--) {
	            newhuff []h = Huffman.htc;
	            int hPos = (gr_infos.count1table_select);
	            short []val = h[hPos].table;
	            int valPos = 0;
	            short   a;

	            while ((a = val[valPos++]) < 0) {
	                part2remain--;
	                if (part2remain < 0) {
	                    part2remain++;
	                    a = 0;
	                    break;
	                }
	                if (get1bit(mp)!=0)
	                    valPos -= a;
	            }
	            for (i = 0; i < 4; i++) {
	                if (0==(i & 1)) {
	                    if (0==mc) {
	                        mc = m[mPos++];
	                        xrpnt = ((float []) xr);
	                        xrpntPos = (m[mPos++]);
	                        lwin = m[mPos++];
	                        cb = m[mPos++];
	                        if (lwin == 3) {
	                            v = gr_infos.pow2gain[gr_infos.pow2gainPos+((scf[scfPos++]) << shift)];
	                            step = 1;
	                        }
	                        else {
	                            v = gr_infos.full_gain[lwin][gr_infos.full_gainPos[lwin]+((scf[scfPos++]) << shift)];
	                            step = 3;
	                        }
	                    }
	                    mc--;
	                }
	                if ((a & (0x8 >> i))!=0) {
	                    max[lwin] = cb;
	                    part2remain--;
	                    if (part2remain < 0) {
	                        part2remain++;
	                        break;
	                    }
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos] = -v;
	                    else
	                        xrpnt[xrpntPos] = v;
	                }
	                else
	                    xrpnt[xrpntPos] = 0.0f;
	                xrpntPos += step;
	            }
	        }

	        while (mPos < me) {
	            if (0==mc) {
	                mc = m[mPos++];
	                xrpnt = ((float []) xr);
	                xrpntPos = m[mPos++];
	                if ((m[mPos++]) == 3)
	                    step = 1;
	                else
	                    step = 3;
	                mPos++;    /* cb */
	            }
	            mc--;
	            xrpnt[xrpntPos] = 0.0f;
	            xrpntPos += step;
	            xrpnt[xrpntPos] = 0.0f;
	            xrpntPos += step;
	/* we could add a little opt. here:
	 * if we finished a band for window 3 or a long band
	 * further bands could copied in a simple loop without a
	 * special 'map' decoding
	 */
	        }

	        gr_infos.maxband[0] = max[0] + 1;
	        gr_infos.maxband[1] = max[1] + 1;
	        gr_infos.maxband[2] = max[2] + 1;
	        gr_infos.maxbandl = max[3] + 1;

	        {
	            int     rmax = max[0] > max[1] ? max[0] : max[1];
	            rmax = (rmax > max[2] ? rmax : max[2]) + 1;
	            gr_infos.maxb = rmax!=0 ? shortLimit[sfreq][rmax] : longLimit[sfreq][max[3] + 1];
	        }

	    }
	    else {
	        /*
	         * decoding with 'long' BandIndex table (block_type != 2)
	         */
	        int []pretab = (int []) (gr_infos.preflag!=0 ? pretab1 : pretab2);
	        int pretabPos = 0;
	        int     i, max = -1;
	        int     cb = 0;
	        int    []m = map[sfreq][2];
	        int mPos=0;
	        float    v = 0.0f;
	        int     mc = 0;

	        /*
	         * long hash table values
	         */
	        for (i = 0; i < 3; i++) {
	            int     lp = l[i];
	            newhuff []h = Huffman.ht;
	            int hPos = (gr_infos.table_select[i]);

	            for (; lp!=0; lp--, mc--) {
	                int     x, y;

	                if (0==mc) {
	                    mc = m[mPos++];
	                    v = gr_infos.pow2gain[gr_infos.pow2gainPos+(((scf[scfPos++]) + (pretab[pretabPos++])) << shift)];
	                    cb = m[mPos++];
	                }
	                {
	                    short []val = h[hPos].table;
	                    int valPos = 0;
	                    while ((y = val[valPos++]) < 0) {
	                        if (get1bit(mp)!=0)
	                            valPos -= y;
	                        part2remain--;
	                    }
	                    x = y >> 4;
	                    y &= 0xf;
	                }
	                if (x == 15) {
	                    max = cb;
	                    part2remain -= h[hPos].linbits + 1;
	                    x += common.getbits(mp, (int) h[hPos].linbits);
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos++] = -ispow[x] * v;
	                    else
	                        xrpnt[xrpntPos++] = ispow[x] * v;
	                }
	                else if (x!=0) {
	                    max = cb;
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos++] = -ispow[x] * v;
	                    else
	                        xrpnt[xrpntPos++] = ispow[x] * v;
	                    part2remain--;
	                }
	                else
	                    xrpnt[xrpntPos++] = 0.0f;

	                if (y == 15) {
	                    max = cb;
	                    part2remain -= h[hPos].linbits + 1;
	                    y += common.getbits(mp, (int) h[hPos].linbits);
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos++] = -ispow[y] * v;
	                    else
	                        xrpnt[xrpntPos++] = ispow[y] * v;
	                }
	                else if (y!=0) {
	                    max = cb;
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos++] = -ispow[y] * v;
	                    else
	                        xrpnt[xrpntPos++] = ispow[y] * v;
	                    part2remain--;
	                }
	                else
	                    xrpnt[xrpntPos++] = 0.0f;
	            }
	        }

	        /*
	         * short (count1table) values
	         */
	        for (; l3!=0 && (part2remain > 0); l3--) {
	            newhuff []h = Huffman.htc;
	            int hPos = (gr_infos.count1table_select);
	            short []val = h[hPos].table;
	            int valPos = 0;
	            short   a;

	            while ((a = val[valPos++]) < 0) {
	                part2remain--;
	                if (part2remain < 0) {
	                    part2remain++;
	                    a = 0;
	                    break;
	                }
	                if (get1bit(mp)!=0)
	                    valPos -= a;
	            }
	            for (i = 0; i < 4; i++) {
	                if (0==(i & 1)) {
	                    if (0==mc) {
	                        mc = m[mPos++];
	                        cb = m[mPos++];
	                        v = gr_infos.pow2gain[gr_infos.pow2gainPos+(((scf[scfPos++]) + (pretab[pretabPos++])) << shift)];
	                    }
	                    mc--;
	                }
	                if ((a & (0x8 >> i))!=0) {
	                    max = cb;
	                    part2remain--;
	                    if (part2remain < 0) {
	                        part2remain++;
	                        break;
	                    }
	                    if (get1bit(mp)!=0)
	                        xrpnt[xrpntPos++] = -v;
	                    else
	                        xrpnt[xrpntPos++] = v;
	                }
	                else
	                    xrpnt[xrpntPos++] = 0.0f;
	            }
	        }

	        /* 
	         * zero part
	         */
	        for (i = ((MPG123.SBLIMIT*MPG123.SSLIMIT) - xrpntPos) >> 1; i!=0; i--) {
	            xrpnt[xrpntPos++] = 0.0f;
	            xrpnt[xrpntPos++] = 0.0f;
	        }

	        gr_infos.maxbandl = max + 1;
	        gr_infos.maxb = longLimit[sfreq][gr_infos.maxbandl];
	    }

	    while (part2remain > 16) {
	        common.getbits(mp, 16); /* Dismiss stuffing Bits */
	        part2remain -= 16;
	    }
	    if (part2remain > 0)
	        common.getbits(mp, part2remain);
	    else if (part2remain < 0) {
	        System.err.printf("hip: Can't rewind stream by %d bits!\n", -part2remain);
	        return 1;       /* . error */
	    }
	    return 0;
	}

	/* 
	 * III_stereo: calculate real channel values for Joint-I-Stereo-mode
	 */
	private void
	III_i_stereo(float xr_buf[][], int []scalefac,
	            gr_info_s gr_infos, int sfreq, int ms_stereo, int lsf)
	{
		float[][] xr = xr_buf ;
	    final bandInfoStruct bi = bandInfo[sfreq];
	    float   tabl1[], tabl2[];

	    if (lsf!=0) {
	        int     p = gr_infos.scalefac_compress & 0x1;
	        if (ms_stereo!=0) {
	            tabl1 = pow1_2[p];
	            tabl2 = pow2_2[p];
	        }
	        else {
	            tabl1 = pow1_1[p];
	            tabl2 = pow2_1[p];
	        }
	    }
	    else {
	        if (ms_stereo!=0) {
	            tabl1 = tan1_2;
	            tabl2 = tan2_2;
	        }
	        else {
	            tabl1 = tan1_1;
	            tabl2 = tan2_1;
	        }
	    }

	    if (gr_infos.block_type == 2) {
	        int     lwin, do_l = 0;
	        if (gr_infos.mixed_block_flag!=0)
	            do_l = 1;

	        for (lwin = 0; lwin < 3; lwin++) { /* process each window */
	            /* get first band with zero values */
	            int     is_p, sb, idx, sfb = gr_infos.maxband[lwin]; /* sfb is minimal 3 for mixed mode */
	            if (sfb > 3)
	                do_l = 0;

	            for (; sfb < 12; sfb++) {
	                is_p = scalefac[sfb * 3 + lwin - gr_infos.mixed_block_flag]; /* scale: 0-15 */
	                if (is_p != 7) {
	                    float	t1, t2;
	                    sb = bi.shortDiff[sfb];
	                    idx = bi.shortIdx[sfb] + lwin;
	                    t1 = tabl1[is_p];
	                    t2 = tabl2[is_p];
	                    for (; sb > 0; sb--, idx += 3) {
	                        float    v = xr[0][idx];
	                        xr[0][idx] = v * t1;
	                        xr[1][idx] = v * t2;
	                    }
	                }
	            }

	/* in the original: copy 10 to 11 , here: copy 11 to 12 
	maybe still wrong??? (copy 12 to 13?) */
	            is_p = scalefac[11 * 3 + lwin - gr_infos.mixed_block_flag]; /* scale: 0-15 */
	            sb = bi.shortDiff[12];
	            idx = bi.shortIdx[12] + lwin;
	            if (is_p != 7) {
	                float    t1, t2;
	                t1 = tabl1[is_p];
	                t2 = tabl2[is_p];
	                for (; sb > 0; sb--, idx += 3) {
	                	float    v = xr[0][idx];
	                    xr[0][idx] = v * t1;
	                    xr[1][idx] = v * t2;
	                }
	            }
	        }               /* end for(lwin; .. ; . ) */

	        if (do_l!=0) {
	/* also check l-part, if ALL bands in the three windows are 'empty'
	 * and mode = mixed_mode 
	 */
	            int     sfb = gr_infos.maxbandl;
	            int     idx = bi.longIdx[sfb];

	            for (; sfb < 8; sfb++) {
	                int     sb = bi.longDiff[sfb];
	                int     is_p = scalefac[sfb]; /* scale: 0-15 */
	                if (is_p != 7) {
	                	float    t1, t2;
	                    t1 = tabl1[is_p];
	                    t2 = tabl2[is_p];
	                    for (; sb > 0; sb--, idx++) {
	                    	float    v = xr[0][idx];
	                        xr[0][idx] = v * t1;
	                        xr[1][idx] = v * t2;
	                    }
	                }
	                else
	                    idx += sb;
	            }
	        }
	    }
	    else {              /* ((gr_infos.block_type != 2)) */

	        int     sfb = gr_infos.maxbandl;
	        int     is_p, idx = bi.longIdx[sfb];
	        for (; sfb < 21; sfb++) {
	            int     sb = bi.longDiff[sfb];
	            is_p = scalefac[sfb]; /* scale: 0-15 */
	            if (is_p != 7) {
	            	float    t1, t2;
	                t1 = tabl1[is_p];
	                t2 = tabl2[is_p];
	                for (; sb > 0; sb--, idx++) {
	                	float    v = xr[0][idx];
	                    xr[0][idx] = v * t1;
	                    xr[1][idx] = v * t2;
	                }
	            }
	            else
	                idx += sb;
	        }

	        is_p = scalefac[20]; /* copy l-band 20 to l-band 21 */
	        if (is_p != 7) {
	            int     sb;
	            float    t1 = tabl1[is_p], t2 = tabl2[is_p];

	            for (sb = bi.longDiff[21]; sb > 0; sb--, idx++) {
	            	float    v = xr[0][idx];
	                xr[0][idx] = v * t1;
	                xr[1][idx] = v * t2;
	            }
	        }
	    }                   /* ... */
	}

	private void
	III_antialias(float xr[], gr_info_s gr_infos)
	{
	    int     sblim;

	    if (gr_infos.block_type == 2) {
	        if (0==gr_infos.mixed_block_flag)
	            return;
	        sblim = 1;
	    }
	    else {
	        sblim = gr_infos.maxb - 1;
	    }

	    /* 31 alias-reduction operations between each pair of sub-bands */
	    /* with 8 butterflies between each pair                         */

	    {
	        int     sb;
	        float   []xr1 = (float []) xr;
	        int xr1Pos=MPG123.SSLIMIT;

	        for (sb = sblim; sb!=0; sb--, xr1Pos += 10) {
	            int     ss;
	            float   cs[] = aa_cs, ca[] = aa_ca;
	            int caPos=0; int csPos=0;
	            float   []xr2 = xr1;
	            int xr2Pos = xr1Pos;

	            for (ss = 7; ss >= 0; ss--) { /* upper and lower butterfly inputs */
	                float    bu = xr2[--xr2Pos], bd = xr1[xr1Pos];
	                xr2[xr2Pos] = (bu * (cs[csPos])) - (bd * (ca[caPos]));
	                xr1[xr1Pos++] = (bd * (cs[csPos++])) + (bu * (ca[caPos++]));
	            }
	        }
	    }
	}

	/*
	 DCT insipired by Jeff Tsay's DCT from the maplay package
	 this is an optimized version with manual unroll.

	 References:
	 [1] S. Winograd: "On Computing the Discrete Fourier Transform",
	     Mathematics of Computation, Volume 32, Number 141, January 1978,
	     Pages 175-199
	*/

	private void dct36(float[] inbuf, int inbufPos,float[] o1, int o1Pos,float[] o2, int o2Pos,float[] wintab,float[] tsbuf, int tsPos)
	{
		  {
			    float []in = inbuf;
			    int inPos = inbufPos;

			    in[inPos+17]+=in[inPos+16]; in[inPos+16]+=in[inPos+15]; in[inPos+15]+=in[inPos+14];
			    in[inPos+14]+=in[inPos+13]; in[inPos+13]+=in[inPos+12]; in[inPos+12]+=in[inPos+11];
			    in[inPos+11]+=in[inPos+10]; in[inPos+10]+=in[inPos+9];  in[inPos+9] +=in[inPos+8];
			    in[inPos+8] +=in[inPos+7];  in[inPos+7] +=in[inPos+6];  in[inPos+6] +=in[inPos+5];
			    in[inPos+5] +=in[inPos+4];  in[inPos+4] +=in[inPos+3];  in[inPos+3] +=in[inPos+2];
			    in[inPos+2] +=in[inPos+1];  in[inPos+1] +=in[inPos+0];

			    in[inPos+17]+=in[inPos+15]; in[inPos+15]+=in[inPos+13]; in[inPos+13]+=in[inPos+11]; in[inPos+11]+=in[inPos+9];
			    in[inPos+9] +=in[inPos+7];  in[inPos+7] +=in[inPos+5];  in[inPos+5] +=in[inPos+3];  in[inPos+3] +=in[inPos+1];

			  {

			    final float []c = COS9;
			    float []out2 = o2;
			    int out2Pos = o2Pos;
			    float []w = wintab;
			    float []out1 = o1;
			    int out1Pos = o1Pos;
			    float []ts = tsbuf;

			    float ta33,ta66,tb33,tb66;

			    ta33 = in[inPos+2*3+0] * c[3];
			    ta66 = in[inPos+2*6+0] * c[6];
			    tb33 = in[inPos+2*3+1] * c[3];
			    tb66 = in[inPos+2*6+1] * c[6];

			    { 
			      float tmp1a,tmp2a,tmp1b,tmp2b;
			      tmp1a =             in[inPos+2*1+0] * c[1] + ta33 + in[inPos+2*5+0] * c[5] + in[inPos+2*7+0] * c[7];
			      tmp1b =             in[inPos+2*1+1] * c[1] + tb33 + in[inPos+2*5+1] * c[5] + in[inPos+2*7+1] * c[7];
			      tmp2a = in[inPos+2*0+0] + in[inPos+2*2+0] * c[2] + in[inPos+2*4+0] * c[4] + ta66 + in[inPos+2*8+0] * c[8];
			      tmp2b = in[inPos+2*0+1] + in[inPos+2*2+1] * c[2] + in[inPos+2*4+1] * c[4] + tb66 + in[inPos+2*8+1] * c[8];

//			      MACRO1(0);
			      {
					float sum0 = tmp1a + tmp2a;
					float sum1 = (tmp1b + tmp2b) * tfcos36[(0)];
					float tmp;
					out2[out2Pos+9 + (0)] = (tmp = sum0 + sum1) * w[27 + (0)];
					out2[out2Pos+8 - (0)] = tmp * w[26 - (0)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(0))] = out1[out1Pos+8-(0)] + sum0 * w[8-(0)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(0))] = out1[out1Pos+9+(0)] + sum0 * w[9+(0)]; 
			      }
//			      MACRO2(8);
			      {
					float sum0, sum1;
					sum0 = tmp2a - tmp1a;
					sum1 = (tmp2b - tmp1b) * tfcos36[(8)];
					float tmp;
					out2[out2Pos+9 + (8)] = (tmp = sum0 + sum1) * w[27 + (8)];
					out2[out2Pos+8 - (8)] = tmp * w[26 - (8)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(8))] = out1[out1Pos+8-(8)] + sum0 * w[8-(8)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(8))] = out1[out1Pos+9+(8)] + sum0 * w[9+(8)]; 
			      }
			    }

			    {
			      float tmp1a,tmp2a,tmp1b,tmp2b;
			      tmp1a = ( in[inPos+2*1+0] - in[inPos+2*5+0] - in[inPos+2*7+0] ) * c[3];
			      tmp1b = ( in[inPos+2*1+1] - in[inPos+2*5+1] - in[inPos+2*7+1] ) * c[3];
			      tmp2a = ( in[inPos+2*2+0] - in[inPos+2*4+0] - in[inPos+2*8+0] ) * c[6] - in[inPos+2*6+0] + in[inPos+2*0+0];
			      tmp2b = ( in[inPos+2*2+1] - in[inPos+2*4+1] - in[inPos+2*8+1] ) * c[6] - in[inPos+2*6+1] + in[inPos+2*0+1];

//			      MACRO1(1);
			      {
					float sum0 = tmp1a + tmp2a;
					float sum1 = (tmp1b + tmp2b) * tfcos36[(1)];
					float tmp;
					out2[out2Pos+9 + (1)] = (tmp = sum0 + sum1) * w[27 + (1)];
					out2[out2Pos+8 - (1)] = tmp * w[26 - (1)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(1))] = out1[out1Pos+8-(1)] + sum0 * w[8-(1)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(1))] = out1[out1Pos+9+(1)] + sum0 * w[9+(1)]; 
			      }
//			      MACRO2(7);
			      {
					float sum0, sum1;
					sum0 = tmp2a - tmp1a;
					sum1 = (tmp2b - tmp1b) * tfcos36[(7)];
					float tmp;
					out2[out2Pos+9 + (7)] = (tmp = sum0 + sum1) * w[27 + (7)];
					out2[out2Pos+8 - (7)] = tmp * w[26 - (7)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(7))] = out1[out1Pos+8-(7)] + sum0 * w[8-(7)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(7))] = out1[out1Pos+9+(7)] + sum0 * w[9+(7)]; 
			      }
			    }

			    {
			    	float tmp1a,tmp2a,tmp1b,tmp2b;
			      tmp1a =             in[inPos+2*1+0] * c[5] - ta33 - in[inPos+2*5+0] * c[7] + in[inPos+2*7+0] * c[1];
			      tmp1b =             in[inPos+2*1+1] * c[5] - tb33 - in[inPos+2*5+1] * c[7] + in[inPos+2*7+1] * c[1];
			      tmp2a = in[inPos+2*0+0] - in[inPos+2*2+0] * c[8] - in[inPos+2*4+0] * c[2] + ta66 + in[inPos+2*8+0] * c[4];
			      tmp2b = in[inPos+2*0+1] - in[inPos+2*2+1] * c[8] - in[inPos+2*4+1] * c[2] + tb66 + in[inPos+2*8+1] * c[4];

//			      MACRO1(2);
			      {
					float sum0 = tmp1a + tmp2a;
					float sum1 = (tmp1b + tmp2b) * tfcos36[(2)];
					float tmp;
					out2[out2Pos+9 + (2)] = (tmp = sum0 + sum1) * w[27 + (2)];
					out2[out2Pos+8 - (2)] = tmp * w[26 - (2)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(2))] = out1[out1Pos+8-(2)] + sum0 * w[8-(2)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(2))] = out1[out1Pos+9+(2)] + sum0 * w[9+(2)]; 
			      }
//			      MACRO2(6);
			      {
					float sum0, sum1;
					sum0 = tmp2a - tmp1a;
					sum1 = (tmp2b - tmp1b) * tfcos36[(6)];
					float tmp;
					out2[out2Pos+9 + (6)] = (tmp = sum0 + sum1) * w[27 + (6)];
					out2[out2Pos+8 - (6)] = tmp * w[26 - (6)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(6))] = out1[out1Pos+8-(6)] + sum0 * w[8-(6)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(6))] = out1[out1Pos+9+(6)] + sum0 * w[9+(6)]; 
			      }
			    }

			    {
			    	float tmp1a,tmp2a,tmp1b,tmp2b;
			      tmp1a =             in[inPos+2*1+0] * c[7] - ta33 + in[inPos+2*5+0] * c[1] - in[inPos+2*7+0] * c[5];
			      tmp1b =             in[inPos+2*1+1] * c[7] - tb33 + in[inPos+2*5+1] * c[1] - in[inPos+2*7+1] * c[5];
			      tmp2a = in[inPos+2*0+0] - in[inPos+2*2+0] * c[4] + in[inPos+2*4+0] * c[8] + ta66 - in[inPos+2*8+0] * c[2];
			      tmp2b = in[inPos+2*0+1] - in[inPos+2*2+1] * c[4] + in[inPos+2*4+1] * c[8] + tb66 - in[inPos+2*8+1] * c[2];

//			      MACRO1(3);
			      {
					float sum0 = tmp1a + tmp2a;
					float sum1 = (tmp1b + tmp2b) * tfcos36[(3)];
					float tmp;
					out2[out2Pos+9 + (3)] = (tmp = sum0 + sum1) * w[27 + (3)];
					out2[out2Pos+8 - (3)] = tmp * w[26 - (3)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(3))] = out1[out1Pos+8-(3)] + sum0 * w[8-(3)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(3))] = out1[out1Pos+9+(3)] + sum0 * w[9+(3)]; 
			      }
//			      MACRO2(5);
			      {
					float sum0, sum1;
					sum0 = tmp2a - tmp1a;
					sum1 = (tmp2b - tmp1b) * tfcos36[(5)];
					float tmp;
					out2[out2Pos+9 + (5)] = (tmp = sum0 + sum1) * w[27 + (5)];
					out2[out2Pos+8 - (5)] = tmp * w[26 - (5)];
				    sum0 -= sum1; 
				    ts[tsPos + MPG123.SBLIMIT*(8-(5))] = out1[out1Pos+8-(5)] + sum0 * w[8-(5)]; 
				    ts[tsPos + MPG123.SBLIMIT*(9+(5))] = out1[out1Pos+9+(5)] + sum0 * w[9+(5)]; 
			      }
			    }

			    {
			    	float sum0,sum1;
			      sum0 =  in[inPos+2*0+0] - in[inPos+2*2+0] + in[inPos+2*4+0] - in[inPos+2*6+0] + in[inPos+2*8+0];
			      sum1 = (in[inPos+2*0+1] - in[inPos+2*2+1] + in[inPos+2*4+1] - in[inPos+2*6+1] + in[inPos+2*8+1] ) * tfcos36[4];
//			      MACRO0(4)
			      {
					float tmp;
					out2[out2Pos+9 + (4)] = (tmp = sum0 + sum1) * w[27 + (4)];
					out2[out2Pos+8 - (4)] = tmp * w[26 - (4)];
					  sum0 -= sum1; 
					  ts[tsPos + MPG123.SBLIMIT*(8-(4))] = out1[out1Pos + 8-(4)] + sum0 * w[8-(4)]; 
					  ts[tsPos + MPG123.SBLIMIT*(9+(4))] = out1[out1Pos + 9+(4)] + sum0 * w[9+(4)]; 
			      }
			    }
			  }

			  }
	}

	/*
	 * new DCT12
	 */
	private void dct12(float[]in,int inbufPos,float[]rawout1, int rawout1Pos,float[]rawout2, int rawout2Pos,float[]wi,float[]ts, int tsPos)
	{
		{
		float in0,in1,in2,in3,in4,in5;
		float []out1 = rawout1;
		int out1Pos = rawout1Pos;
		ts[tsPos+MPG123.SBLIMIT*0] = out1[out1Pos+0]; ts[tsPos+MPG123.SBLIMIT*1] = out1[out1Pos+1]; ts[tsPos+MPG123.SBLIMIT*2] = out1[out1Pos+2];
		ts[tsPos+MPG123.SBLIMIT*3] = out1[out1Pos+3]; ts[tsPos+MPG123.SBLIMIT*4] = out1[out1Pos+4]; ts[tsPos+MPG123.SBLIMIT*5] = out1[out1Pos+5];
		
//		DCT12_PART1
		{
		in5 = in[inbufPos+5 * 3];
		in5 += (in4 = in[inbufPos+4 * 3]);
		in4 += (in3 = in[inbufPos+3 * 3]);
		in3 += (in2 = in[inbufPos+2 * 3]);
		in2 += (in1 = in[inbufPos+1 * 3]);
		in1 += (in0 = in[inbufPos+0 * 3]);

		in5 += in3;
		in3 += in1;

		in2 *= COS6_1;
		in3 *= COS6_1;
		}		
		{
		  float tmp0,tmp1 = (in0 - in4);
		  {
		    float tmp2 = (in1 - in5) * tfcos12[1];
		    tmp0 = tmp1 + tmp2;
		    tmp1 -= tmp2;
		  }
		  ts[tsPos+(17-1)*MPG123.SBLIMIT] = out1[out1Pos+17-1] + tmp0 * wi[11-1];
		  ts[tsPos+(12+1)*MPG123.SBLIMIT] = out1[out1Pos+12+1] + tmp0 * wi[6+1];
		  ts[tsPos+(6 +1)*MPG123.SBLIMIT] = out1[out1Pos+6 +1] + tmp1 * wi[1];
		  ts[tsPos+(11-1)*MPG123.SBLIMIT] = out1[out1Pos+11-1] + tmp1 * wi[5-1];
		}
		
//		DCT12_PART2
		{
		in0 += in4 * COS6_2; 
        
		in4 = in0 + in2;     
		in0 -= in2;          
		        
		in1 += in5 * COS6_2; 
		        
		in5 = (in1 + in3) * tfcos12[0]; 
		in1 = (in1 - in3) * tfcos12[2]; 
		       
		in3 = in4 + in5;    
		in4 -= in5;         
		       
		in2 = in0 + in1;    
		in0 -= in1;
		}		
		ts[tsPos+(17-0)*MPG123.SBLIMIT] = out1[out1Pos+17-0] + in2 * wi[11-0];
		ts[tsPos+(12+0)*MPG123.SBLIMIT] = out1[out1Pos+12+0] + in2 * wi[6+0];
		ts[tsPos+(12+2)*MPG123.SBLIMIT] = out1[out1Pos+12+2] + in3 * wi[6+2];
		ts[tsPos+(17-2)*MPG123.SBLIMIT] = out1[out1Pos+17-2] + in3 * wi[11-2];
		
		ts[tsPos+(6+0)*MPG123.SBLIMIT]  = out1[out1Pos+6+0] + in0 * wi[0];
		ts[tsPos+(11-0)*MPG123.SBLIMIT] = out1[out1Pos+11-0] + in0 * wi[5-0];
		ts[tsPos+(6+2)*MPG123.SBLIMIT]  = out1[out1Pos+6+2] + in4 * wi[2];
		ts[tsPos+(11-2)*MPG123.SBLIMIT] = out1[out1Pos+11-2] + in4 * wi[5-2];
		}
		
		inbufPos++;
		
		{
		float in0,in1,in2,in3,in4,in5;
		float []out2 = rawout2;
		int out2Pos = rawout2Pos;
		
//		DCT12_PART1
		{
			in5 = in[inbufPos+5 * 3];
			in5 += (in4 = in[inbufPos+4 * 3]);
			in4 += (in3 = in[inbufPos+3 * 3]);
			in3 += (in2 = in[inbufPos+2 * 3]);
			in2 += (in1 = in[inbufPos+1 * 3]);
			in1 += (in0 = in[inbufPos+0 * 3]);

			in5 += in3;
			in3 += in1;

			in2 *= COS6_1;
			in3 *= COS6_1;
			}		
		
		{
		  float tmp0,tmp1 = (in0 - in4);
		  {
		    float tmp2 = (in1 - in5) * tfcos12[1];
		    tmp0 = tmp1 + tmp2;
		    tmp1 -= tmp2;
		  }
		  out2[out2Pos+5-1] = tmp0 * wi[11-1];
		  out2[out2Pos+0+1] = tmp0 * wi[6+1];
		  ts[tsPos+(12+1)*MPG123.SBLIMIT] += tmp1 * wi[1];
		  ts[tsPos+(17-1)*MPG123.SBLIMIT] += tmp1 * wi[5-1];
		}
		
//		DCT12_PART2
		{
		in0 += in4 * COS6_2; 
        
		in4 = in0 + in2;     
		in0 -= in2;          
		        
		in1 += in5 * COS6_2; 
		        
		in5 = (in1 + in3) * tfcos12[0]; 
		in1 = (in1 - in3) * tfcos12[2]; 
		       
		in3 = in4 + in5;    
		in4 -= in5;         
		       
		in2 = in0 + in1;    
		in0 -= in1;
		}		
		
		out2[out2Pos+5-0] = in2 * wi[11-0];
		out2[out2Pos+0+0] = in2 * wi[6+0];
		out2[out2Pos+0+2] = in3 * wi[6+2];
		out2[out2Pos+5-2] = in3 * wi[11-2];
		
		ts[tsPos+(12+0)*MPG123.SBLIMIT] += in0 * wi[0];
		ts[tsPos+(17-0)*MPG123.SBLIMIT] += in0 * wi[5-0];
		ts[tsPos+(12+2)*MPG123.SBLIMIT] += in4 * wi[2];
		ts[tsPos+(17-2)*MPG123.SBLIMIT] += in4 * wi[5-2];
		}
		
		inbufPos++; 
		
		{
		float in0,in1,in2,in3,in4,in5;
		float []out2 = rawout2;
		int out2Pos = rawout2Pos;
		out2[out2Pos+12]=out2[out2Pos+13]=out2[out2Pos+14]=out2[out2Pos+15]=out2[out2Pos+16]=out2[out2Pos+17]=0.0f;
		
//		DCT12_PART1
		{
			in5 = in[inbufPos+5 * 3];
			in5 += (in4 = in[inbufPos+4 * 3]);
			in4 += (in3 = in[inbufPos+3 * 3]);
			in3 += (in2 = in[inbufPos+2 * 3]);
			in2 += (in1 = in[inbufPos+1 * 3]);
			in1 += (in0 = in[inbufPos+0 * 3]);

			in5 += in3;
			in3 += in1;

			in2 *= COS6_1;
			in3 *= COS6_1;
			}		
		
		{
		  float tmp0,tmp1 = (in0 - in4);
		  {
		    float tmp2 = (in1 - in5) * tfcos12[1];
		    tmp0 = tmp1 + tmp2;
		    tmp1 -= tmp2;
		  }
		  out2[out2Pos+11-1] = tmp0 * wi[11-1];
		  out2[out2Pos+6 +1] = tmp0 * wi[6+1];
		  out2[out2Pos+0+1] += tmp1 * wi[1];
		  out2[out2Pos+5-1] += tmp1 * wi[5-1];
		}
		
//		DCT12_PART2
		{
		in0 += in4 * COS6_2; 
        
		in4 = in0 + in2;     
		in0 -= in2;          
		        
		in1 += in5 * COS6_2; 
		        
		in5 = (in1 + in3) * tfcos12[0]; 
		in1 = (in1 - in3) * tfcos12[2]; 
		       
		in3 = in4 + in5;    
		in4 -= in5;         
		       
		in2 = in0 + in1;    
		in0 -= in1;
		}		
		
		out2[out2Pos+11-0] = in2 * wi[11-0];
		out2[out2Pos+6 +0] = in2 * wi[6+0];
		out2[out2Pos+6 +2] = in3 * wi[6+2];
		out2[out2Pos+11-2] = in3 * wi[11-2];
		
		out2[out2Pos+0+0] += in0 * wi[0];
		out2[out2Pos+5-0] += in0 * wi[5-0];
		out2[out2Pos+0+2] += in4 * wi[2];
		out2[out2Pos+5-2] += in4 * wi[5-2];
		}
	}

	/*
	 * III_hybrid
	 */
	private void
	III_hybrid(mpstr_tag mp, float fsIn[], float tsOut[],
	           int ch, gr_info_s gr_infos)
	{
	    float   []tspnt = (float []) tsOut;
	    int tspntPos = 0;
	    float block[][][] = mp.hybrid_block;
	    int    []blc = mp.hybrid_blc;
	    float   rawout1[], rawout2[];
	    int rawout1Pos, rawout2Pos;
	    int     bt;
	    int     sb = 0;

	    {
	        int     b = blc[ch];
	        rawout1 = block[b][ch];
	        rawout1Pos = 0;
	        b = -b + 1;
	        rawout2 = block[b][ch];
	        rawout2Pos = 0;
	        blc[ch] = b;
	    }


	    if (gr_infos.mixed_block_flag!=0) {
	        sb = 2;
	        dct36(fsIn, 0 * MPG123.SSLIMIT, rawout1, rawout1Pos,    rawout2, rawout2Pos,    win[0],  tspnt, tspntPos+0);
	        dct36(fsIn, 1 * MPG123.SSLIMIT, rawout1, rawout1Pos+18, rawout2, rawout2Pos+18, win1[0], tspnt, tspntPos+1);
	        rawout1Pos += 36;
	        rawout2Pos += 36;
	        tspntPos += 2;
	    }

	    bt = gr_infos.block_type;
	    if (bt == 2) {
	        for (; sb < (int) gr_infos.maxb; sb += 2, tspntPos += 2, rawout1Pos += 36, rawout2Pos += 36) {
	            dct12(fsIn, sb * MPG123.SSLIMIT,     rawout1, rawout1Pos,    rawout2, rawout2Pos,    win[2], tspnt, tspntPos+0);
	            dct12(fsIn, (sb + 1) * MPG123.SSLIMIT, rawout1, rawout1Pos+18, rawout2, rawout2Pos+18, win1[2], tspnt, tspntPos+1);
	        }
	    }
	    else {
	        for (; sb < (int) gr_infos.maxb; sb += 2, tspntPos += 2, rawout1Pos += 36, rawout2Pos += 36) {
	            dct36(fsIn, sb * MPG123.SSLIMIT,     rawout1, rawout1Pos,    rawout2, rawout2Pos,    win[bt], tspnt, tspntPos+0);
	            dct36(fsIn, (sb + 1) * MPG123.SSLIMIT, rawout1, rawout1Pos+18, rawout2, rawout2Pos+18, win1[bt], tspnt, tspntPos+1);
	        }
	    }

	    for (; sb < MPG123.SBLIMIT; sb++, tspntPos++) {
	        int     i;
	        for (i = 0; i < MPG123.SSLIMIT; i++) {
	            tspnt[tspntPos+i * MPG123.SBLIMIT] = rawout1[rawout1Pos++];
	            rawout2[rawout2Pos++] = 0.0f;
	        }
	    }
	}

	/*
	 * main layer3 handler
	 */
	private III_sideinfo sideinfo = new III_sideinfo();

	public int
	layer3_audiodata_precedesframes(mpstr_tag mp)
	{
	    int     audioDataInFrame;
	    int     framesToBacktrack;

	    /* specific to Layer 3, since Layer 1 & 2 the audio data starts at the frame that describes it. */
	    /* determine how many bytes and therefore bitstream frames the audio data precedes it's matching frame */
	    /* fprintf(stderr, "hip: main_data_begin = %d, mp.bsize %d, mp.fsizeold %d, mp.ssize %d\n",
	       sideinfo.main_data_begin, mp.bsize, mp.fsizeold, mp.ssize); */
	    /* compute the number of frames to backtrack, 4 for the header, ssize already holds the CRC */
	    /* TODO Erroneously assumes current frame is same as previous frame. */
	    audioDataInFrame = mp.bsize - 4 - mp.ssize;
	    framesToBacktrack = (sideinfo.main_data_begin + audioDataInFrame - 1) / audioDataInFrame;
	    /* fprintf(stderr, "hip: audioDataInFrame %d framesToBacktrack %d\n", audioDataInFrame, framesToBacktrack); */
	    return framesToBacktrack;
	}

	public int
	do_layer3_sideinfo(mpstr_tag mp)
	{
	    Frame fr = mp.fr;
	    int     stereo = fr.stereo;
	    int     single = fr.single;
	    int     ms_stereo;
	    int     sfreq = fr.sampling_frequency;
	    int     granules;
	    int     ch, gr, databits;

	    if (stereo == 1) {  /* stream is mono */
	        single = 0;
	    }

	    if (fr.mode == MPG123.MPG_MD_JOINT_STEREO) {
	        ms_stereo = fr.mode_ext & 0x2;
	    }
	    else
	        ms_stereo = 0;


	    if (fr.lsf!=0) {
	        granules = 1;
	        III_get_side_info_2(mp, sideinfo, stereo, ms_stereo, sfreq, single);
	    }
	    else {
	        granules = 2;
	        III_get_side_info_1(mp, sideinfo, stereo, ms_stereo, sfreq, single);
	    }

	    databits = 0;
	    for (gr = 0; gr < granules; ++gr) {
	        for (ch = 0; ch < stereo; ++ch) {
	            gr_info_s gr_infos = (sideinfo.ch[ch].gr[gr]);
	            databits += gr_infos.part2_3_length;
	        }
	    }
	    return databits - 8 * sideinfo.main_data_begin;
	}

	private float hybridIn[][]=new float[2][MPG123.SBLIMIT*MPG123.SSLIMIT];
	private float hybridOut[][]=new float[2][MPG123.SSLIMIT*MPG123.SBLIMIT];
    
	public <T>int
	do_layer3(mpstr_tag mp, T[] pcm_sample, ProcessedBytes pcm_point,
			ISynth synth, Factory<T> tFactory)
	{
	    int     gr, ch, ss, clip = 0;
	    int     scalefacs[][]=new int[2][39]; /* max 39 for short[13][3] mode, mixed: 38, long: 22 */
	    /*  struct III_sideinfo sideinfo; */
	    Frame fr = (mp.fr);
	    int     stereo = fr.stereo;
	    int     single = fr.single;
	    int     ms_stereo, i_stereo;
	    int     sfreq = fr.sampling_frequency;
	    int     stereo1, granules;

	    if (common.set_pointer(mp, (int) sideinfo.main_data_begin) == MPGLib.MP3_ERR)
	        return 0;

	    if (stereo == 1) {  /* stream is mono */
	        stereo1 = 1;
	        single = 0;
	    }
	    else if (single >= 0) /* stream is stereo, but force to mono */
	        stereo1 = 1;
	    else
	        stereo1 = 2;

	    if (fr.mode == MPG123.MPG_MD_JOINT_STEREO) {
	        ms_stereo = fr.mode_ext & 0x2;
	        i_stereo = fr.mode_ext & 0x1;
	    }
	    else
	        ms_stereo = i_stereo = 0;


	    if (fr.lsf!=0) {
	        granules = 1;
	    }
	    else {
	        granules = 2;
	    }

	    for (gr = 0; gr < granules; gr++) {

	        {
	            gr_info_s gr_infos = (sideinfo.ch[0].gr[gr]);
	            int    part2bits;

	            if (fr.lsf!=0)
	                part2bits = III_get_scale_factors_2(mp, scalefacs[0], gr_infos, 0);
	            else {
	                part2bits = III_get_scale_factors_1(mp, scalefacs[0], gr_infos);
	            }

	            if (mp.pinfo != null) {
	                int     i;
	                mp.pinfo.sfbits[gr][0] = part2bits;
	                for (i = 0; i < 39; i++)
	                    mp.pinfo.sfb_s[gr][0][i] = scalefacs[0][i];
	            }

	            /* fprintf(stderr, "calling III dequantize sample 1 gr_infos.part2_3_length %d\n", gr_infos.part2_3_length); */
	            if (III_dequantize_sample(mp, hybridIn[0], scalefacs[0], gr_infos, sfreq, part2bits)!=0)
	                return clip;
	        }
	        if (stereo == 2) {
	            gr_info_s gr_infos = (sideinfo.ch[1].gr[gr]);
	            int    part2bits;
	            if (fr.lsf!=0)
	                part2bits = III_get_scale_factors_2(mp, scalefacs[1], gr_infos, i_stereo);
	            else {
	                part2bits = III_get_scale_factors_1(mp, scalefacs[1], gr_infos);
	            }
	            if (mp.pinfo != null) {
	                int     i;
	                mp.pinfo.sfbits[gr][1] = part2bits;
	                for (i = 0; i < 39; i++)
	                    mp.pinfo.sfb_s[gr][1][i] = scalefacs[1][i];
	            }

	            /* fprintf(stderr, "calling III dequantize sample 2  gr_infos.part2_3_length %d\n", gr_infos.part2_3_length); */
	            if (III_dequantize_sample(mp, hybridIn[1], scalefacs[1], gr_infos, sfreq, part2bits)!=0)
	                return clip;

	            if (ms_stereo!=0) {
	                int     i;
	                for (i = 0; i < MPG123.SBLIMIT * MPG123.SSLIMIT; i++) {
	                    float    tmp0, tmp1;
	                    tmp0 = ((float []) hybridIn[0])[i];
	                    tmp1 = ((float []) hybridIn[1])[i];
	                    ((float []) hybridIn[1])[i] = tmp0 - tmp1;
	                    ((float []) hybridIn[0])[i] = tmp0 + tmp1;
	                }
	            }

	            if (i_stereo!=0)
	                III_i_stereo(hybridIn, scalefacs[1], gr_infos, sfreq, ms_stereo, fr.lsf);

	            if (ms_stereo!=0 || i_stereo!=0 || (single == 3)) {
	                if (gr_infos.maxb > sideinfo.ch[0].gr[gr].maxb)
	                    sideinfo.ch[0].gr[gr].maxb = gr_infos.maxb;
	                else
	                    gr_infos.maxb = sideinfo.ch[0].gr[gr].maxb;
	            }

	            switch (single) {
	            case 3:
	                {
	                    int     i;
	                    float   in0[] = (float []) hybridIn[0], in1[] = (float []) hybridIn[1];
	                    int in0Pos = 0, in1Pos = 0;
	                    for (i = 0; i < (int) (MPG123.SSLIMIT * gr_infos.maxb); i++, in0Pos++)
	                        in0[in0Pos] = (in0[in0Pos] + in1[in1Pos++]); /* *0.5 done by pow-scale */
	                }
	                break;
	            case 1:
	                {
	                    int     i;
	                    float   in0[] = (float []) hybridIn[0], in1[] = (float []) hybridIn[1];
	                    int in0Pos = 0, in1Pos = 0;
	                    for (i = 0; i < (int) (MPG123.SSLIMIT * gr_infos.maxb); i++)
	                    	in0[in0Pos++] = in1[in1Pos++];
	                }
	                break;
	            }
	        }

	        if (mp.pinfo != null) {
	            int     i, sb;
	            float   ifqstep;

	            mp.pinfo.bitrate = Common.tabsel_123[fr.lsf][fr.lay - 1][fr.bitrate_index];
	            mp.pinfo.sampfreq = Common.freqs[sfreq];
	            mp.pinfo.emph = fr.emphasis;
	            mp.pinfo.crc = fr.error_protection?1:0;
	            mp.pinfo.padding = fr.padding;
	            mp.pinfo.stereo = fr.stereo;
	            mp.pinfo.js = (fr.mode == MPG123.MPG_MD_JOINT_STEREO)?1:0;
	            mp.pinfo.ms_stereo = ms_stereo;
	            mp.pinfo.i_stereo = i_stereo;
	            mp.pinfo.maindata = sideinfo.main_data_begin;

	            for (ch = 0; ch < stereo1; ch++) {
	                gr_info_s gr_infos = (sideinfo.ch[ch].gr[gr]);
	                mp.pinfo.big_values[gr][ch] = gr_infos.big_values;
	                mp.pinfo.scalefac_scale[gr][ch] = gr_infos.scalefac_scale;
	                mp.pinfo.mixed[gr][ch] = gr_infos.mixed_block_flag;
	                mp.pinfo.mpg123blocktype[gr][ch] = gr_infos.block_type;
	                mp.pinfo.mainbits[gr][ch] = gr_infos.part2_3_length;
	                mp.pinfo.preflag[gr][ch] = gr_infos.preflag;
	                if (gr == 1)
	                    mp.pinfo.scfsi[ch] = gr_infos.scfsi;
	            }


	            for (ch = 0; ch < stereo1; ch++) {
	                gr_info_s gr_infos = (sideinfo.ch[ch].gr[gr]);
	                ifqstep = (mp.pinfo.scalefac_scale[gr][ch] == 0) ? .5f : 1.0f;
	                if (2 == gr_infos.block_type) {
	                    for (i = 0; i < 3; i++) {
	                        for (sb = 0; sb < 12; sb++) {
	                            int     j = 3 * sb + i;
	                            /*
	                               is_p = scalefac[sfb*3+lwin-gr_infos.mixed_block_flag]; 
	                             */
	                            /* scalefac was copied into pinfo.sfb_s[] above */
	                            mp.pinfo.sfb_s[gr][ch][j] =
	                                -ifqstep * mp.pinfo.sfb_s[gr][ch][j - gr_infos.mixed_block_flag];
	                            mp.pinfo.sfb_s[gr][ch][j] -= 2 * (mp.pinfo.sub_gain[gr][ch][i]);
	                        }
	                        mp.pinfo.sfb_s[gr][ch][3 * sb + i] =
	                            -2 * (mp.pinfo.sub_gain[gr][ch][i]);
	                    }
	                }
	                else {
	                    for (sb = 0; sb < 21; sb++) {
	                        /* scalefac was copied into pinfo.sfb[] above */
	                        mp.pinfo.sfb[gr][ch][sb] = mp.pinfo.sfb_s[gr][ch][sb];
	                        if (gr_infos.preflag!=0)
	                            mp.pinfo.sfb[gr][ch][sb] += pretab1[sb];
	                        mp.pinfo.sfb[gr][ch][sb] *= -ifqstep;
	                    }
	                    mp.pinfo.sfb[gr][ch][21] = 0;
	                }
	            }



	            for (ch = 0; ch < stereo1; ch++) {
	                int     j = 0;
	                for (sb = 0; sb < MPG123.SBLIMIT; sb++)
	                    for (ss = 0; ss < MPG123.SSLIMIT; ss++, j++)
	                        mp.pinfo.mpg123xr[gr][ch][j] = hybridIn[ch][sb*MPG123.SSLIMIT+ss];
	            }
	        }


	        for (ch = 0; ch < stereo1; ch++) {
	            gr_info_s gr_infos = (sideinfo.ch[ch].gr[gr]);
	            III_antialias(hybridIn[ch], gr_infos);
	            III_hybrid(mp, hybridIn[ch], hybridOut[ch], ch, gr_infos);
	        }

	        for (ss = 0; ss < MPG123.SSLIMIT; ss++) {
	            if (single >= 0) {
	            	clip += synth.synth_1to1_mono_ptr(mp, hybridOut[0], ss*MPG123.SBLIMIT, pcm_sample, pcm_point, tFactory);
	            }
	            else {
	            	ProcessedBytes p1 = new ProcessedBytes();
	            	p1.pb = pcm_point.pb;
	            	clip += synth.synth_1to1_ptr(mp, hybridOut[0], ss*MPG123.SBLIMIT, 0, pcm_sample, p1, tFactory);
	            	clip += synth.synth_1to1_ptr(mp, hybridOut[1], ss*MPG123.SBLIMIT, 1, pcm_sample, pcm_point, tFactory);
	            }
	        }
	    }

	    return clip;
	}

}
