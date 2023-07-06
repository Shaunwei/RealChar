package mp3;

class ABRPresets {
	public ABRPresets(final int kbps, final int comp, final int compS,
			final int joint, final float fix, final float shThreshold,
			final float shThresholdS, final float bass, final float sc,
			final float mask, final float lower, final float curve,
			final float interCh, final int sfScale) {
		quant_comp = comp;
		quant_comp_s = compS;
		safejoint = joint;
		nsmsfix = fix;
		st_lrm = shThreshold;
		st_s = shThresholdS;
		nsbass = bass;
		scale = sc;
		masking_adj = mask;
		ath_lower = lower;
		ath_curve = curve;
		interch = interCh;
		sfscale = sfScale;
	}

	int quant_comp;
	int quant_comp_s;
	int safejoint;
	float nsmsfix;
	/**
	 * short threshold
	 */
	float st_lrm;
	float st_s;
	float nsbass;
	float scale;
	float masking_adj;
	float ath_lower;
	float ath_curve;
	float interch;
	int sfscale;
}