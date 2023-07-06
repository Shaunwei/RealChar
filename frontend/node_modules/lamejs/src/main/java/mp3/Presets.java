package mp3;

public class Presets {
	Lame lame;

	public final void setModules(Lame lame) {
		this.lame = lame;
	}

	/**
	 * <PRE>
	 * Switch mappings for VBR mode VBR_RH
	 *             vbr_q  qcomp_l  qcomp_s  expY  st_lrm   st_s  mask adj_l  adj_s  ath_lower  ath_curve  ath_sens  interChR  safejoint sfb21mod  msfix
	 * </PRE>
	 */
	private static final VBRPresets vbr_old_switch_map[] = {
        new VBRPresets(0,       9,       9,    0,   5.20f, 125.0f,      -4.2f,   -6.3f,       4.8f,       1f,          0f,   0f,              2,      21,  0.97f),
        new VBRPresets(1,       9,       9,    0,   5.30f, 125.0f,      -3.6f,   -5.6f,       4.5f,       1.5f,        0f,   0f,              2,      21,  1.35f),
        new VBRPresets(2,       9,       9,    0,   5.60f, 125.0f,      -2.2f,   -3.5f,       2.8f,       2f,          0f,   0f,              2,      21,  1.49f),
        new VBRPresets(3,       9,       9,    1,   5.80f, 130.0f,      -1.8f,   -2.8f,       2.6f,       3f,         -4f,   0f,              2,      20,  1.64f),
        new VBRPresets(4,       9,       9,    1,   6.00f, 135.0f,      -0.7f,   -1.1f,       1.1f,       3.5f,       -8f,   0f,              2,       0,  1.79f),
        new VBRPresets(5,       9,       9,    1,   6.40f, 140.0f,       0.5f,    0.4f,      -7.5f,       4f,        -12f,   0.0002f,         0,       0,  1.95f),
        new VBRPresets(6,       9,       9,    1,   6.60f, 145.0f,       0.67f,   0.65f,    -14.7f,       6.5f,      -19f,   0.0004f,         0,       0,  2.30f),
        new VBRPresets(7,       9,       9,    1,   6.60f, 145.0f,       0.8f,    0.75f,    -19.7f,       8f,        -22f,   0.0006f,         0,       0,  2.70f),
        new VBRPresets(8,       9,       9,    1,   6.60f, 145.0f,       1.2f,    1.15f,    -27.5f,      10f,        -23f,   0.0007f,         0,       0,  0f   ),
        new VBRPresets(9,       9,       9,    1,   6.60f, 145.0f,       1.6f,    1.6f,     -36f,        11f,        -25f,   0.0008f,         0,       0,  0f   ),
        new VBRPresets(10,      9,       9,    1,   6.60f, 145.0f,       2.0f,    2.0f,     -36f,        12f,        -25f,   0.0008f,         0,       0,  0f   )
    };

	/**
	 * <PRE>
	 *                 vbr_q  qcomp_l  qcomp_s  expY  st_lrm   st_s  mask adj_l  adj_s  ath_lower  ath_curve  ath_sens  interChR  safejoint sfb21mod  msfix
	 * </PRE>
	 */
    private static final VBRPresets vbr_psy_switch_map[] = {
            new VBRPresets(0,       9,       9,    0,   4.20f,  25.0f,      -7.0f,   -4.0f,       7.5f,       1f,          0f,   0f,              2,      26,  0.97f),
            new VBRPresets(1,       9,       9,    0,   4.20f,  25.0f,      -5.6f,   -3.6f,       4.5f,       1.5f,        0f,   0f,              2,      21,  1.35f),
            new VBRPresets(2,       9,       9,    0,   4.20f,  25.0f,      -4.4f,   -1.8f,       2f,         2f,          0f,   0f,              2,      18,  1.49f),
            new VBRPresets(3,       9,       9,    1,   4.20f,  25.0f,      -3.4f,   -1.25f,      1.1f,       3f,         -4f,   0f,              2,      15,  1.64f),
            new VBRPresets(4,       9,       9,    1,   4.20f,  25.0f,      -2.2f,    0.1f,       0f,         3.5f,       -8f,   0f,              2,       0,  1.79f),
            new VBRPresets(5,       9,       9,    1,   4.20f,  25.0f,      -1.0f,    1.65f,     -7.7f,       4f,        -12f,   0.0002f,         0,       0,  1.95f),
            new VBRPresets(6,       9,       9,    1,   4.20f,  25.0f,      -0.0f,    2.47f,     -7.7f,       6.5f,      -19f,   0.0004f,         0,       0,  2f   ),
            new VBRPresets(7,       9,       9,    1,   4.20f,  25.0f,       0.5f,    2.0f,     -14.5f,       8f,        -22f,   0.0006f,         0,       0,  2f   ),
            new VBRPresets(8,       9,       9,    1,   4.20f,  25.0f,       1.0f,    2.4f,     -22.0f,      10f,        -23f,   0.0007f,         0,       0,  2f   ),
            new VBRPresets(9,       9,       9,    1,   4.20f,  25.0f,       1.5f,    2.95f,    -30.0f,      11f,        -25f,   0.0008f,         0,       0,  2f   ),
            new VBRPresets(10,      9,       9,    1,   4.20f,  25.0f,       2.0f,    2.95f,    -36.0f,      12f,        -30f,   0.0008f,         0,       0,  2f   )
        };

	private void apply_vbr_preset(final LameGlobalFlags gfp, final int a,
			final int enforce) {
		final VBRPresets[] vbr_preset = gfp.VBR == VbrMode.vbr_rh ? vbr_old_switch_map
				: vbr_psy_switch_map;

		float x = gfp.VBR_q_frac;
		VBRPresets p = vbr_preset[a];
		VBRPresets q = vbr_preset[a + 1];
		final VBRPresets set = p;

		// NOOP(vbr_q);
		// NOOP(quant_comp);
		// NOOP(quant_comp_s);
		// NOOP(expY);
		p.st_lrm = p.st_lrm + x * (q.st_lrm - p.st_lrm);
		// LERP(st_lrm);
		p.st_s = p.st_s + x * (q.st_s - p.st_s);
		// LERP(st_s);
		p.masking_adj = p.masking_adj + x * (q.masking_adj - p.masking_adj);
		// LERP(masking_adj);
		p.masking_adj_short = p.masking_adj_short + x
				* (q.masking_adj_short - p.masking_adj_short);
		// LERP(masking_adj_short);
		p.ath_lower = p.ath_lower + x * (q.ath_lower - p.ath_lower);
		// LERP(ath_lower);
		p.ath_curve = p.ath_curve + x * (q.ath_curve - p.ath_curve);
		// LERP(ath_curve);
		p.ath_sensitivity = p.ath_sensitivity + x
				* (q.ath_sensitivity - p.ath_sensitivity);
		// LERP(ath_sensitivity);
		p.interch = p.interch + x * (q.interch - p.interch);
		// LERP(interch);
		// NOOP(safejoint);
		// NOOP(sfb21mod);
		p.msfix = p.msfix + x * (q.msfix - p.msfix);
		// LERP(msfix);

		lame_set_VBR_q(gfp, set.vbr_q);

		if (enforce != 0)
			gfp.quant_comp = set.quant_comp;
		else if (!(Math.abs(gfp.quant_comp - -1) > 0))
			gfp.quant_comp = set.quant_comp;
		// SET_OPTION(quant_comp, set.quant_comp, -1);
		if (enforce != 0)
			gfp.quant_comp_short = set.quant_comp_s;
		else if (!(Math.abs(gfp.quant_comp_short - -1) > 0))
			gfp.quant_comp_short = set.quant_comp_s;
		// SET_OPTION(quant_comp_short, set.quant_comp_s, -1);
		if (set.expY != 0) {
			gfp.experimentalY = set.expY != 0;
		}
		if (enforce != 0)
			gfp.internal_flags.nsPsy.attackthre = set.st_lrm;
		else if (!(Math.abs(gfp.internal_flags.nsPsy.attackthre - -1) > 0))
			gfp.internal_flags.nsPsy.attackthre = set.st_lrm;
		// SET_OPTION(short_threshold_lrm, set.st_lrm, -1);
		if (enforce != 0)
			gfp.internal_flags.nsPsy.attackthre_s = set.st_s;
		else if (!(Math.abs(gfp.internal_flags.nsPsy.attackthre_s - -1) > 0))
			gfp.internal_flags.nsPsy.attackthre_s = set.st_s;
		// SET_OPTION(short_threshold_s, set.st_s, -1);
		if (enforce != 0)
			gfp.maskingadjust = set.masking_adj;
		else if (!(Math.abs(gfp.maskingadjust - 0) > 0))
			gfp.maskingadjust = set.masking_adj;
		// SET_OPTION(maskingadjust, set.masking_adj, 0);
		if (enforce != 0)
			gfp.maskingadjust_short = set.masking_adj_short;
		else if (!(Math.abs(gfp.maskingadjust_short - 0) > 0))
			gfp.maskingadjust_short = set.masking_adj_short;
		// SET_OPTION(maskingadjust_short, set.masking_adj_short, 0);
		if (enforce != 0)
			gfp.ATHlower = -set.ath_lower / 10.0f;
		else if (!(Math.abs((-gfp.ATHlower * 10.0) - 0) > 0))
			gfp.ATHlower = -set.ath_lower / 10.0f;
		// SET_OPTION(ATHlower, set.ath_lower, 0);
		if (enforce != 0)
			gfp.ATHcurve = set.ath_curve;
		else if (!(Math.abs(gfp.ATHcurve - -1) > 0))
			gfp.ATHcurve = set.ath_curve;
		// SET_OPTION(ATHcurve, set.ath_curve, -1);
		if (enforce != 0)
			gfp.athaa_sensitivity = set.ath_sensitivity;
		else if (!(Math.abs(gfp.athaa_sensitivity - -1) > 0))
			gfp.athaa_sensitivity = set.ath_sensitivity;
		// SET_OPTION(athaa_sensitivity, set.ath_sensitivity, 0);
		if (set.interch > 0) {
			if (enforce != 0)
				gfp.interChRatio = set.interch;
			else if (!(Math.abs(gfp.interChRatio - -1) > 0))
				gfp.interChRatio = set.interch;
			// SET_OPTION(interChRatio, set.interch, -1);
		}

		/* parameters for which there is no proper set/get interface */
		if (set.safejoint > 0) {
			gfp.exp_nspsytune = gfp.exp_nspsytune | set.safejoint;
		}
		if (set.sfb21mod > 0) {
			gfp.exp_nspsytune = gfp.exp_nspsytune | (set.sfb21mod << 20);
		}
		if (enforce != 0)
			gfp.msfix = set.msfix;
		else if (!(Math.abs(gfp.msfix - -1) > 0))
			gfp.msfix = set.msfix;
		// SET_OPTION(msfix, set.msfix, -1);

		if (enforce == 0) {
			gfp.VBR_q = a;
			gfp.VBR_q_frac = x;
		}
	}
	
	/**
	 * <PRE>
	 *  Switch mappings for ABR mode
	 *  
	 *              kbps  quant q_s safejoint nsmsfix st_lrm  st_s  ns-bass scale   msk ath_lwr ath_curve  interch , sfscale
	 * </PRE>
	 */
	private static final ABRPresets abr_switch_map[] = {        
      new ABRPresets(  8,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,  -30.0f,     11f,    0.0012f,        1), /*   8, impossible to use in stereo */
      new ABRPresets( 16,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,  -25.0f,     11f,    0.0010f,        1), /*  16 */
      new ABRPresets( 24,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,  -20.0f,     11f,    0.0010f,        1), /*  24 */
      new ABRPresets( 32,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,  -15.0f,     11f,    0.0010f,        1), /*  32 */
      new ABRPresets( 40,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,  -10.0f,     11f,    0.0009f,        1), /*  40 */
      new ABRPresets( 48,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,  -10.0f,     11f,    0.0009f,        1), /*  48 */
      new ABRPresets( 56,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,   -6.0f,     11f,    0.0008f,        1), /*  56 */
      new ABRPresets( 64,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,   -2.0f,     11f,    0.0008f,        1), /*  64 */
      new ABRPresets( 80,     9,  9,        0,      0f,  6.60f,  145f,       0f, 0.95f,    0f,     .0f,      8f,    0.0007f,        1), /*  80 */
      new ABRPresets( 96,     9,  9,        0,   2.50f,  6.60f,  145f,       0f, 0.95f,    0f,    1.0f,      5.5f,  0.0006f,        1), /*  96 */
      new ABRPresets(112,     9,  9,        0,   2.25f,  6.60f,  145f,       0f, 0.95f,    0f,    2.0f,      4.5f,  0.0005f,        1), /* 112 */
      new ABRPresets(128,     9,  9,        0,   1.95f,  6.40f,  140f,       0f, 0.95f,    0f,    3.0f,      4f,    0.0002f,        1), /* 128 */
      new ABRPresets(160,     9,  9,        1,   1.79f,  6.00f,  135f,       0f, 0.95f,   -2f,    5.0f,      3.5f,  0f,             1), /* 160 */
      new ABRPresets(192,     9,  9,        1,   1.49f,  5.60f,  125f,       0f, 0.97f,   -4f,    7.0f,      3f,    0f,             0), /* 192 */
      new ABRPresets(224,     9,  9,        1,   1.25f,  5.20f,  125f,       0f, 0.98f,   -6f,    9.0f,      2f,    0f,             0), /* 224 */
      new ABRPresets(256,     9,  9,        1,   0.97f,  5.20f,  125f,       0f, 1.00f,   -8f,   10.0f,      1f,    0f,             0), /* 256 */
      new ABRPresets(320,     9,  9,        1,   0.90f,  5.20f,  125f,       0f, 1.00f,  -10f,   12.0f,      0f,    0f,             0)  /* 320 */
    };

	private int apply_abr_preset(final LameGlobalFlags gfp, final int preset,
			final int enforce) {
		/* Variables for the ABR stuff */
		int actual_bitrate = preset;

		int r = lame.nearestBitrateFullIndex(preset);

		gfp.VBR = VbrMode.vbr_abr;
		gfp.VBR_mean_bitrate_kbps = actual_bitrate;
		gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps, 320);
		gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps, 8);
		gfp.brate = gfp.VBR_mean_bitrate_kbps;
		if (gfp.VBR_mean_bitrate_kbps > 320) {
			gfp.disable_reservoir = true;
		}

		/* parameters for which there is no proper set/get interface */
		if (abr_switch_map[r].safejoint > 0)
			gfp.exp_nspsytune = gfp.exp_nspsytune | 2; /* safejoint */

		if (abr_switch_map[r].sfscale > 0) {
			gfp.internal_flags.noise_shaping = 2;
		}
		/* ns-bass tweaks */
		if (Math.abs(abr_switch_map[r].nsbass) > 0) {
			int k = (int) (abr_switch_map[r].nsbass * 4);
			if (k < 0)
				k += 64;
			gfp.exp_nspsytune = gfp.exp_nspsytune | (k << 2);
		}

		if (enforce != 0)
			gfp.quant_comp = abr_switch_map[r].quant_comp;
		else if (!(Math.abs(gfp.quant_comp - -1) > 0))
			gfp.quant_comp = abr_switch_map[r].quant_comp;
		// SET_OPTION(quant_comp, abr_switch_map[r].quant_comp, -1);
		if (enforce != 0)
			gfp.quant_comp_short = abr_switch_map[r].quant_comp_s;
		else if (!(Math.abs(gfp.quant_comp_short - -1) > 0))
			gfp.quant_comp_short = abr_switch_map[r].quant_comp_s;
		// SET_OPTION(quant_comp_short, abr_switch_map[r].quant_comp_s, -1);

		if (enforce != 0)
			gfp.msfix = abr_switch_map[r].nsmsfix;
		else if (!(Math.abs(gfp.msfix - -1) > 0))
			gfp.msfix = abr_switch_map[r].nsmsfix;
		// SET_OPTION(msfix, abr_switch_map[r].nsmsfix, -1);

		if (enforce != 0)
			gfp.internal_flags.nsPsy.attackthre = abr_switch_map[r].st_lrm;
		else if (!(Math.abs(gfp.internal_flags.nsPsy.attackthre - -1) > 0))
			gfp.internal_flags.nsPsy.attackthre = abr_switch_map[r].st_lrm;
		// SET_OPTION(short_threshold_lrm, abr_switch_map[r].st_lrm, -1);
		if (enforce != 0)
			gfp.internal_flags.nsPsy.attackthre_s = abr_switch_map[r].st_s;
		else if (!(Math.abs(gfp.internal_flags.nsPsy.attackthre_s - -1) > 0))
			gfp.internal_flags.nsPsy.attackthre_s = abr_switch_map[r].st_s;
		// SET_OPTION(short_threshold_s, abr_switch_map[r].st_s, -1);

		/*
		 * ABR seems to have big problems with clipping, especially at low
		 * bitrates
		 */
		/*
		 * so we compensate for that here by using a scale value depending on
		 * bitrate
		 */
		if (enforce != 0)
			gfp.scale = abr_switch_map[r].scale;
		else if (!(Math.abs(gfp.scale - -1) > 0))
			gfp.scale = abr_switch_map[r].scale;
		// SET_OPTION(scale, abr_switch_map[r].scale, -1);

		if (enforce != 0)
			gfp.maskingadjust = abr_switch_map[r].masking_adj;
		else if (!(Math.abs(gfp.maskingadjust - 0) > 0))
			gfp.maskingadjust = abr_switch_map[r].masking_adj;
		// SET_OPTION(maskingadjust, abr_switch_map[r].masking_adj, 0);
		if (abr_switch_map[r].masking_adj > 0) {
			if (enforce != 0)
				gfp.maskingadjust_short = (float) (abr_switch_map[r].masking_adj * .9);
			else if (!(Math.abs(gfp.maskingadjust_short - 0) > 0))
				gfp.maskingadjust_short = (float) (abr_switch_map[r].masking_adj * .9);
			// SET_OPTION(maskingadjust_short, abr_switch_map[r].masking_adj *
			// .9, 0);
		} else {
			if (enforce != 0)
				gfp.maskingadjust_short = (float) (abr_switch_map[r].masking_adj * 1.1);
			else if (!(Math.abs(gfp.maskingadjust_short - 0) > 0))
				gfp.maskingadjust_short = (float) (abr_switch_map[r].masking_adj * 1.1);
			// SET_OPTION(maskingadjust_short, abr_switch_map[r].masking_adj *
			// 1.1, 0);
		}

		if (enforce != 0)
			gfp.ATHlower = -abr_switch_map[r].ath_lower / 10.f;
		else if (!(Math.abs((-gfp.ATHlower * 10.f) - 0) > 0))
			gfp.ATHlower = -abr_switch_map[r].ath_lower / 10.f;
		// SET_OPTION(ATHlower, abr_switch_map[r].ath_lower, 0);
		if (enforce != 0)
			gfp.ATHcurve = abr_switch_map[r].ath_curve;
		else if (!(Math.abs(gfp.ATHcurve - -1) > 0))
			gfp.ATHcurve = abr_switch_map[r].ath_curve;
		// SET_OPTION(ATHcurve, abr_switch_map[r].ath_curve, -1);

		if (enforce != 0)
			gfp.interChRatio = abr_switch_map[r].interch;
		else if (!(Math.abs(gfp.interChRatio - -1) > 0))
			gfp.interChRatio = abr_switch_map[r].interch;
		// SET_OPTION(interChRatio, abr_switch_map[r].interch, -1);

		return preset;
	}

	public final int apply_preset(final LameGlobalFlags gfp, int preset,
			final int enforce) {
		/* translate legacy presets */
		switch (preset) {
		case Lame.R3MIX: {
			preset = Lame.V3;
			gfp.VBR = VbrMode.vbr_mtrh;
			break;
		}
		case Lame.MEDIUM: {
			preset = Lame.V4;
			gfp.VBR = VbrMode.vbr_rh;
			break;
		}
		case Lame.MEDIUM_FAST: {
			preset = Lame.V4;
			gfp.VBR = VbrMode.vbr_mtrh;
			break;
		}
		case Lame.STANDARD: {
			preset = Lame.V2;
			gfp.VBR = VbrMode.vbr_rh;
			break;
		}
		case Lame.STANDARD_FAST: {
			preset = Lame.V2;
			gfp.VBR = VbrMode.vbr_mtrh;
			break;
		}
		case Lame.EXTREME: {
			preset = Lame.V0;
			gfp.VBR = VbrMode.vbr_rh;
			break;
		}
		case Lame.EXTREME_FAST: {
			preset = Lame.V0;
			gfp.VBR = VbrMode.vbr_mtrh;
			break;
		}
		case Lame.INSANE: {
			preset = 320;
			gfp.preset = preset;
			apply_abr_preset(gfp, preset, enforce);
			gfp.VBR = VbrMode.vbr_off;
			return preset;
		}
		}

		gfp.preset = preset;
		{
			switch (preset) {
			case Lame.V9:
				apply_vbr_preset(gfp, 9, enforce);
				return preset;
			case Lame.V8:
				apply_vbr_preset(gfp, 8, enforce);
				return preset;
			case Lame.V7:
				apply_vbr_preset(gfp, 7, enforce);
				return preset;
			case Lame.V6:
				apply_vbr_preset(gfp, 6, enforce);
				return preset;
			case Lame.V5:
				apply_vbr_preset(gfp, 5, enforce);
				return preset;
			case Lame.V4:
				apply_vbr_preset(gfp, 4, enforce);
				return preset;
			case Lame.V3:
				apply_vbr_preset(gfp, 3, enforce);
				return preset;
			case Lame.V2:
				apply_vbr_preset(gfp, 2, enforce);
				return preset;
			case Lame.V1:
				apply_vbr_preset(gfp, 1, enforce);
				return preset;
			case Lame.V0:
				apply_vbr_preset(gfp, 0, enforce);
				return preset;
			default:
				break;
			}
		}
		if (8 <= preset && preset <= 320) {
			return apply_abr_preset(gfp, preset, enforce);
		}

		/* no corresponding preset found */
		gfp.preset = 0;
		return preset;
	}

	// Rest from getset.c:

	/**
	 * VBR quality level.<BR>
	 * 0 = highest<BR>
	 * 9 = lowest
	 */
	public int lame_set_VBR_q(final LameGlobalFlags gfp, int VBR_q) {
		int ret = 0;

		if (0 > VBR_q) {
			/* Unknown VBR quality level! */
			ret = -1;
			VBR_q = 0;
		}
		if (9 < VBR_q) {
			ret = -1;
			VBR_q = 9;
		}

		gfp.VBR_q = VBR_q;
		gfp.VBR_q_frac = 0;
		return ret;
	}

}
