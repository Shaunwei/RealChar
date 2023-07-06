/*
 *      GTK plotting routines source file
 *
 *      Copyright (c) 1999 Mark Taylor
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
package mp3;

/**
 * used by the frame analyzer
 */
public class PlottingData {
	/**
	 * current frame number
	 */
	int frameNum;
	int frameNum123;
	/**
	 * number of pcm samples read for this frame
	 */
	int num_samples;
	/**
	 * starting time of frame, in seconds
	 */
	double frametime;
	double pcmdata[][] = new double[2][1600];
	double pcmdata2[][] = new double[2][1152 + 1152 - Encoder.DECDELAY];
	double xr[][][] = new double[2][2][576];
	public double mpg123xr[][][] = new double[2][2][576];
	double ms_ratio[] = new double[2];
	double ms_ener_ratio[] = new double[2];

	/* L,R, M and S values */
	
	/**
	 * psymodel is one ahead
	 */
	double energy_save[][] = new double[4][Encoder.BLKSIZE];
	double energy[][][] = new double[2][4][Encoder.BLKSIZE];
	double pe[][] = new double[2][4];
	double thr[][][] = new double[2][4][Encoder.SBMAX_l];
	double en[][][] = new double[2][4][Encoder.SBMAX_l];
	double thr_s[][][] = new double[2][4][3 * Encoder.SBMAX_s];
	double en_s[][][] = new double[2][4][3 * Encoder.SBMAX_s];
	/**
	 * psymodel is one ahead
	 */
	double ers_save[] = new double[4];
	double ers[][] = new double[2][4];

	public double sfb[][][] = new double[2][2][Encoder.SBMAX_l];
	public double sfb_s[][][] = new double[2][2][3 * Encoder.SBMAX_s];
	double LAMEsfb[][][] = new double[2][2][Encoder.SBMAX_l];
	double LAMEsfb_s[][][] = new double[2][2][3 * Encoder.SBMAX_s];

	int LAMEqss[][] = new int[2][2];
	public int qss[][] = new int[2][2];
	public int big_values[][] = new int[2][2];
	public int sub_gain[][][] = new int[2][2][3];

	double xfsf[][][] = new double[2][2][Encoder.SBMAX_l];
	double xfsf_s[][][] = new double[2][2][3 * Encoder.SBMAX_s];

	int over[][] = new int[2][2];
	double tot_noise[][] = new double[2][2];
	double max_noise[][] = new double[2][2];
	double over_noise[][] = new double[2][2];
	int over_SSD[][] = new int[2][2];
	int blocktype[][] = new int[2][2];
	public int scalefac_scale[][] = new int[2][2];
	public int preflag[][] = new int[2][2];
	public int mpg123blocktype[][] = new int[2][2];
	public int mixed[][] = new int[2][2];
	public int mainbits[][] = new int[2][2];
	public int sfbits[][] = new int[2][2];
	int LAMEmainbits[][] = new int[2][2];
	int LAMEsfbits[][] = new int[2][2];
	public int framesize, stereo, js, ms_stereo, i_stereo, emph, bitrate,
			sampfreq, maindata;
	public int crc, padding;
	public int scfsi[] = new int[2], mean_bits, resvsize;
	int totbits;
}