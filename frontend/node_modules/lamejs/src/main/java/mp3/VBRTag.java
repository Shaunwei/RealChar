/*
 *      Xing VBR tagging for LAME.
 *
 *      Copyright (c) 1999 A.L. Faber
 *      Copyright (c) 2001 Jonathan Dee
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */
package mp3;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.Charset;
import java.util.Arrays;

/**
 * A Vbr header may be present in the ancillary data field of the first frame of
 * an mp3 bitstream<BR>
 * The Vbr header (optionally) contains
 * <UL>
 * <LI>frames total number of audio frames in the bitstream
 * <LI>bytes total number of bytes in the bitstream
 * <LI>toc table of contents
 * </UL>
 * 
 * toc (table of contents) gives seek points for random access.<BR>
 * The ith entry determines the seek point for i-percent duration.<BR>
 * seek point in bytes = (toc[i]/256.0) * total_bitstream_bytes<BR>
 * e.g. half duration seek point = (toc[50]/256.0) * total_bitstream_bytes
 */
public class VBRTag {

	Lame lame;
	BitStream bs;
	Version v;

	public final void setModules(Lame lame, BitStream bs, Version v) {
		this.lame = lame;
		this.bs = bs;
		this.v = v;
	}

	private static final int FRAMES_FLAG = 0x0001;
	private static final int BYTES_FLAG = 0x0002;
	private static final int TOC_FLAG = 0x0004;
	private static final int VBR_SCALE_FLAG = 0x0008;

	public static final int NUMTOCENTRIES = 100;

	/**
	 * (0xB40) the max freeformat 640 32kHz framesize.
	 */
	public static final int MAXFRAMESIZE = 2880;

	/**
	 * <PRE>
	 *    4 bytes for Header Tag
	 *    4 bytes for Header Flags
	 *  100 bytes for entry (toc)
	 *    4 bytes for frame size
	 *    4 bytes for stream size
	 *    4 bytes for VBR scale. a VBR quality indicator: 0=best 100=worst
	 *   20 bytes for LAME tag.  for example, "LAME3.12 (beta 6)"
	 * ___________
	 *  140 bytes
	 * </PRE>
	 */
	private static final int VBRHEADERSIZE = (NUMTOCENTRIES + 4 + 4 + 4 + 4 + 4);

	private static final int LAMEHEADERSIZE = (VBRHEADERSIZE + 9 + 1 + 1 + 8
			+ 1 + 1 + 3 + 1 + 1 + 2 + 4 + 2 + 2);

	/**
	 * The size of the Xing header MPEG-1, bit rate in kbps.
	 */
	private static final int XING_BITRATE1 = 128;
	/**
	 * The size of the Xing header MPEG-2, bit rate in kbps.
	 */
	private static final int XING_BITRATE2 = 64;
	/**
	 * The size of the Xing header MPEG-2.5, bit rate in kbps.
	 */
	private static final int XING_BITRATE25 = 32;

	/**
	 * ISO-8859-1 charset for byte to string operations.
	 */
	private static final Charset ISO_8859_1 = Charset.forName("ISO-8859-1");

	/**
	 * VBR header magic string.
	 */
	private static final String VBRTag0 = "Xing";
	/**
	 * VBR header magic string (VBR == VBRMode.vbr_off).
	 */
	private static final String VBRTag1 = "Info";

	/**
	 * Lookup table for fast CRC-16 computation. Uses the polynomial
	 * x^16+x^15+x^2+1
	 */
	private static int crc16Lookup[] = { 0x0000, 0xC0C1, 0xC181, 0x0140,
			0xC301, 0x03C0, 0x0280, 0xC241, 0xC601, 0x06C0, 0x0780, 0xC741,
			0x0500, 0xC5C1, 0xC481, 0x0440, 0xCC01, 0x0CC0, 0x0D80, 0xCD41,
			0x0F00, 0xCFC1, 0xCE81, 0x0E40, 0x0A00, 0xCAC1, 0xCB81, 0x0B40,
			0xC901, 0x09C0, 0x0880, 0xC841, 0xD801, 0x18C0, 0x1980, 0xD941,
			0x1B00, 0xDBC1, 0xDA81, 0x1A40, 0x1E00, 0xDEC1, 0xDF81, 0x1F40,
			0xDD01, 0x1DC0, 0x1C80, 0xDC41, 0x1400, 0xD4C1, 0xD581, 0x1540,
			0xD701, 0x17C0, 0x1680, 0xD641, 0xD201, 0x12C0, 0x1380, 0xD341,
			0x1100, 0xD1C1, 0xD081, 0x1040, 0xF001, 0x30C0, 0x3180, 0xF141,
			0x3300, 0xF3C1, 0xF281, 0x3240, 0x3600, 0xF6C1, 0xF781, 0x3740,
			0xF501, 0x35C0, 0x3480, 0xF441, 0x3C00, 0xFCC1, 0xFD81, 0x3D40,
			0xFF01, 0x3FC0, 0x3E80, 0xFE41, 0xFA01, 0x3AC0, 0x3B80, 0xFB41,
			0x3900, 0xF9C1, 0xF881, 0x3840, 0x2800, 0xE8C1, 0xE981, 0x2940,
			0xEB01, 0x2BC0, 0x2A80, 0xEA41, 0xEE01, 0x2EC0, 0x2F80, 0xEF41,
			0x2D00, 0xEDC1, 0xEC81, 0x2C40, 0xE401, 0x24C0, 0x2580, 0xE541,
			0x2700, 0xE7C1, 0xE681, 0x2640, 0x2200, 0xE2C1, 0xE381, 0x2340,
			0xE101, 0x21C0, 0x2080, 0xE041, 0xA001, 0x60C0, 0x6180, 0xA141,
			0x6300, 0xA3C1, 0xA281, 0x6240, 0x6600, 0xA6C1, 0xA781, 0x6740,
			0xA501, 0x65C0, 0x6480, 0xA441, 0x6C00, 0xACC1, 0xAD81, 0x6D40,
			0xAF01, 0x6FC0, 0x6E80, 0xAE41, 0xAA01, 0x6AC0, 0x6B80, 0xAB41,
			0x6900, 0xA9C1, 0xA881, 0x6840, 0x7800, 0xB8C1, 0xB981, 0x7940,
			0xBB01, 0x7BC0, 0x7A80, 0xBA41, 0xBE01, 0x7EC0, 0x7F80, 0xBF41,
			0x7D00, 0xBDC1, 0xBC81, 0x7C40, 0xB401, 0x74C0, 0x7580, 0xB541,
			0x7700, 0xB7C1, 0xB681, 0x7640, 0x7200, 0xB2C1, 0xB381, 0x7340,
			0xB101, 0x71C0, 0x7080, 0xB041, 0x5000, 0x90C1, 0x9181, 0x5140,
			0x9301, 0x53C0, 0x5280, 0x9241, 0x9601, 0x56C0, 0x5780, 0x9741,
			0x5500, 0x95C1, 0x9481, 0x5440, 0x9C01, 0x5CC0, 0x5D80, 0x9D41,
			0x5F00, 0x9FC1, 0x9E81, 0x5E40, 0x5A00, 0x9AC1, 0x9B81, 0x5B40,
			0x9901, 0x59C0, 0x5880, 0x9841, 0x8801, 0x48C0, 0x4980, 0x8941,
			0x4B00, 0x8BC1, 0x8A81, 0x4A40, 0x4E00, 0x8EC1, 0x8F81, 0x4F40,
			0x8D01, 0x4DC0, 0x4C80, 0x8C41, 0x4400, 0x84C1, 0x8581, 0x4540,
			0x8701, 0x47C0, 0x4680, 0x8641, 0x8201, 0x42C0, 0x4380, 0x8341,
			0x4100, 0x81C1, 0x8081, 0x4040 };

	/***********************************************************************
	 * Robert Hegemann 2001-01-17
	 ***********************************************************************/

	private void addVbr(final VBRSeekInfo v, final int bitrate) {
		v.nVbrNumFrames++;
		v.sum += bitrate;
		v.seen++;

		if (v.seen < v.want) {
			return;
		}

		if (v.pos < v.size) {
			v.bag[v.pos] = v.sum;
			v.pos++;
			v.seen = 0;
		}
		if (v.pos == v.size) {
			for (int i = 1; i < v.size; i += 2) {
				v.bag[i / 2] = v.bag[i];
			}
			v.want *= 2;
			v.pos /= 2;
		}
	}

	private void xingSeekTable(VBRSeekInfo v, byte[] t) {
		if (v.pos <= 0)
			return;

		for (int i = 1; i < NUMTOCENTRIES; ++i) {
			float j = i / (float) NUMTOCENTRIES, act, sum;
			int indx = (int) (Math.floor(j * v.pos));
			if (indx > v.pos - 1)
				indx = v.pos - 1;
			act = v.bag[indx];
			sum = v.sum;
			int seek_point = (int) (256. * act / sum);
			if (seek_point > 255)
				seek_point = 255;
			t[i] = (byte) seek_point;
		}
	}

	/**
	 * Add VBR entry, used to fill the VBR TOC entries.
	 * 
	 * @param gfp
	 *            global flags
	 */
	public final void addVbrFrame(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;

		int kbps = Tables.bitrate_table[gfp.version][gfc.bitrate_index];
		assert (gfc.VBR_seek_table.bag != null);
		addVbr(gfc.VBR_seek_table, kbps);
	}

	/**
	 * Read big endian integer (4-bytes) from header.
	 * 
	 * @param buf
	 *            header containing the integer
	 * @param bufPos
	 *            offset into the header
	 * @return extracted integer
	 */
	private int extractInteger(final byte[] buf, final int bufPos) {
		int x = buf[bufPos + 0] & 0xff;
		x <<= 8;
		x |= buf[bufPos + 1] & 0xff;
		x <<= 8;
		x |= buf[bufPos + 2] & 0xff;
		x <<= 8;
		x |= buf[bufPos + 3] & 0xff;
		return x;
	}

	/**
	 * Write big endian integer (4-bytes) in the header.
	 * 
	 * @param buf
	 *            header to write the integer into
	 * @param bufPos
	 *            offset into the header
	 * @param value
	 *            integer value to write
	 */
	private void createInteger(final byte[] buf, final int bufPos,
			final int value) {
		buf[bufPos + 0] = (byte) ((value >> 24) & 0xff);
		buf[bufPos + 1] = (byte) ((value >> 16) & 0xff);
		buf[bufPos + 2] = (byte) ((value >> 8) & 0xff);
		buf[bufPos + 3] = (byte) (value & 0xff);
	}

	/**
	 * Write big endian short (2-bytes) in the header.
	 * 
	 * @param buf
	 *            header to write the integer into
	 * @param bufPos
	 *            offset into the header
	 * @param value
	 *            integer value to write
	 */
	private void createShort(final byte[] buf, final int bufPos, final int value) {
		buf[bufPos + 0] = (byte) ((value >> 8) & 0xff);
		buf[bufPos + 1] = (byte) (value & 0xff);
	}

	/**
	 * Check for magic strings (Xing/Info).
	 * 
	 * @param buf
	 *            header to check
	 * @param bufPos
	 *            header offset to check
	 * @return magic string found
	 */
	private boolean isVbrTag(final byte[] buf, final int bufPos) {
		return new String(buf, bufPos, VBRTag0.length(), ISO_8859_1)
				.equals(VBRTag0)
				|| new String(buf, bufPos, VBRTag1.length(), ISO_8859_1)
						.equals(VBRTag1);
	}

	private byte shiftInBitsValue(final byte x, final int n, final int v) {
		return (byte) ((x << n) | (v & ~(-1 << n)));
	}

	/**
	 * Construct the MP3 header using the settings of the global flags.
	 * 
	 * <img src="1000px-Mp3filestructure.svg.png">
	 * 
	 * @param gfp
	 *            global flags
	 * @param buffer
	 *            header
	 */
	private void setLameTagFrameHeader(final LameGlobalFlags gfp,
			final byte[] buffer) {
		final LameInternalFlags gfc = gfp.internal_flags;

		// MP3 Sync Word
		buffer[0] = shiftInBitsValue(buffer[0], 8, 0xff);

		buffer[1] = shiftInBitsValue(buffer[1], 3, 7);
		buffer[1] = shiftInBitsValue(buffer[1], 1,
				(gfp.out_samplerate < 16000) ? 0 : 1);
		// Version
		buffer[1] = shiftInBitsValue(buffer[1], 1, gfp.version);
		// 01 == Layer 3
		buffer[1] = shiftInBitsValue(buffer[1], 2, 4 - 3);
		// Error protection
		buffer[1] = shiftInBitsValue(buffer[1], 1, (!gfp.error_protection) ? 1
				: 0);

		// Bit rate
		buffer[2] = shiftInBitsValue(buffer[2], 4, gfc.bitrate_index);
		// Frequency
		buffer[2] = shiftInBitsValue(buffer[2], 2, gfc.samplerate_index);
		// Pad. Bit
		buffer[2] = shiftInBitsValue(buffer[2], 1, 0);
		// Priv. Bit
		buffer[2] = shiftInBitsValue(buffer[2], 1, gfp.extension);

		// Mode
		buffer[3] = shiftInBitsValue(buffer[3], 2, gfp.mode.ordinal());
		// Mode extension (Used with Joint Stereo)
		buffer[3] = shiftInBitsValue(buffer[3], 2, gfc.mode_ext);
		// Copy
		buffer[3] = shiftInBitsValue(buffer[3], 1, gfp.copyright);
		// Original
		buffer[3] = shiftInBitsValue(buffer[3], 1, gfp.original);
		// Emphasis
		buffer[3] = shiftInBitsValue(buffer[3], 2, gfp.emphasis);

		/* the default VBR header. 48 kbps layer III, no padding, no crc */
		/* but sampling freq, mode and copyright/copy protection taken */
		/* from first valid frame */
		buffer[0] = (byte) 0xff;
		byte abyte = (byte) (buffer[1] & 0xf1);

		int bitrate;
		if (1 == gfp.version) {
			bitrate = XING_BITRATE1;
		} else {
			if (gfp.out_samplerate < 16000)
				bitrate = XING_BITRATE25;
			else
				bitrate = XING_BITRATE2;
		}

		if (gfp.VBR == VbrMode.vbr_off)
			bitrate = gfp.brate;

		byte bbyte;
		if (gfp.free_format)
			bbyte = 0x00;
		else
			bbyte = (byte) (16 * lame.BitrateIndex(bitrate, gfp.version,
					gfp.out_samplerate));

		/*
		 * Use as much of the info from the real frames in the Xing header:
		 * samplerate, channels, crc, etc...
		 */
		if (gfp.version == 1) {
			/* MPEG1 */
			buffer[1] = (byte) (abyte | 0x0a); /* was 0x0b; */
			abyte = (byte) (buffer[2] & 0x0d); /* AF keep also private bit */
			buffer[2] = (byte) (bbyte | abyte); /* 64kbs MPEG1 frame */
		} else {
			/* MPEG2 */
			buffer[1] = (byte) (abyte | 0x02); /* was 0x03; */
			abyte = (byte) (buffer[2] & 0x0d); /* AF keep also private bit */
			buffer[2] = (byte) (bbyte | abyte); /* 64kbs MPEG2 frame */
		}
	}

	/**
	 * Get VBR tag information
	 * 
	 * @param buf
	 *            header to analyze
	 * @param bufPos
	 *            offset into the header
	 * @return VBR tag data
	 */
	public final VBRTagData getVbrTag(final byte[] buf) {
		final VBRTagData pTagData = new VBRTagData();
		int bufPos = 0;
		
		/* get Vbr header data */
		pTagData.flags = 0;

		/* get selected MPEG header data */
		int hId = (buf[bufPos + 1] >> 3) & 1;
		int hSrIndex = (buf[bufPos + 2] >> 2) & 3;
		int hMode = (buf[bufPos + 3] >> 6) & 3;
		int hBitrate = ((buf[bufPos + 2] >> 4) & 0xf);
		hBitrate = Tables.bitrate_table[hId][hBitrate];

		/* check for FFE syncword */
		if ((buf[bufPos + 1] >> 4) == 0xE)
			pTagData.samprate = Tables.samplerate_table[2][hSrIndex];
		else
			pTagData.samprate = Tables.samplerate_table[hId][hSrIndex];

		/* determine offset of header */
		if (hId != 0) {
			/* mpeg1 */
			if (hMode != 3)
				bufPos += (32 + 4);
			else
				bufPos += (17 + 4);
		} else {
			/* mpeg2 */
			if (hMode != 3)
				bufPos += (17 + 4);
			else
				bufPos += (9 + 4);
		}

		if (!isVbrTag(buf, bufPos))
			return null;

		bufPos += 4;

		pTagData.hId = hId;

		/* get flags */
		int head_flags = pTagData.flags = extractInteger(buf, bufPos);
		bufPos += 4;

		if ((head_flags & FRAMES_FLAG) != 0) {
			pTagData.frames = extractInteger(buf, bufPos);
			bufPos += 4;
		}

		if ((head_flags & BYTES_FLAG) != 0) {
			pTagData.bytes = extractInteger(buf, bufPos);
			bufPos += 4;
		}

		if ((head_flags & TOC_FLAG) != 0) {
			if (pTagData.toc != null) {
				for (int i = 0; i < NUMTOCENTRIES; i++)
					pTagData.toc[i] = buf[bufPos + i];
			}
			bufPos += NUMTOCENTRIES;
		}

		pTagData.vbrScale = -1;

		if ((head_flags & VBR_SCALE_FLAG) != 0) {
			pTagData.vbrScale = extractInteger(buf, bufPos);
			bufPos += 4;
		}

		pTagData.headersize = ((hId + 1) * 72000 * hBitrate)
				/ pTagData.samprate;

		bufPos += 21;
		int encDelay = buf[bufPos + 0] << 4;
		encDelay += buf[bufPos + 1] >> 4;
		int encPadding = (buf[bufPos + 1] & 0x0F) << 8;
		encPadding += buf[bufPos + 2] & 0xff;
		/* check for reasonable values (this may be an old Xing header, */
		/* not a INFO tag) */
		if (encDelay < 0 || encDelay > 3000)
			encDelay = -1;
		if (encPadding < 0 || encPadding > 3000)
			encPadding = -1;

		pTagData.encDelay = encDelay;
		pTagData.encPadding = encPadding;

		/* success */
		return pTagData;
	}

	/**
	 * Initializes the header
	 * 
	 * @param gfp
	 *            global flags
	 */
	public final void InitVbrTag(final LameGlobalFlags gfp) {
		final LameInternalFlags gfc = gfp.internal_flags;

		/**
		 * <PRE>
		 * Xing VBR pretends to be a 48kbs layer III frame.  (at 44.1kHz).
		 * (at 48kHz they use 56kbs since 48kbs frame not big enough for
		 * table of contents)
		 * let's always embed Xing header inside a 64kbs layer III frame.
		 * this gives us enough room for a LAME version string too.
		 * size determined by sampling frequency (MPEG1)
		 * 32kHz:    216 bytes@48kbs    288bytes@ 64kbs
		 * 44.1kHz:  156 bytes          208bytes@64kbs     (+1 if padding = 1)
		 * 48kHz:    144 bytes          192
		 * 
		 * MPEG 2 values are the same since the framesize and samplerate
		 * are each reduced by a factor of 2.
		 * </PRE>
		 */
		int kbps_header;
		if (1 == gfp.version) {
			kbps_header = XING_BITRATE1;
		} else {
			if (gfp.out_samplerate < 16000)
				kbps_header = XING_BITRATE25;
			else
				kbps_header = XING_BITRATE2;
		}

		if (gfp.VBR == VbrMode.vbr_off)
			kbps_header = gfp.brate;

		// make sure LAME Header fits into Frame
		int totalFrameSize = ((gfp.version + 1) * 72000 * kbps_header)
				/ gfp.out_samplerate;
		int headerSize = (gfc.sideinfo_len + LAMEHEADERSIZE);
		gfc.VBR_seek_table.TotalFrameSize = totalFrameSize;
		if (totalFrameSize < headerSize || totalFrameSize > MAXFRAMESIZE) {
			/* disable tag, it wont fit */
			gfp.bWriteVbrTag = false;
			return;
		}

		gfc.VBR_seek_table.nVbrNumFrames = 0;
		gfc.VBR_seek_table.nBytesWritten = 0;
		gfc.VBR_seek_table.sum = 0;

		gfc.VBR_seek_table.seen = 0;
		gfc.VBR_seek_table.want = 1;
		gfc.VBR_seek_table.pos = 0;

		if (gfc.VBR_seek_table.bag == null) {
			gfc.VBR_seek_table.bag = new int[400];
			gfc.VBR_seek_table.size = 400;
		}

		// write dummy VBR tag of all 0's into bitstream
		byte buffer[] = new byte[MAXFRAMESIZE];

		setLameTagFrameHeader(gfp, buffer);
		int n = gfc.VBR_seek_table.TotalFrameSize;
		for (int i = 0; i < n; ++i) {
			bs.add_dummy_byte(gfp, buffer[i] & 0xff, 1);
		}
	}

	/**
	 * Fast CRC-16 computation (uses table crc16Lookup).
	 * 
	 * @param value
	 * @param crc
	 * @return
	 */
	private int crcUpdateLookup(final int value, int crc) {
		int tmp = crc ^ value;
		crc = (crc >> 8) ^ crc16Lookup[tmp & 0xff];
		return crc;
	}

	public final void updateMusicCRC(final int[] crc, final byte[] buffer,
			final int bufferPos, final int size) {
		for (int i = 0; i < size; ++i)
			crc[0] = crcUpdateLookup(buffer[bufferPos + i], crc[0]);
	}

	/**
	 * Write LAME info: mini version + info on various switches used (Jonathan
	 * Dee 2001/08/31).
	 * 
	 * @param gfp
	 *            global flags
	 * @param musicLength
	 *            music length
	 * @param streamBuffer
	 *            pointer to output buffer
	 * @param streamBufferPos
	 *            offset into the output buffer
	 * @param crc
	 *            computation of CRC-16 of Lame Tag so far (starting at frame
	 *            sync)
	 * @return number of bytes written to the stream
	 */
	private int putLameVBR(final LameGlobalFlags gfp, final int musicLength,
			final byte[] streamBuffer, final int streamBufferPos, int crc) {
		final LameInternalFlags gfc = gfp.internal_flags;

		int bytesWritten = 0;

		/* encoder delay */
		int encDelay = gfp.encoder_delay;
		/* encoder padding */
		int encPadding = gfp.encoder_padding;

		/* recall: gfp.VBR_q is for example set by the switch -V */
		/* gfp.quality by -q, -h, -f, etc */
		int quality = (100 - 10 * gfp.VBR_q - gfp.quality);

		final String version = v.getLameVeryShortVersion();
		int vbr;
		int revision = 0x00;
		int revMethod;
		// numbering different in vbr_mode vs. Lame tag
		int vbrTypeTranslator[] = { 1, 5, 3, 2, 4, 0, 3 };

		int lowpass = (int) (((gfp.lowpassfreq / 100.0) + .5) > 255 ? 255
				: (gfp.lowpassfreq / 100.0) + .5);

		int peakSignalAmplitude = 0;

		int radioReplayGain = 0;
		int audiophileReplayGain = 0;

		int noiseShaping = gfp.internal_flags.noise_shaping;
		int stereoMode = 0;
		int nonOptimal = 0;
		int sourceFreq = 0;
		int misc = 0;
		int musicCRC = 0;

		// psy model type: Gpsycho or NsPsytune
		boolean expNPsyTune = (gfp.exp_nspsytune & 1) != 0;
		boolean safeJoint = (gfp.exp_nspsytune & 2) != 0;

		boolean noGapMore = false;
		boolean noGapPrevious = false;

		int noGapCount = gfp.internal_flags.nogap_total;
		int noGapCurr = gfp.internal_flags.nogap_current;

		// 4 bits
		int athType = gfp.ATHtype;

		int flags = 0;

		// vbr modes
		int abrBitrate;
		switch (gfp.VBR) {
		case vbr_abr:
			abrBitrate = gfp.VBR_mean_bitrate_kbps;
			break;
		case vbr_off:
			abrBitrate = gfp.brate;
			break;
		default:
			abrBitrate = gfp.VBR_min_bitrate_kbps;
		}

		// revision and vbr method
		if (gfp.VBR.ordinal() < vbrTypeTranslator.length)
			vbr = vbrTypeTranslator[gfp.VBR.ordinal()];
		else
			vbr = 0x00; // unknown

		revMethod = 0x10 * revision + vbr;

		// ReplayGain
		if (gfc.findReplayGain) {
			if (gfc.RadioGain > 0x1FE)
				gfc.RadioGain = 0x1FE;
			if (gfc.RadioGain < -0x1FE)
				gfc.RadioGain = -0x1FE;

			// set name code
			radioReplayGain = 0x2000;
			// set originator code to `determined automatically'
			radioReplayGain |= 0xC00;

			if (gfc.RadioGain >= 0) {
				// set gain adjustment
				radioReplayGain |= gfc.RadioGain;
			} else {
				// set the sign bit
				radioReplayGain |= 0x200;
				// set gain adjustment
				radioReplayGain |= -gfc.RadioGain;
			}
		}

		// peak sample
		if (gfc.findPeakSample)
			peakSignalAmplitude = Math
					.abs((int) ((((float) gfc.PeakSample) / 32767.0)
							* Math.pow(2, 23) + .5));

		// nogap
		if (noGapCount != -1) {
			if (noGapCurr > 0)
				noGapPrevious = true;

			if (noGapCurr < noGapCount - 1)
				noGapMore = true;
		}

		// flags
		flags = athType + ((expNPsyTune ? 1 : 0) << 4)
				+ ((safeJoint ? 1 : 0) << 5) + ((noGapMore ? 1 : 0) << 6)
				+ ((noGapPrevious ? 1 : 0) << 7);

		if (quality < 0)
			quality = 0;

		// stereo mode field (Intensity stereo is not implemented)
		switch (gfp.mode) {
		case MONO:
			stereoMode = 0;
			break;
		case STEREO:
			stereoMode = 1;
			break;
		case DUAL_CHANNEL:
			stereoMode = 2;
			break;
		case JOINT_STEREO:
			if (gfp.force_ms)
				stereoMode = 4;
			else
				stereoMode = 3;
			break;
		case NOT_SET:
			//$FALL-THROUGH$
		default:
			stereoMode = 7;
			break;
		}

		if (gfp.in_samplerate <= 32000)
			sourceFreq = 0x00;
		else if (gfp.in_samplerate == 48000)
			sourceFreq = 0x02;
		else if (gfp.in_samplerate > 48000)
			sourceFreq = 0x03;
		else {
			// default is 44100Hz
			sourceFreq = 0x01;
		}

		// Check if the user overrided the default LAME behavior with some
		// nasty options
		if (gfp.short_blocks == ShortBlock.short_block_forced
				|| gfp.short_blocks == ShortBlock.short_block_dispensed
				|| ((gfp.lowpassfreq == -1) && (gfp.highpassfreq == -1)) || /* "-k" */
				(gfp.scale_left < gfp.scale_right)
				|| (gfp.scale_left > gfp.scale_right)
				|| (gfp.disable_reservoir && gfp.brate < 320) || gfp.noATH
				|| gfp.ATHonly || (athType == 0) || gfp.in_samplerate <= 32000)
			nonOptimal = 1;

		misc = noiseShaping + (stereoMode << 2) + (nonOptimal << 5)
				+ (sourceFreq << 6);

		musicCRC = gfc.nMusicCRC;

		// Write all this information into the stream

		createInteger(streamBuffer, streamBufferPos + bytesWritten, quality);
		bytesWritten += 4;

		for (int j = 0; j < 9; j++) {
			streamBuffer[streamBufferPos + bytesWritten + j] = (byte) version
					.charAt(j);
		}
		bytesWritten += 9;

		streamBuffer[streamBufferPos + bytesWritten] = (byte) revMethod;
		bytesWritten++;

		streamBuffer[streamBufferPos + bytesWritten] = (byte) lowpass;
		bytesWritten++;

		createInteger(streamBuffer, streamBufferPos + bytesWritten,
				peakSignalAmplitude);
		bytesWritten += 4;

		createShort(streamBuffer, streamBufferPos + bytesWritten,
				radioReplayGain);
		bytesWritten += 2;

		createShort(streamBuffer, streamBufferPos + bytesWritten,
				audiophileReplayGain);
		bytesWritten += 2;

		streamBuffer[streamBufferPos + bytesWritten] = (byte) flags;
		bytesWritten++;

		if (abrBitrate >= 255)
			streamBuffer[streamBufferPos + bytesWritten] = (byte) 0xFF;
		else
			streamBuffer[streamBufferPos + bytesWritten] = (byte) abrBitrate;
		bytesWritten++;

		streamBuffer[streamBufferPos + bytesWritten] = (byte) (encDelay >> 4);
		streamBuffer[streamBufferPos + bytesWritten + 1] = (byte) ((encDelay << 4) + (encPadding >> 8));
		streamBuffer[streamBufferPos + bytesWritten + 2] = (byte) encPadding;

		bytesWritten += 3;

		streamBuffer[streamBufferPos + bytesWritten] = (byte) misc;
		bytesWritten++;

		// unused in rev0
		streamBuffer[streamBufferPos + bytesWritten++] = 0;

		createShort(streamBuffer, streamBufferPos + bytesWritten, gfp.preset);
		bytesWritten += 2;

		createInteger(streamBuffer, streamBufferPos + bytesWritten, musicLength);
		bytesWritten += 4;

		createShort(streamBuffer, streamBufferPos + bytesWritten, musicCRC);
		bytesWritten += 2;

		// Calculate tag CRC.... must be done here, since it includes previous
		// information

		for (int i = 0; i < bytesWritten; i++)
			crc = crcUpdateLookup(streamBuffer[streamBufferPos + i], crc);

		createShort(streamBuffer, streamBufferPos + bytesWritten, crc);
		bytesWritten += 2;

		return bytesWritten;
	}

	private int skipId3v2(final RandomAccessFile fpStream) throws IOException {
		// seek to the beginning of the stream
		fpStream.seek(0);
		// read 10 bytes in case there's an ID3 version 2 header here
		byte[] id3v2Header = new byte[10];
		fpStream.readFully(id3v2Header);
		/* does the stream begin with the ID3 version 2 file identifier? */
		int id3v2TagSize;
		if (!new String(id3v2Header, "ISO-8859-1").startsWith("ID3")) {
			/*
			 * the tag size (minus the 10-byte header) is encoded into four
			 * bytes where the most significant bit is clear in each byte
			 */
			id3v2TagSize = (((id3v2Header[6] & 0x7f) << 21)
					| ((id3v2Header[7] & 0x7f) << 14)
					| ((id3v2Header[8] & 0x7f) << 7) | (id3v2Header[9] & 0x7f))
					+ id3v2Header.length;
		} else {
			/* no ID3 version 2 tag in this stream */
			id3v2TagSize = 0;
		}
		return id3v2TagSize;
	}

	public final int getLameTagFrame(final LameGlobalFlags gfp,
			final byte[] buffer) {
		final LameInternalFlags gfc = gfp.internal_flags;

		if (!gfp.bWriteVbrTag) {
			return 0;
		}
		if (gfc.Class_ID != Lame.LAME_ID) {
			return 0;
		}
		if (gfc.VBR_seek_table.pos <= 0) {
			return 0;
		}
		if (buffer.length < gfc.VBR_seek_table.TotalFrameSize) {
			return gfc.VBR_seek_table.TotalFrameSize;
		}

		Arrays.fill(buffer, 0, gfc.VBR_seek_table.TotalFrameSize, (byte) 0);

		// 4 bytes frame header
		setLameTagFrameHeader(gfp, buffer);

		// Create TOC entries
		byte toc[] = new byte[NUMTOCENTRIES];

		if (gfp.free_format) {
			for (int i = 1; i < NUMTOCENTRIES; ++i)
				toc[i] = (byte) (255 * i / 100);
		} else {
			xingSeekTable(gfc.VBR_seek_table, toc);
		}

		// Start writing the tag after the zero frame
		int streamIndex = gfc.sideinfo_len;
		/**
		 * Note: Xing header specifies that Xing data goes in the ancillary data
		 * with NO ERROR PROTECTION. If error protecton in enabled, the Xing
		 * data still starts at the same offset, and now it is in sideinfo data
		 * block, and thus will not decode correctly by non-Xing tag aware
		 * players
		 */
		if (gfp.error_protection)
			streamIndex -= 2;

		// Put Vbr tag
		if (gfp.VBR == VbrMode.vbr_off) {
			buffer[streamIndex++] = (byte) VBRTag1.charAt(0);
			buffer[streamIndex++] = (byte) VBRTag1.charAt(1);
			buffer[streamIndex++] = (byte) VBRTag1.charAt(2);
			buffer[streamIndex++] = (byte) VBRTag1.charAt(3);

		} else {
			buffer[streamIndex++] = (byte) VBRTag0.charAt(0);
			buffer[streamIndex++] = (byte) VBRTag0.charAt(1);
			buffer[streamIndex++] = (byte) VBRTag0.charAt(2);
			buffer[streamIndex++] = (byte) VBRTag0.charAt(3);
		}

		// Put header flags
		createInteger(buffer, streamIndex, FRAMES_FLAG + BYTES_FLAG + TOC_FLAG
				+ VBR_SCALE_FLAG);
		streamIndex += 4;

		// Put Total Number of frames
		createInteger(buffer, streamIndex, gfc.VBR_seek_table.nVbrNumFrames);
		streamIndex += 4;

		// Put total audio stream size, including Xing/LAME Header
		int streamSize = (gfc.VBR_seek_table.nBytesWritten + gfc.VBR_seek_table.TotalFrameSize);
		createInteger(buffer, streamIndex, (int) streamSize);
		streamIndex += 4;

		/* Put TOC */
		System.arraycopy(toc, 0, buffer, streamIndex, toc.length);
		streamIndex += toc.length;

		if (gfp.error_protection) {
			// (jo) error_protection: add crc16 information to header
			bs.CRC_writeheader(gfc, buffer);
		}

		// work out CRC so far: initially crc = 0
		int crc = 0x00;
		for (int i = 0; i < streamIndex; i++)
			crc = crcUpdateLookup(buffer[i], crc);
		// Put LAME VBR info
		streamIndex += putLameVBR(gfp, streamSize, buffer, streamIndex, crc);

		return gfc.VBR_seek_table.TotalFrameSize;
	}

	/**
	 * Write final VBR tag to the file.
	 * 
	 * @param gfp
	 *            global flags
	 * @param stream
	 *            stream to add the VBR tag to
	 * @return 0 (OK), -1 else
	 * @throws IOException
	 *             I/O error
	 */
	public final int putVbrTag(final LameGlobalFlags gfp,
			final RandomAccessFile stream) throws IOException {
		final LameInternalFlags gfc = gfp.internal_flags;

		if (gfc.VBR_seek_table.pos <= 0)
			return -1;

		// Seek to end of file
		stream.seek(stream.length());

		// Get file size, abort if file has zero length.
		if (stream.length() == 0)
			return -1;

		// The VBR tag may NOT be located at the beginning of the stream. If an
		// ID3 version 2 tag was added, then it must be skipped to write the VBR
		// tag data.
		int id3v2TagSize = skipId3v2(stream);

		// Seek to the beginning of the stream
		stream.seek(id3v2TagSize);

		byte[] buffer = new byte[MAXFRAMESIZE];
		int bytes = getLameTagFrame(gfp, buffer);
		if (bytes > buffer.length) {
			return -1;
		}

		if (bytes < 1) {
			return 0;
		}

		// Put it all to disk again
		stream.write(buffer, 0, bytes);
		// success
		return 0;
	}

}
