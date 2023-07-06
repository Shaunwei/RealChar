package mp3;

/**
 * tries to find out how many bits are needed for each granule and channel
 * to get an acceptable quantization. An appropriate bitrate will then be
 * choosed for quantization. rh 8/99
 * 
 * Robert Hegemann 2000-09-06 rewrite
 * 
 * @author Ken
 * 
 */
public final class VBROldIterationLoop implements IIterationLoop {

	/**
	 * 
	 */
	private final Quantize quantize;

	/**
	 * @param quantize
	 */
	VBROldIterationLoop(Quantize quantize) {
		this.quantize = quantize;
	}

	public void iteration_loop(LameGlobalFlags gfp, float[][] pe,
			float[] ms_ener_ratio, III_psy_ratio[][] ratio) {
		final LameInternalFlags gfc = gfp.internal_flags;
		float l3_xmin[][][] = new float[2][2][L3Side.SFBMAX];

		float xrpow[] = new float[576];
		int bands[][] = new int[2][2];
		int frameBits[] = new int[15];
		int min_bits[][] = new int[2][2], max_bits[][] = new int[2][2];
		int mean_bits = 0;
		final IIISideInfo l3_side = gfc.l3_side;

		int analog_silence = this.quantize.VBR_old_prepare(gfp, pe, ms_ener_ratio, ratio,
				l3_xmin, frameBits, min_bits, max_bits, bands);

		/*---------------------------------*/
		for (;;) {
			/*
			 * quantize granules with lowest possible number of bits
			 */
			int used_bits = 0;

			for (int gr = 0; gr < gfc.mode_gr; gr++) {
				for (int ch = 0; ch < gfc.channels_out; ch++) {
					final GrInfo cod_info = l3_side.tt[gr][ch];

					/*
					 * init_outer_loop sets up cod_info, scalefac and xrpow
					 */
					boolean ret = this.quantize.init_xrpow(gfc, cod_info, xrpow);
					if (!ret || max_bits[gr][ch] == 0) {
						/*
						 * xr contains no energy l3_enc, our encoding data,
						 * will be quantized to zero
						 */
						continue; /* with next channel */
					}

					this.quantize.VBR_encode_granule(gfp, cod_info, l3_xmin[gr][ch],
							xrpow, ch, min_bits[gr][ch], max_bits[gr][ch]);

					/*
					 * do the 'substep shaping'
					 */
					if ((gfc.substep_shaping & 1) != 0) {
						this.quantize.trancate_smallspectrums(gfc, l3_side.tt[gr][ch],
								l3_xmin[gr][ch], xrpow);
					}

					int usedB = cod_info.part2_3_length
							+ cod_info.part2_length;
					used_bits += usedB;
				} /* for ch */
			} /* for gr */

			/*
			 * find lowest bitrate able to hold used bits
			 */
			if (analog_silence != 0 && 0 == gfp.VBR_hard_min)
				/*
				 * we detected analog silence and the user did not specify
				 * any hard framesize limit, so start with smallest possible
				 * frame
				 */
				gfc.bitrate_index = 1;
			else
				gfc.bitrate_index = gfc.VBR_min_bitrate;

			for (; gfc.bitrate_index < gfc.VBR_max_bitrate; gfc.bitrate_index++) {
				if (used_bits <= frameBits[gfc.bitrate_index])
					break;
			}
			MeanBits mb = new MeanBits(mean_bits);
			int bits = this.quantize.rv.ResvFrameBegin(gfp, mb);
			mean_bits = mb.bits;

			if (used_bits <= bits)
				break;

			this.quantize.bitpressure_strategy(gfc, l3_xmin, min_bits, max_bits);

		}
		/* breaks adjusted */
		/*--------------------------------------*/

		for (int gr = 0; gr < gfc.mode_gr; gr++) {
			for (int ch = 0; ch < gfc.channels_out; ch++) {
				this.quantize.iteration_finish_one(gfc, gr, ch);
			} /* for ch */
		} /* for gr */
		this.quantize.rv.ResvFrameEnd(gfc, mean_bits);
	}
}