var common = require('./common.js');
var System = common.System;
var VbrMode = common.VbrMode;
var Float = common.Float;
var ShortBlock = common.ShortBlock;
var Util = common.Util;
var Arrays = common.Arrays;
var new_array_n = common.new_array_n;
var new_byte = common.new_byte;
var new_double = common.new_double;
var new_float = common.new_float;
var new_float_n = common.new_float_n;
var new_int = common.new_int;
var new_int_n = common.new_int_n;
var assert = common.assert;

function Presets() {
    function VBRPresets(qual, comp, compS,
                        y, shThreshold, shThresholdS,
                        adj, adjShort, lower,
                        curve, sens, inter,
                        joint, mod, fix) {
        this.vbr_q = qual;
        this.quant_comp = comp;
        this.quant_comp_s = compS;
        this.expY = y;
        this.st_lrm = shThreshold;
        this.st_s = shThresholdS;
        this.masking_adj = adj;
        this.masking_adj_short = adjShort;
        this.ath_lower = lower;
        this.ath_curve = curve;
        this.ath_sensitivity = sens;
        this.interch = inter;
        this.safejoint = joint;
        this.sfb21mod = mod;
        this.msfix = fix;
    }

    function ABRPresets(kbps, comp, compS,
                        joint, fix, shThreshold,
                        shThresholdS, bass, sc,
                        mask, lower, curve,
                        interCh, sfScale) {
        this.quant_comp = comp;
        this.quant_comp_s = compS;
        this.safejoint = joint;
        this.nsmsfix = fix;
        this.st_lrm = shThreshold;
        this.st_s = shThresholdS;
        this.nsbass = bass;
        this.scale = sc;
        this.masking_adj = mask;
        this.ath_lower = lower;
        this.ath_curve = curve;
        this.interch = interCh;
        this.sfscale = sfScale;
    }

    var lame;

    this.setModules = function (_lame) {
        lame = _lame;
    };

    /**
     * <PRE>
     * Switch mappings for VBR mode VBR_RH
     *             vbr_q  qcomp_l  qcomp_s  expY  st_lrm   st_s  mask adj_l  adj_s  ath_lower  ath_curve  ath_sens  interChR  safejoint sfb21mod  msfix
     * </PRE>
     */
    var vbr_old_switch_map = [
        new VBRPresets(0, 9, 9, 0, 5.20, 125.0, -4.2, -6.3, 4.8, 1, 0, 0, 2, 21, 0.97),
        new VBRPresets(1, 9, 9, 0, 5.30, 125.0, -3.6, -5.6, 4.5, 1.5, 0, 0, 2, 21, 1.35),
        new VBRPresets(2, 9, 9, 0, 5.60, 125.0, -2.2, -3.5, 2.8, 2, 0, 0, 2, 21, 1.49),
        new VBRPresets(3, 9, 9, 1, 5.80, 130.0, -1.8, -2.8, 2.6, 3, -4, 0, 2, 20, 1.64),
        new VBRPresets(4, 9, 9, 1, 6.00, 135.0, -0.7, -1.1, 1.1, 3.5, -8, 0, 2, 0, 1.79),
        new VBRPresets(5, 9, 9, 1, 6.40, 140.0, 0.5, 0.4, -7.5, 4, -12, 0.0002, 0, 0, 1.95),
        new VBRPresets(6, 9, 9, 1, 6.60, 145.0, 0.67, 0.65, -14.7, 6.5, -19, 0.0004, 0, 0, 2.30),
        new VBRPresets(7, 9, 9, 1, 6.60, 145.0, 0.8, 0.75, -19.7, 8, -22, 0.0006, 0, 0, 2.70),
        new VBRPresets(8, 9, 9, 1, 6.60, 145.0, 1.2, 1.15, -27.5, 10, -23, 0.0007, 0, 0, 0),
        new VBRPresets(9, 9, 9, 1, 6.60, 145.0, 1.6, 1.6, -36, 11, -25, 0.0008, 0, 0, 0),
        new VBRPresets(10, 9, 9, 1, 6.60, 145.0, 2.0, 2.0, -36, 12, -25, 0.0008, 0, 0, 0)
    ];

    /**
     * <PRE>
     *                 vbr_q  qcomp_l  qcomp_s  expY  st_lrm   st_s  mask adj_l  adj_s  ath_lower  ath_curve  ath_sens  interChR  safejoint sfb21mod  msfix
     * </PRE>
     */
    var vbr_psy_switch_map = [
        new VBRPresets(0, 9, 9, 0, 4.20, 25.0, -7.0, -4.0, 7.5, 1, 0, 0, 2, 26, 0.97),
        new VBRPresets(1, 9, 9, 0, 4.20, 25.0, -5.6, -3.6, 4.5, 1.5, 0, 0, 2, 21, 1.35),
        new VBRPresets(2, 9, 9, 0, 4.20, 25.0, -4.4, -1.8, 2, 2, 0, 0, 2, 18, 1.49),
        new VBRPresets(3, 9, 9, 1, 4.20, 25.0, -3.4, -1.25, 1.1, 3, -4, 0, 2, 15, 1.64),
        new VBRPresets(4, 9, 9, 1, 4.20, 25.0, -2.2, 0.1, 0, 3.5, -8, 0, 2, 0, 1.79),
        new VBRPresets(5, 9, 9, 1, 4.20, 25.0, -1.0, 1.65, -7.7, 4, -12, 0.0002, 0, 0, 1.95),
        new VBRPresets(6, 9, 9, 1, 4.20, 25.0, -0.0, 2.47, -7.7, 6.5, -19, 0.0004, 0, 0, 2),
        new VBRPresets(7, 9, 9, 1, 4.20, 25.0, 0.5, 2.0, -14.5, 8, -22, 0.0006, 0, 0, 2),
        new VBRPresets(8, 9, 9, 1, 4.20, 25.0, 1.0, 2.4, -22.0, 10, -23, 0.0007, 0, 0, 2),
        new VBRPresets(9, 9, 9, 1, 4.20, 25.0, 1.5, 2.95, -30.0, 11, -25, 0.0008, 0, 0, 2),
        new VBRPresets(10, 9, 9, 1, 4.20, 25.0, 2.0, 2.95, -36.0, 12, -30, 0.0008, 0, 0, 2)
    ];

    function apply_vbr_preset(gfp, a, enforce) {
        var vbr_preset = gfp.VBR == VbrMode.vbr_rh ? vbr_old_switch_map
            : vbr_psy_switch_map;

        var x = gfp.VBR_q_frac;
        var p = vbr_preset[a];
        var q = vbr_preset[a + 1];
        var set = p;

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
            gfp.ATHlower = -set.ath_lower / 10.0;
        else if (!(Math.abs((-gfp.ATHlower * 10.0) - 0) > 0))
            gfp.ATHlower = -set.ath_lower / 10.0;
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
    var abr_switch_map = [
        new ABRPresets(8, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -30.0, 11, 0.0012, 1), /*   8, impossible to use in stereo */
        new ABRPresets(16, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -25.0, 11, 0.0010, 1), /*  16 */
        new ABRPresets(24, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -20.0, 11, 0.0010, 1), /*  24 */
        new ABRPresets(32, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -15.0, 11, 0.0010, 1), /*  32 */
        new ABRPresets(40, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -10.0, 11, 0.0009, 1), /*  40 */
        new ABRPresets(48, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -10.0, 11, 0.0009, 1), /*  48 */
        new ABRPresets(56, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -6.0, 11, 0.0008, 1), /*  56 */
        new ABRPresets(64, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, -2.0, 11, 0.0008, 1), /*  64 */
        new ABRPresets(80, 9, 9, 0, 0, 6.60, 145, 0, 0.95, 0, .0, 8, 0.0007, 1), /*  80 */
        new ABRPresets(96, 9, 9, 0, 2.50, 6.60, 145, 0, 0.95, 0, 1.0, 5.5, 0.0006, 1), /*  96 */
        new ABRPresets(112, 9, 9, 0, 2.25, 6.60, 145, 0, 0.95, 0, 2.0, 4.5, 0.0005, 1), /* 112 */
        new ABRPresets(128, 9, 9, 0, 1.95, 6.40, 140, 0, 0.95, 0, 3.0, 4, 0.0002, 1), /* 128 */
        new ABRPresets(160, 9, 9, 1, 1.79, 6.00, 135, 0, 0.95, -2, 5.0, 3.5, 0, 1), /* 160 */
        new ABRPresets(192, 9, 9, 1, 1.49, 5.60, 125, 0, 0.97, -4, 7.0, 3, 0, 0), /* 192 */
        new ABRPresets(224, 9, 9, 1, 1.25, 5.20, 125, 0, 0.98, -6, 9.0, 2, 0, 0), /* 224 */
        new ABRPresets(256, 9, 9, 1, 0.97, 5.20, 125, 0, 1.00, -8, 10.0, 1, 0, 0), /* 256 */
        new ABRPresets(320, 9, 9, 1, 0.90, 5.20, 125, 0, 1.00, -10, 12.0, 0, 0, 0)  /* 320 */
    ];

    function apply_abr_preset(gfp, preset, enforce) {
        /* Variables for the ABR stuff */
        var actual_bitrate = preset;

        var r = lame.nearestBitrateFullIndex(preset);

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
            gfp.exp_nspsytune = gfp.exp_nspsytune | 2;
        /* safejoint */

        if (abr_switch_map[r].sfscale > 0) {
            gfp.internal_flags.noise_shaping = 2;
        }
        /* ns-bass tweaks */
        if (Math.abs(abr_switch_map[r].nsbass) > 0) {
            var k = (int)(abr_switch_map[r].nsbass * 4);
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
                gfp.maskingadjust_short = (abr_switch_map[r].masking_adj * .9);
            else if (!(Math.abs(gfp.maskingadjust_short - 0) > 0))
                gfp.maskingadjust_short = (abr_switch_map[r].masking_adj * .9);
            // SET_OPTION(maskingadjust_short, abr_switch_map[r].masking_adj *
            // .9, 0);
        } else {
            if (enforce != 0)
                gfp.maskingadjust_short = (abr_switch_map[r].masking_adj * 1.1);
            else if (!(Math.abs(gfp.maskingadjust_short - 0) > 0))
                gfp.maskingadjust_short = (abr_switch_map[r].masking_adj * 1.1);
            // SET_OPTION(maskingadjust_short, abr_switch_map[r].masking_adj *
            // 1.1, 0);
        }

        if (enforce != 0)
            gfp.ATHlower = -abr_switch_map[r].ath_lower / 10.;
        else if (!(Math.abs((-gfp.ATHlower * 10.) - 0) > 0))
            gfp.ATHlower = -abr_switch_map[r].ath_lower / 10.;
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

    this.apply_preset = function(gfp, preset, enforce) {
        /* translate legacy presets */
        switch (preset) {
            case Lame.R3MIX:
            {
                preset = Lame.V3;
                gfp.VBR = VbrMode.vbr_mtrh;
                break;
            }
            case Lame.MEDIUM:
            {
                preset = Lame.V4;
                gfp.VBR = VbrMode.vbr_rh;
                break;
            }
            case Lame.MEDIUM_FAST:
            {
                preset = Lame.V4;
                gfp.VBR = VbrMode.vbr_mtrh;
                break;
            }
            case Lame.STANDARD:
            {
                preset = Lame.V2;
                gfp.VBR = VbrMode.vbr_rh;
                break;
            }
            case Lame.STANDARD_FAST:
            {
                preset = Lame.V2;
                gfp.VBR = VbrMode.vbr_mtrh;
                break;
            }
            case Lame.EXTREME:
            {
                preset = Lame.V0;
                gfp.VBR = VbrMode.vbr_rh;
                break;
            }
            case Lame.EXTREME_FAST:
            {
                preset = Lame.V0;
                gfp.VBR = VbrMode.vbr_mtrh;
                break;
            }
            case Lame.INSANE:
            {
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
    function lame_set_VBR_q(gfp, VBR_q) {
        var ret = 0;

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

module.exports = Presets;
