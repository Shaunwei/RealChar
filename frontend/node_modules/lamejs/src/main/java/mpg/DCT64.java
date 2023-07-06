/*
 * dct64_i368.c
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
 *
 *
 * Discrete Cosine Tansform (DCT) for subband synthesis
 * optimized for machines with no auto-increment. 
 * The performance is highly compiler dependend. Maybe
 * the dct64.c version for 'normal' processor may be faster
 * even for Intel processors.
 */

/* $Id: DCT64.java,v 1.7 2011/05/31 03:33:59 kenchis Exp $ */

package mpg;

public class DCT64 {

	private TabInit tabInit;
	
	public void setModules(final TabInit ti) {
		tabInit = ti;
	}
	
	private void dct64_1(float[] out0, int out0Pos, float[] out1, int out1Pos,
			float[] b1, int b2, float[] samples, int samplesPos) {

	    {
	        float[]costab = tabInit.pnts[0];

	        b1[0x00] = samples[samplesPos+0x00] + samples[samplesPos+0x1F];
	        b1[0x1F] = (samples[samplesPos+0x00] - samples[samplesPos+0x1F]) * costab[0x0];

	        b1[0x01] = samples[samplesPos+0x01] + samples[samplesPos+0x1E];
	        b1[0x1E] = (samples[samplesPos+0x01] - samples[samplesPos+0x1E]) * costab[0x1];

	        b1[0x02] = samples[samplesPos+0x02] + samples[samplesPos+0x1D];
	        b1[0x1D] = (samples[samplesPos+0x02] - samples[samplesPos+0x1D]) * costab[0x2];

	        b1[0x03] = samples[samplesPos+0x03] + samples[samplesPos+0x1C];
	        b1[0x1C] = (samples[samplesPos+0x03] - samples[samplesPos+0x1C]) * costab[0x3];

	        b1[0x04] = samples[samplesPos+0x04] + samples[samplesPos+0x1B];
	        b1[0x1B] = (samples[samplesPos+0x04] - samples[samplesPos+0x1B]) * costab[0x4];

	        b1[0x05] = samples[samplesPos+0x05] + samples[samplesPos+0x1A];
	        b1[0x1A] = (samples[samplesPos+0x05] - samples[samplesPos+0x1A]) * costab[0x5];

	        b1[0x06] = samples[samplesPos+0x06] + samples[samplesPos+0x19];
	        b1[0x19] = (samples[samplesPos+0x06] - samples[samplesPos+0x19]) * costab[0x6];

	        b1[0x07] = samples[samplesPos+0x07] + samples[samplesPos+0x18];
	        b1[0x18] = (samples[samplesPos+0x07] - samples[samplesPos+0x18]) * costab[0x7];

	        b1[0x08] = samples[samplesPos+0x08] + samples[samplesPos+0x17];
	        b1[0x17] = (samples[samplesPos+0x08] - samples[samplesPos+0x17]) * costab[0x8];

	        b1[0x09] = samples[samplesPos+0x09] + samples[samplesPos+0x16];
	        b1[0x16] = (samples[samplesPos+0x09] - samples[samplesPos+0x16]) * costab[0x9];

	        b1[0x0A] = samples[samplesPos+0x0A] + samples[samplesPos+0x15];
	        b1[0x15] = (samples[samplesPos+0x0A] - samples[samplesPos+0x15]) * costab[0xA];

	        b1[0x0B] = samples[samplesPos+0x0B] + samples[samplesPos+0x14];
	        b1[0x14] = (samples[samplesPos+0x0B] - samples[samplesPos+0x14]) * costab[0xB];

	        b1[0x0C] = samples[samplesPos+0x0C] + samples[samplesPos+0x13];
	        b1[0x13] = (samples[samplesPos+0x0C] - samples[samplesPos+0x13]) * costab[0xC];

	        b1[0x0D] = samples[samplesPos+0x0D] + samples[samplesPos+0x12];
	        b1[0x12] = (samples[samplesPos+0x0D] - samples[samplesPos+0x12]) * costab[0xD];

	        b1[0x0E] = samples[samplesPos+0x0E] + samples[samplesPos+0x11];
	        b1[0x11] = (samples[samplesPos+0x0E] - samples[samplesPos+0x11]) * costab[0xE];

	        b1[0x0F] = samples[samplesPos+0x0F] + samples[samplesPos+0x10];
	        b1[0x10] = (samples[samplesPos+0x0F] - samples[samplesPos+0x10]) * costab[0xF];
	    }


	    {
	        float[] costab = tabInit.pnts[1];

	        b1[b2 + 0x00] = b1[0x00] + b1[0x0F];
	        b1[b2 + 0x0F] = (b1[0x00] - b1[0x0F]) * costab[0];
	        b1[b2 + 0x01] = b1[0x01] + b1[0x0E];
	        b1[b2 + 0x0E] = (b1[0x01] - b1[0x0E]) * costab[1];
	        b1[b2 + 0x02] = b1[0x02] + b1[0x0D];
	        b1[b2 + 0x0D] = (b1[0x02] - b1[0x0D]) * costab[2];
	        b1[b2 + 0x03] = b1[0x03] + b1[0x0C];
	        b1[b2 + 0x0C] = (b1[0x03] - b1[0x0C]) * costab[3];
	        b1[b2 + 0x04] = b1[0x04] + b1[0x0B];
	        b1[b2 + 0x0B] = (b1[0x04] - b1[0x0B]) * costab[4];
	        b1[b2 + 0x05] = b1[0x05] + b1[0x0A];
	        b1[b2 + 0x0A] = (b1[0x05] - b1[0x0A]) * costab[5];
	        b1[b2 + 0x06] = b1[0x06] + b1[0x09];
	        b1[b2 + 0x09] = (b1[0x06] - b1[0x09]) * costab[6];
	        b1[b2 + 0x07] = b1[0x07] + b1[0x08];
	        b1[b2 + 0x08] = (b1[0x07] - b1[0x08]) * costab[7];

	        b1[b2 + 0x10] = b1[0x10] + b1[0x1F];
	        b1[b2 + 0x1F] = (b1[0x1F] - b1[0x10]) * costab[0];
	        b1[b2 + 0x11] = b1[0x11] + b1[0x1E];
	        b1[b2 + 0x1E] = (b1[0x1E] - b1[0x11]) * costab[1];
	        b1[b2 + 0x12] = b1[0x12] + b1[0x1D];
	        b1[b2 + 0x1D] = (b1[0x1D] - b1[0x12]) * costab[2];
	        b1[b2 + 0x13] = b1[0x13] + b1[0x1C];
	        b1[b2 + 0x1C] = (b1[0x1C] - b1[0x13]) * costab[3];
	        b1[b2 + 0x14] = b1[0x14] + b1[0x1B];
	        b1[b2 + 0x1B] = (b1[0x1B] - b1[0x14]) * costab[4];
	        b1[b2 + 0x15] = b1[0x15] + b1[0x1A];
	        b1[b2 + 0x1A] = (b1[0x1A] - b1[0x15]) * costab[5];
	        b1[b2 + 0x16] = b1[0x16] + b1[0x19];
	        b1[b2 + 0x19] = (b1[0x19] - b1[0x16]) * costab[6];
	        b1[b2 + 0x17] = b1[0x17] + b1[0x18];
	        b1[b2 + 0x18] = (b1[0x18] - b1[0x17]) * costab[7];
	    }

	    {
	        float[] costab = tabInit.pnts[2];

	        b1[0x00] = b1[b2 + 0x00] + b1[b2 + 0x07];
	        b1[0x07] = (b1[b2 + 0x00] - b1[b2 + 0x07]) * costab[0];
	        b1[0x01] = b1[b2 + 0x01] + b1[b2 + 0x06];
	        b1[0x06] = (b1[b2 + 0x01] - b1[b2 + 0x06]) * costab[1];
	        b1[0x02] = b1[b2 + 0x02] + b1[b2 + 0x05];
	        b1[0x05] = (b1[b2 + 0x02] - b1[b2 + 0x05]) * costab[2];
	        b1[0x03] = b1[b2 + 0x03] + b1[b2 + 0x04];
	        b1[0x04] = (b1[b2 + 0x03] - b1[b2 + 0x04]) * costab[3];

	        b1[0x08] = b1[b2 + 0x08] + b1[b2 + 0x0F];
	        b1[0x0F] = (b1[b2 + 0x0F] - b1[b2 + 0x08]) * costab[0];
	        b1[0x09] = b1[b2 + 0x09] + b1[b2 + 0x0E];
	        b1[0x0E] = (b1[b2 + 0x0E] - b1[b2 + 0x09]) * costab[1];
	        b1[0x0A] = b1[b2 + 0x0A] + b1[b2 + 0x0D];
	        b1[0x0D] = (b1[b2 + 0x0D] - b1[b2 + 0x0A]) * costab[2];
	        b1[0x0B] = b1[b2 + 0x0B] + b1[b2 + 0x0C];
	        b1[0x0C] = (b1[b2 + 0x0C] - b1[b2 + 0x0B]) * costab[3];

	        b1[0x10] = b1[b2 + 0x10] + b1[b2 + 0x17];
	        b1[0x17] = (b1[b2 + 0x10] - b1[b2 + 0x17]) * costab[0];
	        b1[0x11] = b1[b2 + 0x11] + b1[b2 + 0x16];
	        b1[0x16] = (b1[b2 + 0x11] - b1[b2 + 0x16]) * costab[1];
	        b1[0x12] = b1[b2 + 0x12] + b1[b2 + 0x15];
	        b1[0x15] = (b1[b2 + 0x12] - b1[b2 + 0x15]) * costab[2];
	        b1[0x13] = b1[b2 + 0x13] + b1[b2 + 0x14];
	        b1[0x14] = (b1[b2 + 0x13] - b1[b2 + 0x14]) * costab[3];

	        b1[0x18] = b1[b2 + 0x18] + b1[b2 + 0x1F];
	        b1[0x1F] = (b1[b2 + 0x1F] - b1[b2 + 0x18]) * costab[0];
	        b1[0x19] = b1[b2 + 0x19] + b1[b2 + 0x1E];
	        b1[0x1E] = (b1[b2 + 0x1E] - b1[b2 + 0x19]) * costab[1];
	        b1[0x1A] = b1[b2 + 0x1A] + b1[b2 + 0x1D];
	        b1[0x1D] = (b1[b2 + 0x1D] - b1[b2 + 0x1A]) * costab[2];
	        b1[0x1B] = b1[b2 + 0x1B] + b1[b2 + 0x1C];
	        b1[0x1C] = (b1[b2 + 0x1C] - b1[b2 + 0x1B]) * costab[3];
	    }

	    {
	        final float cos0 = tabInit.pnts[3][0];
	        final float cos1 = tabInit.pnts[3][1];

	        b1[b2 + 0x00] = b1[0x00] + b1[0x03];
	        b1[b2 + 0x03] = (b1[0x00] - b1[0x03]) * cos0;
	        b1[b2 + 0x01] = b1[0x01] + b1[0x02];
	        b1[b2 + 0x02] = (b1[0x01] - b1[0x02]) * cos1;

	        b1[b2 + 0x04] = b1[0x04] + b1[0x07];
	        b1[b2 + 0x07] = (b1[0x07] - b1[0x04]) * cos0;
	        b1[b2 + 0x05] = b1[0x05] + b1[0x06];
	        b1[b2 + 0x06] = (b1[0x06] - b1[0x05]) * cos1;

	        b1[b2 + 0x08] = b1[0x08] + b1[0x0B];
	        b1[b2 + 0x0B] = (b1[0x08] - b1[0x0B]) * cos0;
	        b1[b2 + 0x09] = b1[0x09] + b1[0x0A];
	        b1[b2 + 0x0A] = (b1[0x09] - b1[0x0A]) * cos1;

	        b1[b2 + 0x0C] = b1[0x0C] + b1[0x0F];
	        b1[b2 + 0x0F] = (b1[0x0F] - b1[0x0C]) * cos0;
	        b1[b2 + 0x0D] = b1[0x0D] + b1[0x0E];
	        b1[b2 + 0x0E] = (b1[0x0E] - b1[0x0D]) * cos1;

	        b1[b2 + 0x10] = b1[0x10] + b1[0x13];
	        b1[b2 + 0x13] = (b1[0x10] - b1[0x13]) * cos0;
	        b1[b2 + 0x11] = b1[0x11] + b1[0x12];
	        b1[b2 + 0x12] = (b1[0x11] - b1[0x12]) * cos1;

	        b1[b2 + 0x14] = b1[0x14] + b1[0x17];
	        b1[b2 + 0x17] = (b1[0x17] - b1[0x14]) * cos0;
	        b1[b2 + 0x15] = b1[0x15] + b1[0x16];
	        b1[b2 + 0x16] = (b1[0x16] - b1[0x15]) * cos1;

	        b1[b2 + 0x18] = b1[0x18] + b1[0x1B];
	        b1[b2 + 0x1B] = (b1[0x18] - b1[0x1B]) * cos0;
	        b1[b2 + 0x19] = b1[0x19] + b1[0x1A];
	        b1[b2 + 0x1A] = (b1[0x19] - b1[0x1A]) * cos1;

	        b1[b2 + 0x1C] = b1[0x1C] + b1[0x1F];
	        b1[b2 + 0x1F] = (b1[0x1F] - b1[0x1C]) * cos0;
	        b1[b2 + 0x1D] = b1[0x1D] + b1[0x1E];
	        b1[b2 + 0x1E] = (b1[0x1E] - b1[0x1D]) * cos1;
	    }

	    {
	    	final float cos0 = tabInit.pnts[4][0];

	        b1[0x00] = b1[b2 + 0x00] + b1[b2 + 0x01];
	        b1[0x01] = (b1[b2 + 0x00] - b1[b2 + 0x01]) * cos0;
	        b1[0x02] = b1[b2 + 0x02] + b1[b2 + 0x03];
	        b1[0x03] = (b1[b2 + 0x03] - b1[b2 + 0x02]) * cos0;
	        b1[0x02] += b1[0x03];

	        b1[0x04] = b1[b2 + 0x04] + b1[b2 + 0x05];
	        b1[0x05] = (b1[b2 + 0x04] - b1[b2 + 0x05]) * cos0;
	        b1[0x06] = b1[b2 + 0x06] + b1[b2 + 0x07];
	        b1[0x07] = (b1[b2 + 0x07] - b1[b2 + 0x06]) * cos0;
	        b1[0x06] += b1[0x07];
	        b1[0x04] += b1[0x06];
	        b1[0x06] += b1[0x05];
	        b1[0x05] += b1[0x07];

	        b1[0x08] = b1[b2 + 0x08] + b1[b2 + 0x09];
	        b1[0x09] = (b1[b2 + 0x08] - b1[b2 + 0x09]) * cos0;
	        b1[0x0A] = b1[b2 + 0x0A] + b1[b2 + 0x0B];
	        b1[0x0B] = (b1[b2 + 0x0B] - b1[b2 + 0x0A]) * cos0;
	        b1[0x0A] += b1[0x0B];

	        b1[0x0C] = b1[b2 + 0x0C] + b1[b2 + 0x0D];
	        b1[0x0D] = (b1[b2 + 0x0C] - b1[b2 + 0x0D]) * cos0;
	        b1[0x0E] = b1[b2 + 0x0E] + b1[b2 + 0x0F];
	        b1[0x0F] = (b1[b2 + 0x0F] - b1[b2 + 0x0E]) * cos0;
	        b1[0x0E] += b1[0x0F];
	        b1[0x0C] += b1[0x0E];
	        b1[0x0E] += b1[0x0D];
	        b1[0x0D] += b1[0x0F];

	        b1[0x10] = b1[b2 + 0x10] + b1[b2 + 0x11];
	        b1[0x11] = (b1[b2 + 0x10] - b1[b2 + 0x11]) * cos0;
	        b1[0x12] = b1[b2 + 0x12] + b1[b2 + 0x13];
	        b1[0x13] = (b1[b2 + 0x13] - b1[b2 + 0x12]) * cos0;
	        b1[0x12] += b1[0x13];

	        b1[0x14] = b1[b2 + 0x14] + b1[b2 + 0x15];
	        b1[0x15] = (b1[b2 + 0x14] - b1[b2 + 0x15]) * cos0;
	        b1[0x16] = b1[b2 + 0x16] + b1[b2 + 0x17];
	        b1[0x17] = (b1[b2 + 0x17] - b1[b2 + 0x16]) * cos0;
	        b1[0x16] += b1[0x17];
	        b1[0x14] += b1[0x16];
	        b1[0x16] += b1[0x15];
	        b1[0x15] += b1[0x17];

	        b1[0x18] = b1[b2 + 0x18] + b1[b2 + 0x19];
	        b1[0x19] = (b1[b2 + 0x18] - b1[b2 + 0x19]) * cos0;
	        b1[0x1A] = b1[b2 + 0x1A] + b1[b2 + 0x1B];
	        b1[0x1B] = (b1[b2 + 0x1B] - b1[b2 + 0x1A]) * cos0;
	        b1[0x1A] += b1[0x1B];

	        b1[0x1C] = b1[b2 + 0x1C] + b1[b2 + 0x1D];
	        b1[0x1D] = (b1[b2 + 0x1C] - b1[b2 + 0x1D]) * cos0;
	        b1[0x1E] = b1[b2 + 0x1E] + b1[b2 + 0x1F];
	        b1[0x1F] = (b1[b2 + 0x1F] - b1[b2 + 0x1E]) * cos0;
	        b1[0x1E] += b1[0x1F];
	        b1[0x1C] += b1[0x1E];
	        b1[0x1E] += b1[0x1D];
	        b1[0x1D] += b1[0x1F];
	    }

	    out0[out0Pos+(0x10 * 16)] = b1[0x00];
	    out0[out0Pos+(0x10 * 12)] = b1[0x04];
	    out0[out0Pos+(0x10 * 8)] = b1[0x02];
	    out0[out0Pos+(0x10 * 4)] = b1[0x06];
	    out0[out0Pos+(0x10 * 0)] = b1[0x01];
	    out1[out1Pos+(0x10 * 0)] = b1[0x01];
	    out1[out1Pos+(0x10 * 4)] = b1[0x05];
	    out1[out1Pos+(0x10 * 8)] = b1[0x03];
	    out1[out1Pos+(0x10 * 12)] = b1[0x07];

	    b1[0x08] += b1[0x0C];
	    out0[out0Pos+(0x10 * 14)] = b1[0x08];
	    b1[0x0C] += b1[0x0a];
	    out0[out0Pos+(0x10 * 10)] = b1[0x0C];
	    b1[0x0A] += b1[0x0E];
	    out0[out0Pos+(0x10 * 6)] = b1[0x0A];
	    b1[0x0E] += b1[0x09];
	    out0[out0Pos+(0x10 * 2)] = b1[0x0E];
	    b1[0x09] += b1[0x0D];
	    out1[out1Pos+(0x10 * 2)] = b1[0x09];
	    b1[0x0D] += b1[0x0B];
	    out1[out1Pos+(0x10 * 6)] = b1[0x0D];
	    b1[0x0B] += b1[0x0F];
	    out1[out1Pos+(0x10 * 10)] = b1[0x0B];
	    out1[out1Pos+(0x10 * 14)] = b1[0x0F];

	    b1[0x18] += b1[0x1C];
	    out0[out0Pos+(0x10 * 15)] = b1[0x10] + b1[0x18];
	    out0[out0Pos+(0x10 * 13)] = b1[0x18] + b1[0x14];
	    b1[0x1C] += b1[0x1a];
	    out0[out0Pos+(0x10 * 11)] = b1[0x14] + b1[0x1C];
	    out0[out0Pos+(0x10 * 9)] = b1[0x1C] + b1[0x12];
	    b1[0x1A] += b1[0x1E];
	    out0[out0Pos+(0x10 * 7)] = b1[0x12] + b1[0x1A];
	    out0[out0Pos+(0x10 * 5)] = b1[0x1A] + b1[0x16];
	    b1[0x1E] += b1[0x19];
	    out0[out0Pos+(0x10 * 3)] = b1[0x16] + b1[0x1E];
	    out0[out0Pos+(0x10 * 1)] = b1[0x1E] + b1[0x11];
	    b1[0x19] += b1[0x1D];
	    out1[out1Pos+(0x10 * 1)] = b1[0x11] + b1[0x19];
	    out1[out1Pos+(0x10 * 3)] = b1[0x19] + b1[0x15];
	    b1[0x1D] += b1[0x1B];
	    out1[out1Pos+(0x10 * 5)] = b1[0x15] + b1[0x1D];
	    out1[out1Pos+(0x10 * 7)] = b1[0x1D] + b1[0x13];
	    b1[0x1B] += b1[0x1F];
	    out1[out1Pos+(0x10 * 9)] = b1[0x13] + b1[0x1B];
	    out1[out1Pos+(0x10 * 11)] = b1[0x1B] + b1[0x17];
	    out1[out1Pos+(0x10 * 13)] = b1[0x17] + b1[0x1F];
	    out1[out1Pos+(0x10 * 15)] = b1[0x1F];
	}

	/*
	 * the call via dct64 is a trick to force GCC to use
	 * (new) registers for the b1,b2 pointer to the bufs[xx] field
	 */
	public void dct64(float[] a, int aPos, float[] b, int bPos, float[] c,
			int cPos) {
		float bufs[] = new float[0x40];
		dct64_1(a, aPos, b, bPos, bufs, 0x20, c, cPos);
	}
}
