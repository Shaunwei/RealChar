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

var Encoder = require('./Encoder.js');

function FFT() {

    var window = new_float(Encoder.BLKSIZE);
    var window_s = new_float(Encoder.BLKSIZE_s / 2);

    var costab = [
        9.238795325112867e-01, 3.826834323650898e-01,
        9.951847266721969e-01, 9.801714032956060e-02,
        9.996988186962042e-01, 2.454122852291229e-02,
        9.999811752826011e-01, 6.135884649154475e-03
    ];

    function fht(fz, fzPos, n) {
        var tri = 0;
        var k4;
        var fi;
        var gi;

        n <<= 1;
        /* to get BLKSIZE, because of 3DNow! ASM routine */
        var fn = fzPos + n;
        k4 = 4;
        do {
            var s1, c1;
            var i, k1, k2, k3, kx;
            kx = k4 >> 1;
            k1 = k4;
            k2 = k4 << 1;
            k3 = k2 + k1;
            k4 = k2 << 1;
            fi = fzPos;
            gi = fi + kx;
            do {
                var f0, f1, f2, f3;
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
                f3 = (Util.SQRT2 * fz[gi + k3]);
                f2 = (Util.SQRT2 * fz[gi + k2]);
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
                var c2, s2;
                c2 = 1 - (2 * s1) * s1;
                s2 = (2 * s1) * c1;
                fi = fzPos + i;
                gi = fzPos + k1 - i;
                do {
                    var a, b, g0, f0, f1, g1, f2, g2, f3, g3;
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

    var rv_tbl = [0x00, 0x80, 0x40,
        0xc0, 0x20, 0xa0, 0x60, 0xe0, 0x10,
        0x90, 0x50, 0xd0, 0x30, 0xb0, 0x70,
        0xf0, 0x08, 0x88, 0x48, 0xc8, 0x28,
        0xa8, 0x68, 0xe8, 0x18, 0x98, 0x58,
        0xd8, 0x38, 0xb8, 0x78, 0xf8, 0x04,
        0x84, 0x44, 0xc4, 0x24, 0xa4, 0x64,
        0xe4, 0x14, 0x94, 0x54, 0xd4, 0x34,
        0xb4, 0x74, 0xf4, 0x0c, 0x8c, 0x4c,
        0xcc, 0x2c, 0xac, 0x6c, 0xec, 0x1c,
        0x9c, 0x5c, 0xdc, 0x3c, 0xbc, 0x7c,
        0xfc, 0x02, 0x82, 0x42, 0xc2, 0x22,
        0xa2, 0x62, 0xe2, 0x12, 0x92, 0x52,
        0xd2, 0x32, 0xb2, 0x72, 0xf2, 0x0a,
        0x8a, 0x4a, 0xca, 0x2a, 0xaa, 0x6a,
        0xea, 0x1a, 0x9a, 0x5a, 0xda, 0x3a,
        0xba, 0x7a, 0xfa, 0x06, 0x86, 0x46,
        0xc6, 0x26, 0xa6, 0x66, 0xe6, 0x16,
        0x96, 0x56, 0xd6, 0x36, 0xb6, 0x76,
        0xf6, 0x0e, 0x8e, 0x4e, 0xce, 0x2e,
        0xae, 0x6e, 0xee, 0x1e, 0x9e, 0x5e,
        0xde, 0x3e, 0xbe, 0x7e, 0xfe];

    this.fft_short = function (gfc, x_real, chn, buffer, bufPos) {
        for (var b = 0; b < 3; b++) {
            var x = Encoder.BLKSIZE_s / 2;
            var k = 0xffff & ((576 / 3) * (b + 1));
            var j = Encoder.BLKSIZE_s / 8 - 1;
            do {
                var f0, f1, f2, f3, w;
                var i = rv_tbl[j << 2] & 0xff;

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

    this.fft_long = function (gfc, y, chn, buffer, bufPos) {
        var jj = Encoder.BLKSIZE / 8 - 1;
        var x = Encoder.BLKSIZE / 2;

        do {
            var f0, f1, f2, f3, w;
            var i = rv_tbl[jj] & 0xff;
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

    this.init_fft = function (gfc) {
        /* The type of window used here will make no real difference, but */
        /*
         * in the interest of merging nspsytune stuff - switch to blackman
         * window
         */
        for (var i = 0; i < Encoder.BLKSIZE; i++)
            /* blackman window */
            window[i] = (0.42 - 0.5 * Math.cos(2 * Math.PI * (i + .5)
                / Encoder.BLKSIZE) + 0.08 * Math.cos(4 * Math.PI * (i + .5)
                / Encoder.BLKSIZE));

        for (var i = 0; i < Encoder.BLKSIZE_s / 2; i++)
            window_s[i] = (0.5 * (1.0 - Math.cos(2.0 * Math.PI
                * (i + 0.5) / Encoder.BLKSIZE_s)));

    }

}

module.exports = FFT;
