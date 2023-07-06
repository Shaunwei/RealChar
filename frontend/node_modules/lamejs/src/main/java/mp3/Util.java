/*
 *      lame utility library include file
 *
 *      Copyright (c) 1999 Albert L Faber
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

/* $Id: Util.java,v 1.16 2011/05/24 21:27:00 kenchis Exp $ */

package mp3;


public class Util {

    public static final float SQRT2 = 1.41421356237309504880f;

	public static float FAST_LOG10(float x) {
		return (float) Math.log10(x);
	}
	public static float FAST_LOG10_X(float x,float y) {
		return (float) Math.log10(x)*y;
	}

}
