/*
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	 See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 *
 * Layer 2 Alloc tables .. 
 * most other tables are calculated on program start (which is (of course)
 * not ISO-conform) .. 
 * Layer-3 huffman table is in huffman.h
 */
package mpg;


public class L2Tables {

	public static final class al_table2 {
		public al_table2(final int b, final int d) {
			this.bits = (short) b;
			this.d = (short) d;
		}

		short bits;
		short d;
	};

	public static final al_table2 alloc_0[] = {
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(3, -3), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255), new al_table2(10,
            -511),
		new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(3, -3), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255), new al_table2(10,
		            -511),
		new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(3, -3), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255), new al_table2(10,
		            -511),
		new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767)
	};

	public static final al_table2 alloc_1[] = {
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(3, -3), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255), new al_table2(10,
            -511),
		new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(3, -3), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255), new al_table2(10,
		                -511),
		new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(3, -3), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255), new al_table2(10,
		                -511),
		new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
		new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767),
		new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(16, -32767)
	};

	public static final al_table2 alloc_2[] = {
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255),
	    new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383),
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255),
	    new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63)
	};

	public static final al_table2 alloc_3[] = {
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255),
	    new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383),
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127), new al_table2(9, -255),
	    new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191), new al_table2(15, -16383),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63)
	};

	public static final al_table2 alloc_4[] = {
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
	    new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191),
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
	    new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191),
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
	    new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191),
	    new al_table2(4, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(3, -3), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63), new al_table2(8, -127),
	    new al_table2(9, -255), new al_table2(10, -511), new al_table2(11, -1023), new al_table2(12, -2047), new al_table2(13, -4095), new al_table2(14, -8191),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(3, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9), new al_table2(4, -7), new al_table2(5, -15), new al_table2(6, -31), new al_table2(7, -63),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9),
	    new al_table2(2, 0), new al_table2(5, 3), new al_table2(7, 5), new al_table2(10, 9)
	};
}
