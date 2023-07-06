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

var Takehiro = require('./Takehiro.js');
var Tables = require('./Tables.js');
var Encoder = require('./Encoder.js');
var LameInternalFlags = require('./LameInternalFlags.js');

BitStream.EQ = function (a, b) {
    return (Math.abs(a) > Math.abs(b)) ? (Math.abs((a) - (b)) <= (Math
        .abs(a) * 1e-6))
        : (Math.abs((a) - (b)) <= (Math.abs(b) * 1e-6));
};

BitStream.NEQ = function (a, b) {
    return !BitStream.EQ(a, b);
};

function BitStream() {
    var self = this;
    var CRC16_POLYNOMIAL = 0x8005;

    /*
     * we work with ints, so when doing bit manipulation, we limit ourselves to
     * MAX_LENGTH-2 just to be on the safe side
     */
    var MAX_LENGTH = 32;

    //GainAnalysis ga;
    //MPGLib mpg;
    //Version ver;
    //VBRTag vbr;
    var ga = null;
    var mpg = null;
    var ver = null;
    var vbr = null;

    //public final void setModules(GainAnalysis ga, MPGLib mpg, Version ver,
    //	VBRTag vbr) {

    this.setModules = function (_ga, _mpg, _ver, _vbr) {
        ga = _ga;
        mpg = _mpg;
        ver = _ver;
        vbr = _vbr;
    };

    /**
     * Bit stream buffer.
     */
    //private byte[] buf;
    var buf = null;
    /**
     * Bit counter of bit stream.
     */
    var totbit = 0;
    /**
     * Pointer to top byte in buffer.
     */
    var bufByteIdx = 0;
    /**
     * Pointer to top bit of top byte in buffer.
     */
    var bufBitIdx = 0;

    /**
     * compute bitsperframe and mean_bits for a layer III frame
     */
    this.getframebits = function (gfp) {
        var gfc = gfp.internal_flags;
        var bit_rate;

        /* get bitrate in kbps [?] */
        if (gfc.bitrate_index != 0)
            bit_rate = Tables.bitrate_table[gfp.version][gfc.bitrate_index];
        else
            bit_rate = gfp.brate;
        assert(8 <= bit_rate && bit_rate <= 640);

        /* main encoding routine toggles padding on and off */
        /* one Layer3 Slot consists of 8 bits */
        var bytes = 0 | (gfp.version + 1) * 72000 * bit_rate / gfp.out_samplerate + gfc.padding;
        return 8 * bytes;
    };

    function putheader_bits(gfc) {
        System.arraycopy(gfc.header[gfc.w_ptr].buf, 0, buf, bufByteIdx, gfc.sideinfo_len);
        bufByteIdx += gfc.sideinfo_len;
        totbit += gfc.sideinfo_len * 8;
        gfc.w_ptr = (gfc.w_ptr + 1) & (LameInternalFlags.MAX_HEADER_BUF - 1);
    }

    /**
     * write j bits into the bit stream
     */
    function putbits2(gfc, val, j) {
        assert(j < MAX_LENGTH - 2);

        while (j > 0) {
            var k;
            if (bufBitIdx == 0) {
                bufBitIdx = 8;
                bufByteIdx++;
                assert(bufByteIdx < Lame.LAME_MAXMP3BUFFER);
                assert(gfc.header[gfc.w_ptr].write_timing >= totbit);
                if (gfc.header[gfc.w_ptr].write_timing == totbit) {
                    putheader_bits(gfc);
                }
                buf[bufByteIdx] = 0;
            }

            k = Math.min(j, bufBitIdx);
            j -= k;

            bufBitIdx -= k;

            assert(j < MAX_LENGTH);
            /* 32 too large on 32 bit machines */
            assert(bufBitIdx < MAX_LENGTH);

            buf[bufByteIdx] |= ((val >> j) << bufBitIdx);
            totbit += k;
        }
    }

    /**
     * write j bits into the bit stream, ignoring frame headers
     */
    function putbits_noheaders(gfc, val, j) {
        assert(j < MAX_LENGTH - 2);

        while (j > 0) {
            var k;
            if (bufBitIdx == 0) {
                bufBitIdx = 8;
                bufByteIdx++;
                assert(bufByteIdx < Lame.LAME_MAXMP3BUFFER);
                buf[bufByteIdx] = 0;
            }

            k = Math.min(j, bufBitIdx);
            j -= k;

            bufBitIdx -= k;

            assert(j < MAX_LENGTH);
            /* 32 too large on 32 bit machines */
            assert(bufBitIdx < MAX_LENGTH);

            buf[bufByteIdx] |= ((val >> j) << bufBitIdx);
            totbit += k;
        }
    }

    /**
     * Some combinations of bitrate, Fs, and stereo make it impossible to stuff
     * out a frame using just main_data, due to the limited number of bits to
     * indicate main_data_length. In these situations, we put stuffing bits into
     * the ancillary data...
     */
    function drain_into_ancillary(gfp, remainingBits) {
        var gfc = gfp.internal_flags;
        var i;
        assert(remainingBits >= 0);

        if (remainingBits >= 8) {
            putbits2(gfc, 0x4c, 8);
            remainingBits -= 8;
        }
        if (remainingBits >= 8) {
            putbits2(gfc, 0x41, 8);
            remainingBits -= 8;
        }
        if (remainingBits >= 8) {
            putbits2(gfc, 0x4d, 8);
            remainingBits -= 8;
        }
        if (remainingBits >= 8) {
            putbits2(gfc, 0x45, 8);
            remainingBits -= 8;
        }

        if (remainingBits >= 32) {
            var version = ver.getLameShortVersion();
            if (remainingBits >= 32)
                for (i = 0; i < version.length && remainingBits >= 8; ++i) {
                    remainingBits -= 8;
                    putbits2(gfc, version.charAt(i), 8);
                }
        }

        for (; remainingBits >= 1; remainingBits -= 1) {
            putbits2(gfc, gfc.ancillary_flag, 1);
            gfc.ancillary_flag ^= (!gfp.disable_reservoir ? 1 : 0);
        }

        assert(remainingBits == 0);

    }

    /**
     * write N bits into the header
     */
    function writeheader(gfc, val, j) {
        var ptr = gfc.header[gfc.h_ptr].ptr;

        while (j > 0) {
            var k = Math.min(j, 8 - (ptr & 7));
            j -= k;
            assert(j < MAX_LENGTH);
            /* >> 32 too large for 32 bit machines */

            gfc.header[gfc.h_ptr].buf[ptr >> 3] |= ((val >> j)) << (8 - (ptr & 7) - k);
            ptr += k;
        }
        gfc.header[gfc.h_ptr].ptr = ptr;
    }

    function CRC_update(value, crc) {
        value <<= 8;
        for (var i = 0; i < 8; i++) {
            value <<= 1;
            crc <<= 1;

            if ((((crc ^ value) & 0x10000) != 0))
                crc ^= CRC16_POLYNOMIAL;
        }
        return crc;
    }

    this.CRC_writeheader = function (gfc, header) {
        var crc = 0xffff;
        /* (jo) init crc16 for error_protection */

        crc = CRC_update(header[2] & 0xff, crc);
        crc = CRC_update(header[3] & 0xff, crc);
        for (var i = 6; i < gfc.sideinfo_len; i++) {
            crc = CRC_update(header[i] & 0xff, crc);
        }

        header[4] = (byte)(crc >> 8);
        header[5] = (byte)(crc & 255);
    };

    function encodeSideInfo2(gfp, bitsPerFrame) {
        var gfc = gfp.internal_flags;
        var l3_side;
        var gr, ch;

        l3_side = gfc.l3_side;
        gfc.header[gfc.h_ptr].ptr = 0;
        Arrays.fill(gfc.header[gfc.h_ptr].buf, 0, gfc.sideinfo_len, 0);
        if (gfp.out_samplerate < 16000)
            writeheader(gfc, 0xffe, 12);
        else
            writeheader(gfc, 0xfff, 12);
        writeheader(gfc, (gfp.version), 1);
        writeheader(gfc, 4 - 3, 2);
        writeheader(gfc, (!gfp.error_protection ? 1 : 0), 1);
        writeheader(gfc, (gfc.bitrate_index), 4);
        writeheader(gfc, (gfc.samplerate_index), 2);
        writeheader(gfc, (gfc.padding), 1);
        writeheader(gfc, (gfp.extension), 1);
        writeheader(gfc, (gfp.mode.ordinal()), 2);
        writeheader(gfc, (gfc.mode_ext), 2);
        writeheader(gfc, (gfp.copyright), 1);
        writeheader(gfc, (gfp.original), 1);
        writeheader(gfc, (gfp.emphasis), 2);
        if (gfp.error_protection) {
            writeheader(gfc, 0, 16);
            /* dummy */
        }

        if (gfp.version == 1) {
            /* MPEG1 */
            assert(l3_side.main_data_begin >= 0);
            writeheader(gfc, (l3_side.main_data_begin), 9);

            if (gfc.channels_out == 2)
                writeheader(gfc, l3_side.private_bits, 3);
            else
                writeheader(gfc, l3_side.private_bits, 5);

            for (ch = 0; ch < gfc.channels_out; ch++) {
                var band;
                for (band = 0; band < 4; band++) {
                    writeheader(gfc, l3_side.scfsi[ch][band], 1);
                }
            }

            for (gr = 0; gr < 2; gr++) {
                for (ch = 0; ch < gfc.channels_out; ch++) {
                    var gi = l3_side.tt[gr][ch];
                    writeheader(gfc, gi.part2_3_length + gi.part2_length, 12);
                    writeheader(gfc, gi.big_values / 2, 9);
                    writeheader(gfc, gi.global_gain, 8);
                    writeheader(gfc, gi.scalefac_compress, 4);

                    if (gi.block_type != Encoder.NORM_TYPE) {
                        writeheader(gfc, 1, 1);
                        /* window_switching_flag */
                        writeheader(gfc, gi.block_type, 2);
                        writeheader(gfc, gi.mixed_block_flag, 1);

                        if (gi.table_select[0] == 14)
                            gi.table_select[0] = 16;
                        writeheader(gfc, gi.table_select[0], 5);
                        if (gi.table_select[1] == 14)
                            gi.table_select[1] = 16;
                        writeheader(gfc, gi.table_select[1], 5);

                        writeheader(gfc, gi.subblock_gain[0], 3);
                        writeheader(gfc, gi.subblock_gain[1], 3);
                        writeheader(gfc, gi.subblock_gain[2], 3);
                    } else {
                        writeheader(gfc, 0, 1);
                        /* window_switching_flag */
                        if (gi.table_select[0] == 14)
                            gi.table_select[0] = 16;
                        writeheader(gfc, gi.table_select[0], 5);
                        if (gi.table_select[1] == 14)
                            gi.table_select[1] = 16;
                        writeheader(gfc, gi.table_select[1], 5);
                        if (gi.table_select[2] == 14)
                            gi.table_select[2] = 16;
                        writeheader(gfc, gi.table_select[2], 5);

                        assert(0 <= gi.region0_count && gi.region0_count < 16);
                        assert(0 <= gi.region1_count && gi.region1_count < 8);
                        writeheader(gfc, gi.region0_count, 4);
                        writeheader(gfc, gi.region1_count, 3);
                    }
                    writeheader(gfc, gi.preflag, 1);
                    writeheader(gfc, gi.scalefac_scale, 1);
                    writeheader(gfc, gi.count1table_select, 1);
                }
            }
        } else {
            /* MPEG2 */
            assert(l3_side.main_data_begin >= 0);
            writeheader(gfc, (l3_side.main_data_begin), 8);
            writeheader(gfc, l3_side.private_bits, gfc.channels_out);

            gr = 0;
            for (ch = 0; ch < gfc.channels_out; ch++) {
                var gi = l3_side.tt[gr][ch];
                writeheader(gfc, gi.part2_3_length + gi.part2_length, 12);
                writeheader(gfc, gi.big_values / 2, 9);
                writeheader(gfc, gi.global_gain, 8);
                writeheader(gfc, gi.scalefac_compress, 9);

                if (gi.block_type != Encoder.NORM_TYPE) {
                    writeheader(gfc, 1, 1);
                    /* window_switching_flag */
                    writeheader(gfc, gi.block_type, 2);
                    writeheader(gfc, gi.mixed_block_flag, 1);

                    if (gi.table_select[0] == 14)
                        gi.table_select[0] = 16;
                    writeheader(gfc, gi.table_select[0], 5);
                    if (gi.table_select[1] == 14)
                        gi.table_select[1] = 16;
                    writeheader(gfc, gi.table_select[1], 5);

                    writeheader(gfc, gi.subblock_gain[0], 3);
                    writeheader(gfc, gi.subblock_gain[1], 3);
                    writeheader(gfc, gi.subblock_gain[2], 3);
                } else {
                    writeheader(gfc, 0, 1);
                    /* window_switching_flag */
                    if (gi.table_select[0] == 14)
                        gi.table_select[0] = 16;
                    writeheader(gfc, gi.table_select[0], 5);
                    if (gi.table_select[1] == 14)
                        gi.table_select[1] = 16;
                    writeheader(gfc, gi.table_select[1], 5);
                    if (gi.table_select[2] == 14)
                        gi.table_select[2] = 16;
                    writeheader(gfc, gi.table_select[2], 5);

                    assert(0 <= gi.region0_count && gi.region0_count < 16);
                    assert(0 <= gi.region1_count && gi.region1_count < 8);
                    writeheader(gfc, gi.region0_count, 4);
                    writeheader(gfc, gi.region1_count, 3);
                }

                writeheader(gfc, gi.scalefac_scale, 1);
                writeheader(gfc, gi.count1table_select, 1);
            }
        }

        if (gfp.error_protection) {
            /* (jo) error_protection: add crc16 information to header */
            CRC_writeheader(gfc, gfc.header[gfc.h_ptr].buf);
        }

        {
            var old = gfc.h_ptr;
            assert(gfc.header[old].ptr == gfc.sideinfo_len * 8);

            gfc.h_ptr = (old + 1) & (LameInternalFlags.MAX_HEADER_BUF - 1);
            gfc.header[gfc.h_ptr].write_timing = gfc.header[old].write_timing
                + bitsPerFrame;

            if (gfc.h_ptr == gfc.w_ptr) {
                /* yikes! we are out of header buffer space */
                System.err
                    .println("Error: MAX_HEADER_BUF too small in bitstream.c \n");
            }

        }
    }

    function huffman_coder_count1(gfc, gi) {
        /* Write count1 area */
        var h = Tables.ht[gi.count1table_select + 32];
        var i, bits = 0;

        var ix = gi.big_values;
        var xr = gi.big_values;
        assert(gi.count1table_select < 2);

        for (i = (gi.count1 - gi.big_values) / 4; i > 0; --i) {
            var huffbits = 0;
            var p = 0, v;

            v = gi.l3_enc[ix + 0];
            if (v != 0) {
                p += 8;
                if (gi.xr[xr + 0] < 0)
                    huffbits++;
                assert(v <= 1);
            }

            v = gi.l3_enc[ix + 1];
            if (v != 0) {
                p += 4;
                huffbits *= 2;
                if (gi.xr[xr + 1] < 0)
                    huffbits++;
                assert(v <= 1);
            }

            v = gi.l3_enc[ix + 2];
            if (v != 0) {
                p += 2;
                huffbits *= 2;
                if (gi.xr[xr + 2] < 0)
                    huffbits++;
                assert(v <= 1);
            }

            v = gi.l3_enc[ix + 3];
            if (v != 0) {
                p++;
                huffbits *= 2;
                if (gi.xr[xr + 3] < 0)
                    huffbits++;
                assert(v <= 1);
            }

            ix += 4;
            xr += 4;
            putbits2(gfc, huffbits + h.table[p], h.hlen[p]);
            bits += h.hlen[p];
        }
        return bits;
    }

    /**
     * Implements the pseudocode of page 98 of the IS
     */
    function Huffmancode(gfc, tableindex, start, end, gi) {
        var h = Tables.ht[tableindex];
        var bits = 0;

        assert(tableindex < 32);
        if (0 == tableindex)
            return bits;

        for (var i = start; i < end; i += 2) {
            var cbits = 0;
            var xbits = 0;
            var linbits = h.xlen;
            var xlen = h.xlen;
            var ext = 0;
            var x1 = gi.l3_enc[i];
            var x2 = gi.l3_enc[i + 1];

            if (x1 != 0) {
                if (gi.xr[i] < 0)
                    ext++;
                cbits--;
            }

            if (tableindex > 15) {
                /* use ESC-words */
                if (x1 > 14) {
                    var linbits_x1 = x1 - 15;
                    assert(linbits_x1 <= h.linmax);
                    ext |= linbits_x1 << 1;
                    xbits = linbits;
                    x1 = 15;
                }

                if (x2 > 14) {
                    var linbits_x2 = x2 - 15;
                    assert(linbits_x2 <= h.linmax);
                    ext <<= linbits;
                    ext |= linbits_x2;
                    xbits += linbits;
                    x2 = 15;
                }
                xlen = 16;
            }

            if (x2 != 0) {
                ext <<= 1;
                if (gi.xr[i + 1] < 0)
                    ext++;
                cbits--;
            }

            assert((x1 | x2) < 16);

            x1 = x1 * xlen + x2;
            xbits -= cbits;
            cbits += h.hlen[x1];

            assert(cbits <= MAX_LENGTH);
            assert(xbits <= MAX_LENGTH);

            putbits2(gfc, h.table[x1], cbits);
            putbits2(gfc, ext, xbits);
            bits += cbits + xbits;
        }
        return bits;
    }

    /**
     * Note the discussion of huffmancodebits() on pages 28 and 29 of the IS, as
     * well as the definitions of the side information on pages 26 and 27.
     */
    function ShortHuffmancodebits(gfc, gi) {
        var region1Start = 3 * gfc.scalefac_band.s[3];
        if (region1Start > gi.big_values)
            region1Start = gi.big_values;

        /* short blocks do not have a region2 */
        var bits = Huffmancode(gfc, gi.table_select[0], 0, region1Start, gi);
        bits += Huffmancode(gfc, gi.table_select[1], region1Start,
            gi.big_values, gi);
        return bits;
    }

    function LongHuffmancodebits(gfc, gi) {
        var bigvalues, bits;
        var region1Start, region2Start;

        bigvalues = gi.big_values;
        assert(0 <= bigvalues && bigvalues <= 576);

        var i = gi.region0_count + 1;
        assert(0 <= i);
        assert(i < gfc.scalefac_band.l.length);
        region1Start = gfc.scalefac_band.l[i];
        i += gi.region1_count + 1;
        assert(0 <= i);
        assert(i < gfc.scalefac_band.l.length);
        region2Start = gfc.scalefac_band.l[i];

        if (region1Start > bigvalues)
            region1Start = bigvalues;

        if (region2Start > bigvalues)
            region2Start = bigvalues;

        bits = Huffmancode(gfc, gi.table_select[0], 0, region1Start, gi);
        bits += Huffmancode(gfc, gi.table_select[1], region1Start,
            region2Start, gi);
        bits += Huffmancode(gfc, gi.table_select[2], region2Start, bigvalues,
            gi);
        return bits;
    }

    function writeMainData(gfp) {
        var gr, ch, sfb, data_bits, tot_bits = 0;
        var gfc = gfp.internal_flags;
        var l3_side = gfc.l3_side;

        if (gfp.version == 1) {
            /* MPEG 1 */
            for (gr = 0; gr < 2; gr++) {
                for (ch = 0; ch < gfc.channels_out; ch++) {
                    var gi = l3_side.tt[gr][ch];
                    var slen1 = Takehiro.slen1_tab[gi.scalefac_compress];
                    var slen2 = Takehiro.slen2_tab[gi.scalefac_compress];
                    data_bits = 0;
                    for (sfb = 0; sfb < gi.sfbdivide; sfb++) {
                        if (gi.scalefac[sfb] == -1)
                            continue;
                        /* scfsi is used */
                        putbits2(gfc, gi.scalefac[sfb], slen1);
                        data_bits += slen1;
                    }
                    for (; sfb < gi.sfbmax; sfb++) {
                        if (gi.scalefac[sfb] == -1)
                            continue;
                        /* scfsi is used */
                        putbits2(gfc, gi.scalefac[sfb], slen2);
                        data_bits += slen2;
                    }
                    assert(data_bits == gi.part2_length);

                    if (gi.block_type == Encoder.SHORT_TYPE) {
                        data_bits += ShortHuffmancodebits(gfc, gi);
                    } else {
                        data_bits += LongHuffmancodebits(gfc, gi);
                    }
                    data_bits += huffman_coder_count1(gfc, gi);
                    /* does bitcount in quantize.c agree with actual bit count? */
                    assert(data_bits == gi.part2_3_length + gi.part2_length);
                    tot_bits += data_bits;
                }
                /* for ch */
            }
            /* for gr */
        } else {
            /* MPEG 2 */
            gr = 0;
            for (ch = 0; ch < gfc.channels_out; ch++) {
                var gi = l3_side.tt[gr][ch];
                var i, sfb_partition, scale_bits = 0;
                assert(gi.sfb_partition_table != null);
                data_bits = 0;
                sfb = 0;
                sfb_partition = 0;

                if (gi.block_type == Encoder.SHORT_TYPE) {
                    for (; sfb_partition < 4; sfb_partition++) {
                        var sfbs = gi.sfb_partition_table[sfb_partition] / 3;
                        var slen = gi.slen[sfb_partition];
                        for (i = 0; i < sfbs; i++, sfb++) {
                            putbits2(gfc,
                                Math.max(gi.scalefac[sfb * 3 + 0], 0), slen);
                            putbits2(gfc,
                                Math.max(gi.scalefac[sfb * 3 + 1], 0), slen);
                            putbits2(gfc,
                                Math.max(gi.scalefac[sfb * 3 + 2], 0), slen);
                            scale_bits += 3 * slen;
                        }
                    }
                    data_bits += ShortHuffmancodebits(gfc, gi);
                } else {
                    for (; sfb_partition < 4; sfb_partition++) {
                        var sfbs = gi.sfb_partition_table[sfb_partition];
                        var slen = gi.slen[sfb_partition];
                        for (i = 0; i < sfbs; i++, sfb++) {
                            putbits2(gfc, Math.max(gi.scalefac[sfb], 0), slen);
                            scale_bits += slen;
                        }
                    }
                    data_bits += LongHuffmancodebits(gfc, gi);
                }
                data_bits += huffman_coder_count1(gfc, gi);
                /* does bitcount in quantize.c agree with actual bit count? */
                assert(data_bits == gi.part2_3_length);
                assert(scale_bits == gi.part2_length);
                tot_bits += scale_bits + data_bits;
            }
            /* for ch */
        }
        /* for gf */
        return tot_bits;
    }

    /* main_data */

    function TotalBytes() {
        this.total = 0;
    }

    /*
     * compute the number of bits required to flush all mp3 frames currently in
     * the buffer. This should be the same as the reservoir size. Only call this
     * routine between frames - i.e. only after all headers and data have been
     * added to the buffer by format_bitstream().
     *
     * Also compute total_bits_output = size of mp3 buffer (including frame
     * headers which may not have yet been send to the mp3 buffer) + number of
     * bits needed to flush all mp3 frames.
     *
     * total_bytes_output is the size of the mp3 output buffer if
     * lame_encode_flush_nogap() was called right now.
     */
    function compute_flushbits(gfp, total_bytes_output) {
        var gfc = gfp.internal_flags;
        var flushbits, remaining_headers;
        var bitsPerFrame;
        var last_ptr, first_ptr;
        first_ptr = gfc.w_ptr;
        /* first header to add to bitstream */
        last_ptr = gfc.h_ptr - 1;
        /* last header to add to bitstream */
        if (last_ptr == -1)
            last_ptr = LameInternalFlags.MAX_HEADER_BUF - 1;

        /* add this many bits to bitstream so we can flush all headers */
        flushbits = gfc.header[last_ptr].write_timing - totbit;
        total_bytes_output.total = flushbits;

        if (flushbits >= 0) {
            /* if flushbits >= 0, some headers have not yet been written */
            /* reduce flushbits by the size of the headers */
            remaining_headers = 1 + last_ptr - first_ptr;
            if (last_ptr < first_ptr)
                remaining_headers = 1 + last_ptr - first_ptr
                    + LameInternalFlags.MAX_HEADER_BUF;
            flushbits -= remaining_headers * 8 * gfc.sideinfo_len;
        }

        /*
         * finally, add some bits so that the last frame is complete these bits
         * are not necessary to decode the last frame, but some decoders will
         * ignore last frame if these bits are missing
         */
        bitsPerFrame = self.getframebits(gfp);
        flushbits += bitsPerFrame;
        total_bytes_output.total += bitsPerFrame;
        /* round up: */
        if ((total_bytes_output.total % 8) != 0)
            total_bytes_output.total = 1 + (total_bytes_output.total / 8);
        else
            total_bytes_output.total = (total_bytes_output.total / 8);
        total_bytes_output.total += bufByteIdx + 1;

        if (flushbits < 0) {
            System.err.println("strange error flushing buffer ... \n");
        }
        return flushbits;
    }

    this.flush_bitstream = function (gfp) {
        var gfc = gfp.internal_flags;
        var l3_side;
        var flushbits;
        var last_ptr = gfc.h_ptr - 1;
        /* last header to add to bitstream */
        if (last_ptr == -1)
            last_ptr = LameInternalFlags.MAX_HEADER_BUF - 1;
        l3_side = gfc.l3_side;

        if ((flushbits = compute_flushbits(gfp, new TotalBytes())) < 0)
            return;
        drain_into_ancillary(gfp, flushbits);

        /* check that the 100% of the last frame has been written to bitstream */
        assert(gfc.header[last_ptr].write_timing + this.getframebits(gfp) == totbit);

        /*
         * we have padded out all frames with ancillary data, which is the same
         * as filling the bitreservoir with ancillary data, so :
         */
        gfc.ResvSize = 0;
        l3_side.main_data_begin = 0;

        /* save the ReplayGain value */
        if (gfc.findReplayGain) {
            var RadioGain = ga.GetTitleGain(gfc.rgdata);
            assert(NEQ(RadioGain, GainAnalysis.GAIN_NOT_ENOUGH_SAMPLES));
            gfc.RadioGain = Math.floor(RadioGain * 10.0 + 0.5) | 0;
            /* round to nearest */
        }

        /* find the gain and scale change required for no clipping */
        if (gfc.findPeakSample) {
            gfc.noclipGainChange = Math.ceil(Math
                        .log10(gfc.PeakSample / 32767.0) * 20.0 * 10.0) | 0;
            /* round up */

            if (gfc.noclipGainChange > 0) {
                /* clipping occurs */
                if (EQ(gfp.scale, 1.0) || EQ(gfp.scale, 0.0))
                    gfc.noclipScale = (Math
                        .floor((32767.0 / gfc.PeakSample) * 100.0) / 100.0);
                /* round down */
                else {
                    /*
                     * the user specified his own scaling factor. We could
                     * suggest the scaling factor of
                     * (32767.0/gfp.PeakSample)*(gfp.scale) but it's usually
                     * very inaccurate. So we'd rather not advice him on the
                     * scaling factor.
                     */
                    gfc.noclipScale = -1;
                }
            } else
            /* no clipping */
                gfc.noclipScale = -1;
        }
    };

    this.add_dummy_byte = function (gfp, val, n) {
        var gfc = gfp.internal_flags;
        var i;

        while (n-- > 0) {
            putbits_noheaders(gfc, val, 8);

            for (i = 0; i < LameInternalFlags.MAX_HEADER_BUF; ++i)
                gfc.header[i].write_timing += 8;
        }
    };

    /**
     * This is called after a frame of audio has been quantized and coded. It
     * will write the encoded audio to the bitstream. Note that from a layer3
     * encoder's perspective the bit stream is primarily a series of main_data()
     * blocks, with header and side information inserted at the proper locations
     * to maintain framing. (See Figure A.7 in the IS).
     */
    this.format_bitstream = function (gfp) {
        var gfc = gfp.internal_flags;
        var l3_side;
        l3_side = gfc.l3_side;

        var bitsPerFrame = this.getframebits(gfp);
        drain_into_ancillary(gfp, l3_side.resvDrain_pre);

        encodeSideInfo2(gfp, bitsPerFrame);
        var bits = 8 * gfc.sideinfo_len;
        bits += writeMainData(gfp);
        drain_into_ancillary(gfp, l3_side.resvDrain_post);
        bits += l3_side.resvDrain_post;

        l3_side.main_data_begin += (bitsPerFrame - bits) / 8;

        /*
         * compare number of bits needed to clear all buffered mp3 frames with
         * what we think the resvsize is:
         */
        if (compute_flushbits(gfp, new TotalBytes()) != gfc.ResvSize) {
            System.err.println("Internal buffer inconsistency. flushbits <> ResvSize");
        }

        /*
         * compare main_data_begin for the next frame with what we think the
         * resvsize is:
         */
        if ((l3_side.main_data_begin * 8) != gfc.ResvSize) {
            System.err.printf("bit reservoir error: \n"
                + "l3_side.main_data_begin: %d \n"
                + "Resvoir size:             %d \n"
                + "resv drain (post)         %d \n"
                + "resv drain (pre)          %d \n"
                + "header and sideinfo:      %d \n"
                + "data bits:                %d \n"
                + "total bits:               %d (remainder: %d) \n"
                + "bitsperframe:             %d \n",
                8 * l3_side.main_data_begin, gfc.ResvSize,
                l3_side.resvDrain_post, l3_side.resvDrain_pre,
                8 * gfc.sideinfo_len, bits - l3_side.resvDrain_post - 8
                * gfc.sideinfo_len, bits, bits % 8, bitsPerFrame);

            System.err.println("This is a fatal error.  It has several possible causes:");
            System.err.println("90%%  LAME compiled with buggy version of gcc using advanced optimizations");
            System.err.println(" 9%%  Your system is overclocked");
            System.err.println(" 1%%  bug in LAME encoding library");

            gfc.ResvSize = l3_side.main_data_begin * 8;
        }
        //;
        assert(totbit % 8 == 0);

        if (totbit > 1000000000) {
            /*
             * to avoid totbit overflow, (at 8h encoding at 128kbs) lets reset
             * bit counter
             */
            var i;
            for (i = 0; i < LameInternalFlags.MAX_HEADER_BUF; ++i)
                gfc.header[i].write_timing -= totbit;
            totbit = 0;
        }

        return 0;
    };

    /**
     * <PRE>
     * copy data out of the internal MP3 bit buffer into a user supplied
     *       unsigned char buffer.
     *
     *       mp3data=0      indicates data in buffer is an id3tags and VBR tags
     *       mp3data=1      data is real mp3 frame data.
     * </PRE>
     */
    this.copy_buffer = function (gfc, buffer, bufferPos, size, mp3data) {
        var minimum = bufByteIdx + 1;
        if (minimum <= 0)
            return 0;
        if (size != 0 && minimum > size) {
            /* buffer is too small */
            return -1;
        }
        System.arraycopy(buf, 0, buffer, bufferPos, minimum);
        bufByteIdx = -1;
        bufBitIdx = 0;

        if (mp3data != 0) {
            var crc = new_int(1);
            crc[0] = gfc.nMusicCRC;
            vbr.updateMusicCRC(crc, buffer, bufferPos, minimum);
            gfc.nMusicCRC = crc[0];

            /**
             * sum number of bytes belonging to the mp3 stream this info will be
             * written into the Xing/LAME header for seeking
             */
            if (minimum > 0) {
                gfc.VBR_seek_table.nBytesWritten += minimum;
            }

            if (gfc.decode_on_the_fly) { /* decode the frame */
                var pcm_buf = new_float_n([2, 1152]);
                var mp3_in = minimum;
                var samples_out = -1;
                var i;

                /* re-synthesis to pcm. Repeat until we get a samples_out=0 */
                while (samples_out != 0) {

                    samples_out = mpg.hip_decode1_unclipped(gfc.hip, buffer,
                        bufferPos, mp3_in, pcm_buf[0], pcm_buf[1]);
                    /*
                     * samples_out = 0: need more data to decode samples_out =
                     * -1: error. Lets assume 0 pcm output samples_out = number
                     * of samples output
                     */

                    /*
                     * set the lenght of the mp3 input buffer to zero, so that
                     * in the next iteration of the loop we will be querying
                     * mpglib about buffered data
                     */
                    mp3_in = 0;

                    if (samples_out == -1) {
                        /*
                         * error decoding. Not fatal, but might screw up the
                         * ReplayGain tag. What should we do? Ignore for now
                         */
                        samples_out = 0;
                    }
                    if (samples_out > 0) {
                        /* process the PCM data */

                        /*
                         * this should not be possible, and indicates we have
                         * overflown the pcm_buf buffer
                         */
                        assert(samples_out <= 1152);

                        if (gfc.findPeakSample) {
                            for (i = 0; i < samples_out; i++) {
                                if (pcm_buf[0][i] > gfc.PeakSample)
                                    gfc.PeakSample = pcm_buf[0][i];
                                else if (-pcm_buf[0][i] > gfc.PeakSample)
                                    gfc.PeakSample = -pcm_buf[0][i];
                            }
                            if (gfc.channels_out > 1)
                                for (i = 0; i < samples_out; i++) {
                                    if (pcm_buf[1][i] > gfc.PeakSample)
                                        gfc.PeakSample = pcm_buf[1][i];
                                    else if (-pcm_buf[1][i] > gfc.PeakSample)
                                        gfc.PeakSample = -pcm_buf[1][i];
                                }
                        }

                        if (gfc.findReplayGain)
                            if (ga.AnalyzeSamples(gfc.rgdata, pcm_buf[0], 0,
                                    pcm_buf[1], 0, samples_out,
                                    gfc.channels_out) == GainAnalysis.GAIN_ANALYSIS_ERROR)
                                return -6;

                    }
                    /* if (samples_out>0) */
                }
                /* while (samples_out!=0) */
            }
            /* if (gfc.decode_on_the_fly) */

        }
        /* if (mp3data) */
        return minimum;
    };

    this.init_bit_stream_w = function (gfc) {
        buf = new_byte(Lame.LAME_MAXMP3BUFFER);

        gfc.h_ptr = gfc.w_ptr = 0;
        gfc.header[gfc.h_ptr].write_timing = 0;
        bufByteIdx = -1;
        bufBitIdx = 0;
        totbit = 0;
    };

    // From machine.h


}

module.exports = BitStream;
