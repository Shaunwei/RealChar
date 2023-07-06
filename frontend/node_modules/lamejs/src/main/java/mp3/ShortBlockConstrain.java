package mp3;

import mp3.VBRQuantize.algo_t;

final class ShortBlockConstrain implements VBRQuantize.alloc_sf_f {
	/**
	 * 
	 */
	private final VBRQuantize vbrQuantize;

	/**
	 * @param vbrQuantize
	 */
	ShortBlockConstrain(VBRQuantize vbrQuantize) {
		this.vbrQuantize = vbrQuantize;
	}

	/******************************************************************
	 * 
	 * short block scalefacs
	 * 
	 ******************************************************************/

	public void alloc(algo_t that, int[] vbrsf, int[] vbrsfmin, int vbrmax) {
		final GrInfo cod_info = that.cod_info;
		final LameInternalFlags gfc = that.gfc;
		final int maxminsfb = that.mingain_l;
		int mover, maxover0 = 0, maxover1 = 0, delta = 0;
		int v, v0, v1;
		int sfb;
		final int psymax = cod_info.psymax;

		for (sfb = 0; sfb < psymax; ++sfb) {
			assert (vbrsf[sfb] >= vbrsfmin[sfb]);
			v = vbrmax - vbrsf[sfb];
			if (delta < v) {
				delta = v;
			}
			v0 = v - (4 * 14 + 2 * VBRQuantize.max_range_short[sfb]);
			v1 = v - (4 * 14 + 4 * VBRQuantize.max_range_short[sfb]);
			if (maxover0 < v0) {
				maxover0 = v0;
			}
			if (maxover1 < v1) {
				maxover1 = v1;
			}
		}
		if (gfc.noise_shaping == 2) {
			/* allow scalefac_scale=1 */
			mover = Math.min(maxover0, maxover1);
		} else {
			mover = maxover0;
		}
		if (delta > mover) {
			delta = mover;
		}
		vbrmax -= delta;
		maxover0 -= mover;
		maxover1 -= mover;

		if (maxover0 == 0) {
			cod_info.scalefac_scale = 0;
		} else if (maxover1 == 0) {
			cod_info.scalefac_scale = 1;
		}
		if (vbrmax < maxminsfb) {
			vbrmax = maxminsfb;
		}
		cod_info.global_gain = vbrmax;

		if (cod_info.global_gain < 0) {
			cod_info.global_gain = 0;
		} else if (cod_info.global_gain > 255) {
			cod_info.global_gain = 255;
		}
		{
			int sf_temp[] = new int[L3Side.SFBMAX];
			for (sfb = 0; sfb < L3Side.SFBMAX; ++sfb) {
				sf_temp[sfb] = vbrsf[sfb] - vbrmax;
			}
			this.vbrQuantize.set_subblock_gain(cod_info, that.mingain_s,
					sf_temp);
			this.vbrQuantize.set_scalefacs(cod_info, vbrsfmin, sf_temp,
					VBRQuantize.max_range_short);
		}
		assert (this.vbrQuantize.checkScalefactor(cod_info, vbrsfmin));

	}
}