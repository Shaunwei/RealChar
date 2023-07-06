package mp3;

class VBRPresets {
	public VBRPresets(final int qual, final int comp, final int compS,
			final int y, final float shThreshold, final float shThresholdS,
			final float adj, final float adjShort, final float lower,
			final float curve, final float sens, final float inter,
			final int joint, final int mod, final float fix) {
		vbr_q = qual;
		quant_comp = comp;
		quant_comp_s = compS;
		expY = y;
		st_lrm = shThreshold;
		st_s = shThresholdS;
		masking_adj = adj;
		masking_adj_short = adjShort;
		ath_lower = lower;
		ath_curve = curve;
		ath_sensitivity = sens;
		interch = inter;
		safejoint = joint;
		sfb21mod = mod;
		msfix = fix;
	}

	int vbr_q;
	int quant_comp;
	int quant_comp_s;
	int expY;
	/**
	 * short threshold
	 */
	float st_lrm;
	float st_s;
	float masking_adj;
	float masking_adj_short;
	float ath_lower;
	float ath_curve;
	float ath_sensitivity;
	float interch;
	int safejoint;
	int sfb21mod;
	float msfix;
}