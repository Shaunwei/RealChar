package mp3;

public final class VBRNewIterationLoop implements IIterationLoop {

	/**
	 * 
	 */
	private final Quantize quantize;

	/**
	 * @param quantize
	 */
	VBRNewIterationLoop(Quantize quantize) {
		this.quantize = quantize;
	}

	public final void iteration_loop(final LameGlobalFlags gfp,
			final float[][] pe, final float[] ms_ener_ratio,
			final III_psy_ratio[][] ratio) {
		LameInternalFlags gfc = gfp.internal_flags;
		float l3_xmin[][][] = new float[2][2][L3Side.SFBMAX];

		float xrpow[][][] = new float[2][2][576];
		int frameBits[] = new int[15];
		int max_bits[][] = new int[2][2];
		final IIISideInfo l3_side = gfc.l3_side;

		int analog_silence = this.quantize.VBR_new_prepare(gfp, pe, ratio, l3_xmin,
				frameBits, max_bits);

		for (int gr = 0; gr < gfc.mode_gr; gr++) {
			for (int ch = 0; ch < gfc.channels_out; ch++) {
				final GrInfo cod_info = l3_side.tt[gr][ch];

				/*
				 * init_outer_loop sets up cod_info, scalefac and xrpow
				 */
				if (!this.quantize.init_xrpow(gfc, cod_info, xrpow[gr][ch])) {
					/* silent granule needs no bits */
					max_bits[gr][ch] = 0;
				}
			} /* for ch */
		} /* for gr */

		/*
		 * quantize granules with lowest possible number of bits
		 */

		int used_bits = this.quantize.vbr.VBR_encode_frame(gfc, xrpow, l3_xmin, max_bits);

		if (!gfp.free_format) {
			/*
			 * find lowest bitrate able to hold used bits
			 */
			if (analog_silence != 0 && 0 == gfp.VBR_hard_min) {
				/*
				 * we detected analog silence and the user did not specify
				 * any hard framesize limit, so start with smallest possible
				 * frame
				 */
				gfc.bitrate_index = 1;
			} else {
				gfc.bitrate_index = gfc.VBR_min_bitrate;
			}

			for (; gfc.bitrate_index < gfc.VBR_max_bitrate; gfc.bitrate_index++) {
				if (used_bits <= frameBits[gfc.bitrate_index])
					break;
			}
			if (gfc.bitrate_index > gfc.VBR_max_bitrate) {
				gfc.bitrate_index = gfc.VBR_max_bitrate;
			}
		} else {
			gfc.bitrate_index = 0;
		}
		if (used_bits <= frameBits[gfc.bitrate_index]) {
			/* update Reservoire status */
			int mean_bits = 0, fullframebits;
			MeanBits mb = new MeanBits(mean_bits);
			fullframebits = this.quantize.rv.ResvFrameBegin(gfp, mb);
			mean_bits = mb.bits;
			assert (used_bits <= fullframebits);
			for (int gr = 0; gr < gfc.mode_gr; gr++) {
				for (int ch = 0; ch < gfc.channels_out; ch++) {
					final GrInfo cod_info = l3_side.tt[gr][ch];
					this.quantize.rv.ResvAdjust(gfc, cod_info);
				}
			}
			this.quantize.rv.ResvFrameEnd(gfc, mean_bits);
		} else {
			/*
			 * SHOULD NOT HAPPEN INTERNAL ERROR
			 */
			throw new RuntimeException("INTERNAL ERROR IN VBR NEW CODE, please send bug report");
		}
	}
}