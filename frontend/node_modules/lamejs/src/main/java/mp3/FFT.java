/*
** FFT and FHT routines
**  Copyright 1988, 1993; Ron Mayer
**      Copyright (c) 1999-2000 Takehiro Tominaga
**
**  fht(fz,n);
**      Does a hartley transform of "n" points in the array "fz".
**
** NOTE: This routine uses at least 2 patented algorithms, and may be
**       under the restrictions of a bunch of different organizations.
**       Although I wrote it completely myself; it is kind of a derivative
**       of a routine I once authored and released under the GPL, so it
**       may fall under the free software foundation's restrictions;
**       it was worked on as a Stanford Univ project, so they claim
**       some rights to it; it was further optimized at work here, so
**       I think this company claims parts of it.  The patents are
**       held by R. Bracewell (the FHT algorithm) and O. Buneman (the
**       trig generator), both at Stanford Univ.
**       If it were up to me, I'd say go do whatever you want with it;
**       but it would be polite to give credit to the following people
**       if you use this anywhere:
**           Euler     - probable inventor of the fourier transform.
**           Gauss     - probable inventor of the FFT.
**           Hartley   - probable inventor of the hartley transform.
**           Buneman   - for a really cool trig generator
**           Mayer(me) - for authoring this particular version and
**                       including all the optimizations in one package.
**       Thanks,
**       Ron Mayer; mayer@acuson.com
** and added some optimization by
**           Mather    - idea of using lookup table
**           Takehiro  - some dirty hack for speed up
*/
package mp3;


public class FFT {

	private static float window[] = new float[Encoder.BLKSIZE],
			window_s[] = new float[Encoder.BLKSIZE_s / 2];

	private static final float costab[] = {
	    9.238795325112867e-01f, 3.826834323650898e-01f,
	    9.951847266721969e-01f, 9.801714032956060e-02f,
	    9.996988186962042e-01f, 2.454122852291229e-02f,
	    9.999811752826011e-01f, 6.135884649154475e-03f
	};

	private void fht(final float[] fz, final int fzPos, int n) {
		int tri = 0;
		int k4;
		int fi;
		int gi;
		final int fn;

		n <<= 1; /* to get BLKSIZE, because of 3DNow! ASM routine */
		fn = fzPos + n;
		k4 = 4;
		do {
			float s1, c1;
			int i, k1, k2, k3, kx;
			kx = k4 >> 1;
			k1 = k4;
			k2 = k4 << 1;
			k3 = k2 + k1;
			k4 = k2 << 1;
			fi = fzPos;
			gi = fi + kx;
			do {
				float f0, f1, f2, f3;
				f1 = fz[fi + 0] - fz[fi + k1];
				f0 = fz[fi + 0] + fz[fi + k1];
				f3 = fz[fi + k2] - fz[fi + k3];
				f2 = fz[fi + k2] + fz[fi + k3];
				fz[fi + k2] = f0 - f2;
				fz[fi + 0] = f0 + f2;
				fz[fi + k3] = f1 - f3;
				fz[fi + k1] = f1 + f3;
				f1 = fz[gi + 0] - fz[gi + k1];
				f0 = fz[gi + 0] + fz[gi + k1];
				f3 = (float) (Util.SQRT2 * fz[gi + k3]);
				f2 = (float) (Util.SQRT2 * fz[gi + k2]);
				fz[gi + k2] = f0 - f2;
				fz[gi + 0] = f0 + f2;
				fz[gi + k3] = f1 - f3;
				fz[gi + k1] = f1 + f3;
				gi += k4;
				fi += k4;
			} while (fi < fn);
			c1 = costab[tri + 0];
			s1 = costab[tri + 1];
			for (i = 1; i < kx; i++) {
				float c2, s2;
				c2 = 1 - (2 * s1) * s1;
				s2 = (2 * s1) * c1;
				fi = fzPos + i;
				gi = fzPos + k1 - i;
				do {
					float a, b, g0, f0, f1, g1, f2, g2, f3, g3;
					b = s2 * fz[fi + k1] - c2 * fz[gi + k1];
					a = c2 * fz[fi + k1] + s2 * fz[gi + k1];
					f1 = fz[fi + 0] - a;
					f0 = fz[fi + 0] + a;
					g1 = fz[gi + 0] - b;
					g0 = fz[gi + 0] + b;
					b = s2 * fz[fi + k3] - c2 * fz[gi + k3];
					a = c2 * fz[fi + k3] + s2 * fz[gi + k3];
					f3 = fz[fi + k2] - a;
					f2 = fz[fi + k2] + a;
					g3 = fz[gi + k2] - b;
					g2 = fz[gi + k2] + b;
					b = s1 * f2 - c1 * g3;
					a = c1 * f2 + s1 * g3;
					fz[fi + k2] = f0 - a;
					fz[fi + 0] = f0 + a;
					fz[gi + k3] = g1 - b;
					fz[gi + k1] = g1 + b;
					b = c1 * g2 - s1 * f3;
					a = s1 * g2 + c1 * f3;
					fz[gi + k2] = g0 - a;
					fz[gi + 0] = g0 + a;
					fz[fi + k3] = f1 - b;
					fz[fi + k1] = f1 + b;
					gi += k4;
					fi += k4;
				} while (fi < fn);
				c2 = c1;
				c1 = c2 * costab[tri + 0] - s1 * costab[tri + 1];
				s1 = c2 * costab[tri + 1] + s1 * costab[tri + 0];
			}
			tri += 2;
		} while (k4 < n);
	}

	private static final byte rv_tbl[] = { 0x00, (byte) 0x80, 0x40,
			(byte) 0xc0, 0x20, (byte) 0xa0, 0x60, (byte) 0xe0, 0x10,
			(byte) 0x90, 0x50, (byte) 0xd0, 0x30, (byte) 0xb0, 0x70,
			(byte) 0xf0, 0x08, (byte) 0x88, 0x48, (byte) 0xc8, 0x28,
			(byte) 0xa8, 0x68, (byte) 0xe8, 0x18, (byte) 0x98, 0x58,
			(byte) 0xd8, 0x38, (byte) 0xb8, 0x78, (byte) 0xf8, 0x04,
			(byte) 0x84, 0x44, (byte) 0xc4, 0x24, (byte) 0xa4, 0x64,
			(byte) 0xe4, 0x14, (byte) 0x94, 0x54, (byte) 0xd4, 0x34,
			(byte) 0xb4, 0x74, (byte) 0xf4, 0x0c, (byte) 0x8c, 0x4c,
			(byte) 0xcc, 0x2c, (byte) 0xac, 0x6c, (byte) 0xec, 0x1c,
			(byte) 0x9c, 0x5c, (byte) 0xdc, 0x3c, (byte) 0xbc, 0x7c,
			(byte) 0xfc, 0x02, (byte) 0x82, 0x42, (byte) 0xc2, 0x22,
			(byte) 0xa2, 0x62, (byte) 0xe2, 0x12, (byte) 0x92, 0x52,
			(byte) 0xd2, 0x32, (byte) 0xb2, 0x72, (byte) 0xf2, 0x0a,
			(byte) 0x8a, 0x4a, (byte) 0xca, 0x2a, (byte) 0xaa, 0x6a,
			(byte) 0xea, 0x1a, (byte) 0x9a, 0x5a, (byte) 0xda, 0x3a,
			(byte) 0xba, 0x7a, (byte) 0xfa, 0x06, (byte) 0x86, 0x46,
			(byte) 0xc6, 0x26, (byte) 0xa6, 0x66, (byte) 0xe6, 0x16,
			(byte) 0x96, 0x56, (byte) 0xd6, 0x36, (byte) 0xb6, 0x76,
			(byte) 0xf6, 0x0e, (byte) 0x8e, 0x4e, (byte) 0xce, 0x2e,
			(byte) 0xae, 0x6e, (byte) 0xee, 0x1e, (byte) 0x9e, 0x5e,
			(byte) 0xde, 0x3e, (byte) 0xbe, 0x7e, (byte) 0xfe };

	public final void fft_short(final LameInternalFlags gfc,
			final float x_real[][], final int chn, final float[] buffer[],
			final int bufPos) {
		for (int b = 0; b < 3; b++) {
			int x = Encoder.BLKSIZE_s / 2;
			final short k = (short) ((576 / 3) * (b + 1));
			int j = Encoder.BLKSIZE_s / 8 - 1;
			do {
				float f0, f1, f2, f3, w;

				int i = rv_tbl[j << 2] & 0xff;

				f0 = window_s[i] * buffer[chn][bufPos + i + k];
				w = window_s[0x7f - i] * buffer[chn][bufPos + i + k + 0x80];
				f1 = f0 - w;
				f0 = f0 + w;
				f2 = window_s[i + 0x40] * buffer[chn][bufPos + i + k + 0x40];
				w = window_s[0x3f - i] * buffer[chn][bufPos + i + k + 0xc0];
				f3 = f2 - w;
				f2 = f2 + w;

				x -= 4;
				x_real[b][x + 0] = f0 + f2;
				x_real[b][x + 2] = f0 - f2;
				x_real[b][x + 1] = f1 + f3;
				x_real[b][x + 3] = f1 - f3;

				f0 = window_s[i + 0x01] * buffer[chn][bufPos + i + k + 0x01];
				w = window_s[0x7e - i] * buffer[chn][bufPos + i + k + 0x81];
				f1 = f0 - w;
				f0 = f0 + w;
				f2 = window_s[i + 0x41] * buffer[chn][bufPos + i + k + 0x41];
				w = window_s[0x3e - i] * buffer[chn][bufPos + i + k + 0xc1];
				f3 = f2 - w;
				f2 = f2 + w;

				x_real[b][x + Encoder.BLKSIZE_s / 2 + 0] = f0 + f2;
				x_real[b][x + Encoder.BLKSIZE_s / 2 + 2] = f0 - f2;
				x_real[b][x + Encoder.BLKSIZE_s / 2 + 1] = f1 + f3;
				x_real[b][x + Encoder.BLKSIZE_s / 2 + 3] = f1 - f3;
			} while (--j >= 0);

			fht(x_real[b], x, Encoder.BLKSIZE_s / 2);
			/* BLKSIZE_s/2 because of 3DNow! ASM routine */
			/* BLKSIZE/2 because of 3DNow! ASM routine */
		}
	}

	public final void fft_long(final LameInternalFlags gfc, float y[], int chn,
			final float[] buffer[], int bufPos) {
		int jj = Encoder.BLKSIZE / 8 - 1;
		int x = Encoder.BLKSIZE / 2;

		do {
			float f0, f1, f2, f3, w;

			int i = rv_tbl[jj] & 0xff;
			f0 = window[i] * buffer[chn][bufPos + i];
			w = window[i + 0x200] * buffer[chn][bufPos + i + 0x200];
			f1 = f0 - w;
			f0 = f0 + w;
			f2 = window[i + 0x100] * buffer[chn][bufPos + i + 0x100];
			w = window[i + 0x300] * buffer[chn][bufPos + i + 0x300];
			f3 = f2 - w;
			f2 = f2 + w;

			x -= 4;
			y[x + 0] = f0 + f2;
			y[x + 2] = f0 - f2;
			y[x + 1] = f1 + f3;
			y[x + 3] = f1 - f3;

			f0 = window[i + 0x001] * buffer[chn][bufPos + i + 0x001];
			w = window[i + 0x201] * buffer[chn][bufPos + i + 0x201];
			f1 = f0 - w;
			f0 = f0 + w;
			f2 = window[i + 0x101] * buffer[chn][bufPos + i + 0x101];
			w = window[i + 0x301] * buffer[chn][bufPos + i + 0x301];
			f3 = f2 - w;
			f2 = f2 + w;

			y[x + Encoder.BLKSIZE / 2 + 0] = f0 + f2;
			y[x + Encoder.BLKSIZE / 2 + 2] = f0 - f2;
			y[x + Encoder.BLKSIZE / 2 + 1] = f1 + f3;
			y[x + Encoder.BLKSIZE / 2 + 3] = f1 - f3;
		} while (--jj >= 0);

		fht(y, x, Encoder.BLKSIZE / 2);
		/* BLKSIZE/2 because of 3DNow! ASM routine */
	}

	public final void init_fft(final LameInternalFlags gfc) {
		/* The type of window used here will make no real difference, but */
		/*
		 * in the interest of merging nspsytune stuff - switch to blackman
		 * window
		 */
		for (int i = 0; i < Encoder.BLKSIZE; i++)
			/* blackman window */
			window[i] = (float) (0.42 - 0.5 * Math.cos(2 * Math.PI * (i + .5)
					/ Encoder.BLKSIZE) + 0.08 * Math.cos(4 * Math.PI * (i + .5)
					/ Encoder.BLKSIZE));

		for (int i = 0; i < Encoder.BLKSIZE_s / 2; i++)
			window_s[i] = (float) (0.5 * (1.0 - Math.cos(2.0 * Math.PI
					* (i + 0.5) / Encoder.BLKSIZE_s)));

	}

}
