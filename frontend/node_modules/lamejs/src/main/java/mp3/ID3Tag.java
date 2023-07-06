/*
 * id3tag.c -- Write ID3 version 1 and 2 tags.
 *
 * Copyright (C) 2000 Don Melton.
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
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.
 */

/*
 * HISTORY: This source file is part of LAME (see http://www.mp3dev.org)
 * and was originally adapted by Conrad Sanderson <c.sanderson@me.gu.edu.au>
 * from mp3info by Ricardo Cerqueira <rmc@rccn.net> to write only ID3 version 1
 * tags.  Don Melton <don@blivet.com> COMPLETELY rewrote it to support version
 * 2 tags and be more conformant to other standards while remaining flexible.
 *
 * NOTE: See http://id3.org/ for more information about ID3 tag formats.
 */
package mp3;

import java.nio.charset.Charset;
import java.util.Arrays;

public class ID3Tag {

	BitStream bits;
	Version ver;

	public final void setModules(BitStream bits, Version ver) {
		this.bits = bits;
		this.ver = ver;
	}

	private static final int CHANGED_FLAG = (1 << 0);
	private static final int ADD_V2_FLAG = (1 << 1);
	private static final int V1_ONLY_FLAG = (1 << 2);
	private static final int V2_ONLY_FLAG = (1 << 3);
	private static final int SPACE_V1_FLAG = (1 << 4);
	private static final int PAD_V2_FLAG = (1 << 5);

	enum MimeType {
		MIMETYPE_NONE, MIMETYPE_JPEG, MIMETYPE_PNG, MIMETYPE_GIF,
	};

	private static final String genre_names[] = {
	/*
	 * NOTE: The spelling of these genre names is identical to those found in
	 * Winamp and mp3info.
	 */
	"Blues", "Classic Rock", "Country", "Dance", "Disco", "Funk", "Grunge",
			"Hip-Hop", "Jazz", "Metal", "New Age", "Oldies", "Other", "Pop",
			"R&B", "Rap", "Reggae", "Rock", "Techno", "Industrial",
			"Alternative", "Ska", "Death Metal", "Pranks", "Soundtrack",
			"Euro-Techno", "Ambient", "Trip-Hop", "Vocal", "Jazz+Funk",
			"Fusion", "Trance", "Classical", "Instrumental", "Acid", "House",
			"Game", "Sound Clip", "Gospel", "Noise", "Alternative Rock",
			"Bass", "Soul", "Punk", "Space", "Meditative", "Instrumental Pop",
			"Instrumental Rock", "Ethnic", "Gothic", "Darkwave",
			"Techno-Industrial", "Electronic", "Pop-Folk", "Eurodance",
			"Dream", "Southern Rock", "Comedy", "Cult", "Gangsta", "Top 40",
			"Christian Rap", "Pop/Funk", "Jungle", "Native US", "Cabaret",
			"New Wave", "Psychedelic", "Rave", "Showtunes", "Trailer", "Lo-Fi",
			"Tribal", "Acid Punk", "Acid Jazz", "Polka", "Retro", "Musical",
			"Rock & Roll", "Hard Rock", "Folk", "Folk-Rock", "National Folk",
			"Swing", "Fast Fusion", "Bebob", "Latin", "Revival", "Celtic",
			"Bluegrass", "Avantgarde", "Gothic Rock", "Progressive Rock",
			"Psychedelic Rock", "Symphonic Rock", "Slow Rock", "Big Band",
			"Chorus", "Easy Listening", "Acoustic", "Humour", "Speech",
			"Chanson", "Opera", "Chamber Music", "Sonata", "Symphony",
			"Booty Bass", "Primus", "Porn Groove", "Satire", "Slow Jam",
			"Club", "Tango", "Samba", "Folklore", "Ballad", "Power Ballad",
			"Rhythmic Soul", "Freestyle", "Duet", "Punk Rock", "Drum Solo",
			"A Cappella", "Euro-House", "Dance Hall", "Goa", "Drum & Bass",
			"Club-House", "Hardcore", "Terror", "Indie", "BritPop",
			"Negerpunk", "Polsk Punk", "Beat", "Christian Gangsta",
			"Heavy Metal", "Black Metal", "Crossover",
			"Contemporary Christian", "Christian Rock", "Merengue", "Salsa",
			"Thrash Metal", "Anime", "JPop", "SynthPop" };

	private static final int genre_alpha_map[] = { 123, 34, 74, 73, 99, 20, 40,
			26, 145, 90, 116, 41, 135, 85, 96, 138, 89, 0, 107, 132, 65, 88,
			104, 102, 97, 136, 61, 141, 32, 1, 112, 128, 57, 140, 2, 139, 58,
			3, 125, 50, 22, 4, 55, 127, 122, 120, 98, 52, 48, 54, 124, 25, 84,
			80, 115, 81, 119, 5, 30, 36, 59, 126, 38, 49, 91, 6, 129, 79, 137,
			7, 35, 100, 131, 19, 33, 46, 47, 8, 29, 146, 63, 86, 71, 45, 142,
			9, 77, 82, 64, 133, 10, 66, 39, 11, 103, 12, 75, 134, 13, 53, 62,
			109, 117, 23, 108, 92, 67, 93, 43, 121, 15, 68, 14, 16, 76, 87,
			118, 17, 78, 143, 114, 110, 69, 21, 111, 95, 105, 42, 37, 24, 56,
			44, 101, 83, 94, 106, 147, 113, 18, 51, 130, 144, 60, 70, 31, 72,
			27, 28 };

	private static final int GENRE_INDEX_OTHER = 12;

	private static int FRAME_ID(char a, char b, char c, char d) {
		return ((a & 0xff) << 24) | ((b & 0xff) << 16) | ((c & 0xff) << 8)
				| ((d & 0xff) << 0);
	}

	private static final int ID_TITLE = (FRAME_ID('T', 'I', 'T', '2'));
	private static final int ID_ARTIST = (FRAME_ID('T', 'P', 'E', '1'));
	private static final int ID_ALBUM = (FRAME_ID('T', 'A', 'L', 'B'));
	private static final int ID_GENRE = (FRAME_ID('T', 'C', 'O', 'N'));
	private static final int ID_ENCODER = (FRAME_ID('T', 'S', 'S', 'E'));
	private static final int ID_PLAYLENGTH = (FRAME_ID('T', 'L', 'E', 'N'));
	private static final int ID_COMMENT = (FRAME_ID('C', 'O', 'M', 'M'));

	/**
	 * "ddMM"
	 */
	private static final int ID_DATE = (FRAME_ID('T', 'D', 'A', 'T'));
	/**
	 * "hhmm"
	 */
	private static final int ID_TIME = (FRAME_ID('T', 'I', 'M', 'E'));
	/**
	 * '0'-'9' and '/' allowed
	 */
	private static final int ID_TPOS = (FRAME_ID('T', 'P', 'O', 'S'));
	/**
	 * '0'-'9' and '/' allowed
	 */
	private static final int ID_TRACK = (FRAME_ID('T', 'R', 'C', 'K'));
	/**
	 * "yyyy"
	 */
	private static final int ID_YEAR = (FRAME_ID('T', 'Y', 'E', 'R'));

	private static final int ID_TXXX = (FRAME_ID('T', 'X', 'X', 'X'));
	private static final int ID_WXXX = (FRAME_ID('W', 'X', 'X', 'X'));
	private static final int ID_SYLT = (FRAME_ID('S', 'Y', 'L', 'T'));
	private static final int ID_APIC = (FRAME_ID('A', 'P', 'I', 'C'));
	private static final int ID_GEOB = (FRAME_ID('G', 'E', 'O', 'B'));
	private static final int ID_PCNT = (FRAME_ID('P', 'C', 'N', 'T'));
	private static final int ID_AENC = (FRAME_ID('A', 'E', 'N', 'C'));
	private static final int ID_LINK = (FRAME_ID('L', 'I', 'N', 'K'));
	private static final int ID_ENCR = (FRAME_ID('E', 'N', 'C', 'R'));
	private static final int ID_GRID = (FRAME_ID('G', 'R', 'I', 'D'));
	private static final int ID_PRIV = (FRAME_ID('P', 'R', 'I', 'V'));

	private void copyV1ToV2(final LameGlobalFlags gfp, final int frame_id,
			final String s) {
		LameInternalFlags gfc = gfp.internal_flags;
		int flags = gfc.tag_spec.flags;
		id3v2_add_latin1(gfp, frame_id, null, null, s);
		gfc.tag_spec.flags = flags;
	}

	private void id3v2AddLameVersion(final LameGlobalFlags gfp) {
		String buffer;
		String b = ver.getLameOsBitness();
		String v = ver.getLameVersion();
		String u = ver.getLameUrl();
		final int lenb = b.length();

		if (lenb > 0) {
			buffer = String.format("LAME %s version %s (%s)", b, v, u);
		} else {
			buffer = String.format("LAME version %s (%s)", v, u);
		}
		copyV1ToV2(gfp, ID_ENCODER, buffer);
	}

	private void id3v2AddAudioDuration(final LameGlobalFlags gfp) {
		if (gfp.num_samples != -1) {
			String buffer;
			double max_ulong = Integer.MAX_VALUE;
			double ms = gfp.num_samples;
			long playlength_ms;

			ms *= 1000;
			ms /= gfp.in_samplerate;
			if (ms > Integer.MAX_VALUE) {
				playlength_ms = (long) max_ulong;
			} else if (ms < 0) {
				playlength_ms = 0;
			} else {
				playlength_ms = (long) ms;
			}
			buffer = String.format("%d", playlength_ms);
			copyV1ToV2(gfp, ID_PLAYLENGTH, buffer);
		}
	}

	public final void id3tag_genre_list(final GenreListHandler handler) {
		if (handler != null) {
			for (int i = 0; i < genre_names.length; ++i) {
				if (i < genre_alpha_map.length) {
					int j = genre_alpha_map[i];
					handler.genre_list_handler(j, genre_names[j]);
				}
			}
		}
	}

	private static final int GENRE_NUM_UNKNOWN = 255;
	private static final Charset ASCII = Charset.forName("US-ASCII");

	public final void id3tag_init(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;
		gfc.tag_spec = new ID3TagSpec();
		gfc.tag_spec.genre_id3v1 = GENRE_NUM_UNKNOWN;
		gfc.tag_spec.padding_size = 128;
		id3v2AddLameVersion(gfp);
	}

	public final void id3tag_add_v2(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;
		gfc.tag_spec.flags &= ~V1_ONLY_FLAG;
		gfc.tag_spec.flags |= ADD_V2_FLAG;
	}

	public final void id3tag_v1_only(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;
		gfc.tag_spec.flags &= ~(ADD_V2_FLAG | V2_ONLY_FLAG);
		gfc.tag_spec.flags |= V1_ONLY_FLAG;
	}

	public final void id3tag_v2_only(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;
		gfc.tag_spec.flags &= ~V1_ONLY_FLAG;
		gfc.tag_spec.flags |= V2_ONLY_FLAG;
	}

	public final void id3tag_space_v1(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;
		gfc.tag_spec.flags &= ~V2_ONLY_FLAG;
		gfc.tag_spec.flags |= SPACE_V1_FLAG;
	}

	public final void id3tag_pad_v2(final LameGlobalFlags gfp) {
		id3tag_set_pad(gfp, 128);
	}

	public final void id3tag_set_pad(final LameGlobalFlags gfp, final int n) {
		LameInternalFlags gfc = gfp.internal_flags;
		gfc.tag_spec.flags &= ~V1_ONLY_FLAG;
		gfc.tag_spec.flags |= PAD_V2_FLAG;
		gfc.tag_spec.flags |= ADD_V2_FLAG;
		gfc.tag_spec.padding_size = n;
	}

	/**
	 * <PRE>
	 * 	Some existing options for ID3 tag can be specified by --tv option
	 * 	as follows.
	 * 	--tt <value>, --tv TIT2=value
	 * 	--ta <value>, --tv TPE1=value
	 * 	--tl <value>, --tv TALB=value
	 * 	--ty <value>, --tv TYER=value
	 * 	--tn <value>, --tv TRCK=value
	 * 	--tg <value>, --tv TCON=value
	 * 	(although some are not exactly same)
	 * </PRE>
	 */

	public final boolean id3tag_set_albumart(final LameGlobalFlags gfp,
			final byte[] image, final int size) {
		MimeType mimetype = MimeType.MIMETYPE_NONE;
		byte[] data = image;
		LameInternalFlags gfc = gfp.internal_flags;

		/* make sure the image size is no larger than the maximum value */
		if (Lame.LAME_MAXALBUMART < size) {
			return false;
		}
		/* determine MIME type from the actual image data */
		if (2 < size && data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) {
			mimetype = MimeType.MIMETYPE_JPEG;
		} else if (4 < size && data[0] == 0x89
				&& new String(data, 1, 3, ASCII).startsWith("PNG")) {
			mimetype = MimeType.MIMETYPE_PNG;
		} else if (4 < size && new String(data, 1, 3, ASCII).startsWith("GIF8")) {
			mimetype = MimeType.MIMETYPE_GIF;
		} else {
			return false;
		}
		if (gfc.tag_spec.albumart != null) {
			gfc.tag_spec.albumart = null;
			gfc.tag_spec.albumart_size = 0;
			gfc.tag_spec.albumart_mimetype = MimeType.MIMETYPE_NONE;
		}
		if (size < 1) {
			return true;
		}
		gfc.tag_spec.albumart = new byte[size];
		if (gfc.tag_spec.albumart != null) {
			System.arraycopy(image, 0, gfc.tag_spec.albumart, 0, size);
			gfc.tag_spec.albumart_size = size;
			gfc.tag_spec.albumart_mimetype = mimetype;
			gfc.tag_spec.flags |= CHANGED_FLAG;
			id3tag_add_v2(gfp);
		}
		return true;
	}

	private int set_4_byte_value(final byte[] bytes, final int bytesPos,
			int value) {
		int i;
		for (i = 3; i >= 0; --i) {
			bytes[bytesPos + i] = (byte) (value & 0xff);
			value >>= 8;
		}
		return bytesPos + 4;
	}

	private int toID3v2TagId(final String s) {
		int i, x = 0;
		if (s == null) {
			return 0;
		}
		for (i = 0; i < 4 && i < s.length(); ++i) {
			char c = s.charAt(i);
			int u = 0x0ff & c;
			x <<= 8;
			x |= u;
			if (c < 'A' || 'Z' < c) {
				if (c < '0' || '9' < c) {
					return 0;
				}
			}
		}
		return x;
	}

	private boolean isNumericString(final int frame_id) {
		if (frame_id == ID_DATE || frame_id == ID_TIME || frame_id == ID_TPOS
				|| frame_id == ID_TRACK || frame_id == ID_YEAR) {
			return true;
		}
		return false;
	}

	private boolean isMultiFrame(final int frame_id) {
		if (frame_id == ID_TXXX || frame_id == ID_WXXX
				|| frame_id == ID_COMMENT || frame_id == ID_SYLT
				|| frame_id == ID_APIC || frame_id == ID_GEOB
				|| frame_id == ID_PCNT || frame_id == ID_AENC
				|| frame_id == ID_LINK || frame_id == ID_ENCR
				|| frame_id == ID_GRID || frame_id == ID_PRIV) {
			return true;
		}
		return false;
	}

	private boolean hasUcs2ByteOrderMarker(final char bom) {
		if (bom == 0xFFFE || bom == 0xFEFF) {
			return true;
		}
		return false;
	}

	private FrameDataNode findNode(final ID3TagSpec tag, final int frame_id,
			final FrameDataNode last) {
		FrameDataNode node = last != null ? last.nxt : tag.v2_head;
		while (node != null) {
			if (node.fid == frame_id) {
				return node;
			}
			node = node.nxt;
		}
		return null;
	}

	private void appendNode(final ID3TagSpec tag, final FrameDataNode node) {
		if (tag.v2_tail == null || tag.v2_head == null) {
			tag.v2_head = node;
			tag.v2_tail = node;
		} else {
			tag.v2_tail.nxt = node;
			tag.v2_tail = node;
		}
	}

	private String setLang(final String src) {
		int i;
		if (src == null || src.length() == 0) {
			return "XXX";
		} else {
			StringBuilder dst = new StringBuilder();
			if (src != null) {
				dst.append(src.substring(0, 3));
			}
			for (i = dst.length(); i < 3; ++i) {
				dst.append(' ');
			}
			return dst.toString();
		}
	}

	private boolean isSameLang(final String l1, final String l2) {
		String d = setLang(l2);
		for (int i = 0; i < 3; ++i) {
			char a = Character.toLowerCase(l1.charAt(i));
			char b = Character.toLowerCase(d.charAt(i));
			if (a < ' ')
				a = ' ';
			if (b < ' ')
				b = ' ';
			if (a != b) {
				return false;
			}
		}
		return true;
	}

	private boolean isSameDescriptor(final FrameDataNode node, final String dsc) {
		if (node.dsc.enc == 1 && node.dsc.dim > 0) {
			return false;
		}
		for (int i = 0; i < node.dsc.dim; ++i) {
			if (null == dsc || node.dsc.l.charAt(i) != dsc.charAt(i)) {
				return false;
			}
		}
		return true;
	}

	private boolean isSameDescriptorUcs2(final FrameDataNode node,
			final String dsc) {
		if (node.dsc.enc != 1 && node.dsc.dim > 0) {
			return false;
		}
		for (int i = 0; i < node.dsc.dim; ++i) {
			if (null == dsc || node.dsc.l.charAt(i) != dsc.charAt(i)) {
				return false;
			}
		}
		return true;
	}

	private void id3v2_add_ucs2(final LameGlobalFlags gfp, final int frame_id,
			final String lang, final String desc, final String text) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (gfc != null) {
			FrameDataNode node = findNode(gfc.tag_spec, frame_id, null);
			if (isMultiFrame(frame_id)) {
				while (node != null) {
					if (isSameLang(node.lng, lang)) {
						if (isSameDescriptorUcs2(node, desc)) {
							break;
						}
					}
					node = findNode(gfc.tag_spec, frame_id, node);
				}
			}
			if (node == null) {
				node = new FrameDataNode();
				appendNode(gfc.tag_spec, node);
			}
			node.fid = frame_id;
			node.lng = setLang(lang);
			node.dsc.l = desc;
			node.dsc.dim = desc != null ? desc.length() : 0;
			node.dsc.enc = 1;
			node.txt.l = text;
			node.txt.dim = text != null ? text.length() : 0;
			node.txt.enc = 1;
			gfc.tag_spec.flags |= (CHANGED_FLAG | ADD_V2_FLAG);
		}
	}

	private void id3v2_add_latin1(final LameGlobalFlags gfp,
			final int frame_id, final String lang, final String desc,
			final String text) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (gfc != null) {
			FrameDataNode node;
			node = findNode(gfc.tag_spec, frame_id, null);
			if (isMultiFrame(frame_id)) {
				while (node != null) {
					if (isSameLang(node.lng, lang)) {
						if (isSameDescriptor(node, desc)) {
							break;
						}
					}
					node = findNode(gfc.tag_spec, frame_id, node);
				}
			}
			if (node == null) {
				node = new FrameDataNode();
				appendNode(gfc.tag_spec, node);
			}
			node.fid = frame_id;
			node.lng = setLang(lang);
			node.dsc.l = desc;
			node.dsc.dim = desc != null ? desc.length() : 0;
			node.dsc.enc = 0;
			node.txt.l = text;
			node.txt.dim = text != null ? text.length() : 0;
			node.txt.enc = 0;
			gfc.tag_spec.flags |= (CHANGED_FLAG | ADD_V2_FLAG);
		}
	}

	public final int id3tag_set_textinfo_ucs2(final LameGlobalFlags gfp,
			final String id, final String text) {
		long t_mask = FRAME_ID('T', (char) 0, (char) 0, (char) 0);
		int frame_id = toID3v2TagId(id);
		if (frame_id == 0) {
			return -1;
		}
		if ((frame_id & t_mask) == t_mask) {
			if (isNumericString(frame_id)) {
				return -2; /* must be Latin-1 encoded */
			}
			if (text == null) {
				return 0;
			}
			if (!hasUcs2ByteOrderMarker(text.charAt(0))) {
				return -3; /* BOM missing */
			}
			if (gfp != null) {
				id3v2_add_ucs2(gfp, frame_id, null, null, text);
				return 0;
			}
		}
		return -255; /* not supported by now */
	}

	private int id3tag_set_textinfo_latin1(final LameGlobalFlags gfp,
			final String id, final String text) {
		long t_mask = FRAME_ID('T', (char) 0, (char) 0, (char) 0);
		int frame_id = toID3v2TagId(id);
		if (frame_id == 0) {
			return -1;
		}
		if ((frame_id & t_mask) == t_mask) {
			if (text == null) {
				return 0;
			}
			if (gfp != null) {
				id3v2_add_latin1(gfp, frame_id, null, null, text);
				return 0;
			}
		}
		return -255; /* not supported by now */
	}

	public final int id3tag_set_comment(final LameGlobalFlags gfp,
			final String lang, final String desc, final String text,
			final int textPos) {
		if (gfp != null) {
			id3v2_add_latin1(gfp, ID_COMMENT, lang, desc, text);
			return 0;
		}
		return -255;
	}

	public final void id3tag_set_title(final LameGlobalFlags gfp,
			final String title) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (title != null && title.length() != 0) {
			gfc.tag_spec.title = title;
			gfc.tag_spec.flags |= CHANGED_FLAG;
			copyV1ToV2(gfp, ID_TITLE, title);
		}
	}

	public final void id3tag_set_artist(final LameGlobalFlags gfp,
			final String artist) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (artist != null && artist.length() != 0) {
			gfc.tag_spec.artist = artist;
			gfc.tag_spec.flags |= CHANGED_FLAG;
			copyV1ToV2(gfp, ID_ARTIST, artist);
		}
	}

	public final void id3tag_set_album(final LameGlobalFlags gfp,
			final String album) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (album != null && album.length() != 0) {
			gfc.tag_spec.album = album;
			gfc.tag_spec.flags |= CHANGED_FLAG;
			copyV1ToV2(gfp, ID_ALBUM, album);
		}
	}

	public final void id3tag_set_year(final LameGlobalFlags gfp,
			final String year) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (year != null && year.length() != 0) {
			int num = Integer.valueOf(year);
			if (num < 0) {
				num = 0;
			}
			/* limit a year to 4 digits so it fits in a version 1 tag */
			if (num > 9999) {
				num = 9999;
			}
			if (num != 0) {
				gfc.tag_spec.year = num;
				gfc.tag_spec.flags |= CHANGED_FLAG;
			}
			copyV1ToV2(gfp, ID_YEAR, year);
		}
	}

	public final void id3tag_set_comment(final LameGlobalFlags gfp,
			final String comment) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (comment != null && comment.length() != 0) {
			gfc.tag_spec.comment = comment;
			gfc.tag_spec.flags |= CHANGED_FLAG;
			{
				int flags = gfc.tag_spec.flags;
				id3v2_add_latin1(gfp, ID_COMMENT, "XXX", "", comment);
				gfc.tag_spec.flags = flags;
			}
		}
	}

	public final int id3tag_set_track(final LameGlobalFlags gfp,
			final String track) {
		LameInternalFlags gfc = gfp.internal_flags;
		int ret = 0;

		if (track != null && track.length() != 0) {
			int trackcount = track.indexOf('/');
			int num;
			if (trackcount != -1) {
				num = Integer.parseInt(track.substring(0, trackcount));
			} else {
				num = Integer.parseInt(track);
			}
			/* check for valid ID3v1 track number range */
			if (num < 1 || num > 255) {
				num = 0;
				ret = -1;
				/* track number out of ID3v1 range, ignored for ID3v1 */
				gfc.tag_spec.flags |= (CHANGED_FLAG | ADD_V2_FLAG);
			}
			if (num != 0) {
				gfc.tag_spec.track_id3v1 = num;
				gfc.tag_spec.flags |= CHANGED_FLAG;
			}
			/* Look for the total track count after a "/", same restrictions */
			if (trackcount != -1) {
				gfc.tag_spec.flags |= (CHANGED_FLAG | ADD_V2_FLAG);
			}
			copyV1ToV2(gfp, ID_TRACK, track);
		}
		return ret;
	}

	private int nextUpperAlpha(final String p, int pPos, final char x) {
		for (char c = Character.toUpperCase(p.charAt(pPos)); pPos < p.length(); c = Character
				.toUpperCase(p.charAt(pPos++))) {
			if ('A' <= c && c <= 'Z') {
				if (c != x) {
					return pPos;
				}
			}
		}
		return pPos;
	}

	private boolean sloppyCompared(final String p, final String q) {
		int pPos = nextUpperAlpha(p, 0, (char) 0);
		int qPos = nextUpperAlpha(q, 0, (char) 0);
		char cp = pPos < p.length() ? Character.toUpperCase(p.charAt(pPos)) : 0;
		char cq = Character.toUpperCase(q.charAt(qPos));
		while (cp == cq) {
			if (cp == 0) {
				return true;
			}
			if (p.charAt(1) == '.') { /* some abbrevation */
				while (qPos < q.length() && q.charAt(qPos++) != ' ') {
				}
			}
			pPos = nextUpperAlpha(p, pPos, cp);
			qPos = nextUpperAlpha(q, qPos, cq);
			cp = pPos < p.length() ? Character.toUpperCase(p.charAt(pPos)) : 0;
			cq = Character.toUpperCase(q.charAt(qPos));
		}
		return false;
	}

	private int sloppySearchGenre(final String genre) {
		for (int i = 0; i < genre_names.length; ++i) {
			if (sloppyCompared(genre, genre_names[i])) {
				return i;
			}
		}
		return genre_names.length;
	}

	private int searchGenre(final String genre) {
		for (int i = 0; i < genre_names.length; ++i) {
			if (genre_names[i].equals(genre)) {
				return i;
			}
		}
		return genre_names.length;
	}

	public final int id3tag_set_genre(final LameGlobalFlags gfp, String genre) {
		LameInternalFlags gfc = gfp.internal_flags;
		int ret = 0;
		if (genre != null && genre.length() != 0) {
			int num;
			try {
				num = Integer.parseInt(genre);
				if ((num < 0) || (num >= genre_names.length)) {
					return -1;
				}
				genre = genre_names[num];
			} catch (NumberFormatException e) {
				/* is the input a string or a valid number? */
				num = searchGenre(genre);
				if (num == genre_names.length) {
					num = sloppySearchGenre(genre);
				}
				if (num == genre_names.length) {
					num = GENRE_INDEX_OTHER;
					ret = -2;
				} else {
					genre = genre_names[num];
				}
			}
			gfc.tag_spec.genre_id3v1 = num;
			gfc.tag_spec.flags |= CHANGED_FLAG;
			if (ret != 0) {
				gfc.tag_spec.flags |= ADD_V2_FLAG;
			}
			copyV1ToV2(gfp, ID_GENRE, genre);
		}
		return ret;
	}

	private int set_frame_custom(final byte[] frame, int framePos,
			final char[] fieldvalue) {
		if (fieldvalue != null && fieldvalue[0] != 0) {
			int value = 5;
			int length = new String(fieldvalue, value, fieldvalue.length
					- value).length();
			frame[framePos++] = (byte) fieldvalue[0];
			frame[framePos++] = (byte) fieldvalue[1];
			frame[framePos++] = (byte) fieldvalue[2];
			frame[framePos++] = (byte) fieldvalue[3];
			framePos = set_4_byte_value(frame, value, (new String(fieldvalue,
					value, fieldvalue.length - value).length() + 1));
			/* clear 2-byte header flags */
			frame[framePos++] = 0;
			frame[framePos++] = 0;
			/* clear 1 encoding descriptor byte to indicate ISO-8859-1 format */
			frame[framePos++] = 0;
			while (length-- != 0) {
				frame[framePos++] = (byte) fieldvalue[value++];
			}
		}
		return framePos;
	}

	private int sizeOfNode(final FrameDataNode node) {
		int n = 0;
		if (node != null) {
			n = 10;
			/* header size */
			n += 1;
			/* text encoding flag */
			switch (node.txt.enc) {
			default:
			case 0:
				n += node.txt.dim;
				break;
			case 1:
				n += node.txt.dim * 2;
				break;
			}
		}
		return n;
	}

	private int sizeOfCommentNode(final FrameDataNode node) {
		int n = 0;
		if (node != null) {
			n = 10;
			/* header size */
			n += 1;
			/* text encoding flag */
			n += 3;
			/* language */
			switch (node.dsc.enc) {
			default:
			case 0:
				n += 1 + node.dsc.dim;
				break;
			case 1:
				n += 2 + node.dsc.dim * 2;
				break;
			}
			switch (node.txt.enc) {
			default:
			case 0:
				n += node.txt.dim;
				break;
			case 1:
				n += node.txt.dim * 2;
				break;
			}
		}
		return n;
	}

	private int writeChars(final byte[] frame, int framePos, final String str,
			int strPos, int n) {
		while (n-- != 0) {
			frame[framePos++] = (byte) str.charAt(strPos++);
		}
		return framePos;
	}

	private int writeUcs2s(final byte[] frame, int framePos, final String str,
			int strPos, int n) {
		while (n-- != 0) {
			frame[framePos++] = (byte) (0xff & (str.charAt(strPos) >> 8));
			frame[framePos++] = (byte) (0xff & (str.charAt(strPos++)));
		}
		return framePos;
	}

	private int set_frame_comment(final byte[] frame, int framePos,
			final FrameDataNode node) {
		int n = sizeOfCommentNode(node);
		if (n > 10) {
			framePos = set_4_byte_value(frame, framePos, ID_COMMENT);
			framePos = set_4_byte_value(frame, framePos, (int) (n - 10));
			/* clear 2-byte header flags */
			frame[framePos++] = 0;
			frame[framePos++] = 0;
			/* encoding descriptor byte */
			frame[framePos++] = node.txt.enc == 1 ? (byte) 1 : (byte) 0;
			/* 3 bytes language */
			frame[framePos++] = (byte) (node.lng.charAt(0));
			frame[framePos++] = (byte) node.lng.charAt(1);
			frame[framePos++] = (byte) node.lng.charAt(2);
			/* descriptor with zero byte(s) separator */
			if (node.dsc.enc != 1) {
				framePos = writeChars(frame, framePos, node.dsc.l, 0,
						node.dsc.dim);
				frame[framePos++] = 0;
			} else {
				framePos = writeUcs2s(frame, framePos, node.dsc.l, 0,
						node.dsc.dim);
				frame[framePos++] = 0;
				frame[framePos++] = 0;
			}
			/* comment full text */
			if (node.txt.enc != 1) {
				framePos = writeChars(frame, framePos, node.txt.l, 0,
						node.txt.dim);
			} else {
				framePos = writeUcs2s(frame, framePos, node.txt.l, 0,
						node.txt.dim);
			}
		}
		return framePos;
	}

	private int set_frame_custom2(final byte[] frame, int framePos,
			final FrameDataNode node) {
		int n = sizeOfNode(node);
		if (n > 10) {
			framePos = set_4_byte_value(frame, framePos, node.fid);
			framePos = set_4_byte_value(frame, framePos, (n - 10));
			/* clear 2-byte header flags */
			frame[framePos++] = 0;
			frame[framePos++] = 0;
			/* clear 1 encoding descriptor byte to indicate ISO-8859-1 format */
			frame[framePos++] = node.txt.enc == 1 ? (byte) 1 : (byte) 0;
			if (node.txt.enc != 1) {
				framePos = writeChars(frame, framePos, node.txt.l, 0,
						node.txt.dim);
			} else {
				framePos = writeUcs2s(frame, framePos, node.txt.l, 0,
						node.txt.dim);
			}
		}
		return framePos;
	}

	private int set_frame_apic(final byte[] frame, int framePos,
			final char[] mimetype, final byte[] data, int size) {
		/**
		 * <PRE>
		 *  ID3v2.3 standard APIC frame:
		 *     <Header for 'Attached picture', ID: "APIC">
		 *     Text encoding    $xx
		 *     MIME type        <text string> $00
		 *     Picture type     $xx
		 *     Description      <text string according to encoding> $00 (00)
		 *     Picture data     <binary data>
		 * </PRE>
		 */
		if (mimetype != null && data != null && size != 0) {
			framePos = set_4_byte_value(frame, framePos,
					FRAME_ID('A', 'P', 'I', 'C'));
			framePos = set_4_byte_value(frame, framePos,
					(4 + (mimetype.length) + size));
			/* clear 2-byte header flags */
			frame[framePos++] = 0;
			frame[framePos++] = 0;
			/* clear 1 encoding descriptor byte to indicate ISO-8859-1 format */
			frame[framePos++] = 0;
			/* copy mime_type */
			int mimetypePos = 0;
			while (mimetypePos < mimetype.length) {
				frame[framePos++] = (byte) mimetype[mimetypePos++];
			}
			frame[framePos++] = 0;
			/* set picture type to 0 */
			frame[framePos++] = 0;
			/* empty description field */
			frame[framePos++] = 0;
			/* copy the image data */
			int dataPos = 0;
			while (size-- != 0) {
				frame[framePos++] = data[dataPos++];
			}
		}
		return framePos;
	}

	public final int id3tag_set_fieldvalue(final LameGlobalFlags gfp,
			final String fieldvalue) {
		LameInternalFlags gfc = gfp.internal_flags;
		if (fieldvalue != null && fieldvalue.length() != 0) {
			int frame_id = toID3v2TagId(fieldvalue);
			if (fieldvalue.length() < 5 || fieldvalue.charAt(4) != '=') {
				return -1;
			}
			if (frame_id != 0) {
				if (id3tag_set_textinfo_latin1(gfp, fieldvalue,
						fieldvalue.substring(5)) != 0) {
					gfc.tag_spec.values.add(fieldvalue);
					gfc.tag_spec.num_values++;
				}
			}
			gfc.tag_spec.flags |= CHANGED_FLAG;
		}
		id3tag_add_v2(gfp);
		return 0;
	}

	private static final String mime_jpeg = "image/jpeg";
	private static final String mime_png = "image/png";
	private static final String mime_gif = "image/gif";

	public final int lame_get_id3v2_tag(final LameGlobalFlags gfp,
			final byte[] buffer, final int size) {
		LameInternalFlags gfc;
		if (gfp == null) {
			return 0;
		}
		gfc = gfp.internal_flags;
		if (gfc == null) {
			return 0;
		}
		if ((gfc.tag_spec.flags & V1_ONLY_FLAG) != 0) {
			return 0;
		}
		{
			/* calculate length of four fields which may not fit in verion 1 tag */
			int title_length = gfc.tag_spec.title != null ? gfc.tag_spec.title
					.length() : 0;
			int artist_length = gfc.tag_spec.artist != null ? gfc.tag_spec.artist
					.length() : 0;
			int album_length = gfc.tag_spec.album != null ? gfc.tag_spec.album
					.length() : 0;
			int comment_length = gfc.tag_spec.comment != null ? gfc.tag_spec.comment
					.length() : 0;
			/* write tag if explicitly requested or if fields overflow */
			if ((gfc.tag_spec.flags & (ADD_V2_FLAG | V2_ONLY_FLAG)) != 0
					|| (title_length > 30) || (artist_length > 30)
					|| (album_length > 30) || (comment_length > 30)
					|| (gfc.tag_spec.track_id3v1 != 0 && (comment_length > 28))) {
				int tag_size;
				int p;
				int adjusted_tag_size;
				int i;
				String albumart_mime = null;

				id3v2AddAudioDuration(gfp);

				/* calulate size of tag starting with 10-byte tag header */
				tag_size = 10;
				for (i = 0; i < gfc.tag_spec.num_values; ++i) {
					tag_size += 6 + gfc.tag_spec.values.get(i).length();
				}
				if (gfc.tag_spec.albumart != null
						&& gfc.tag_spec.albumart_size != 0) {
					switch (gfc.tag_spec.albumart_mimetype) {
					case MIMETYPE_JPEG:
						albumart_mime = mime_jpeg;
						break;
					case MIMETYPE_PNG:
						albumart_mime = mime_png;
						break;
					case MIMETYPE_GIF:
						albumart_mime = mime_gif;
						break;
					}
					if (albumart_mime != null) {
						tag_size += 10 + 4 + albumart_mime.length()
								+ gfc.tag_spec.albumart_size;
					}
				}
				{
					ID3TagSpec tag = gfc.tag_spec;
					if (tag.v2_head != null) {
						FrameDataNode node;
						for (node = tag.v2_head; node != null; node = node.nxt) {
							if (node.fid == ID_COMMENT) {
								tag_size += sizeOfCommentNode(node);
							} else {
								tag_size += sizeOfNode(node);
							}
						}
					}
				}
				if ((gfc.tag_spec.flags & PAD_V2_FLAG) != 0) {
					/* add some bytes of padding */
					tag_size += gfc.tag_spec.padding_size;
				}
				if (size < tag_size) {
					return tag_size;
				}
				if (buffer == null) {
					return 0;
				}
				p = 0;
				/* set tag header starting with file identifier */
				buffer[p++] = 'I';
				buffer[p++] = 'D';
				buffer[p++] = '3';
				/* set version number word */
				buffer[p++] = 3;
				buffer[p++] = 0;
				/* clear flags byte */
				buffer[p++] = 0;
				/* calculate and set tag size = total size - header size */
				adjusted_tag_size = tag_size - 10;
				/*
				 * encode adjusted size into four bytes where most significant
				 * bit is clear in each byte, for 28-bit total
				 */
				buffer[p++] = (byte) ((adjusted_tag_size >> 21) & 0x7f);
				buffer[p++] = (byte) ((adjusted_tag_size >> 14) & 0x7f);
				buffer[p++] = (byte) ((adjusted_tag_size >> 7) & 0x7f);
				buffer[p++] = (byte) (adjusted_tag_size & 0x7f);

				/*
				 * NOTE: The remainder of the tag (frames and padding, if any)
				 * are not "unsynchronized" to prevent false MPEG audio headers
				 * from appearing in the bitstream. Why? Well, most players and
				 * utilities know how to skip the ID3 version 2 tag by now even
				 * if they don't read its contents, and it's actually very
				 * unlikely that such a false "sync" pattern would occur in just
				 * the simple text frames added here.
				 */

				/* set each frame in tag */
				{
					ID3TagSpec tag = gfc.tag_spec;
					if (tag.v2_head != null) {
						FrameDataNode node;
						for (node = tag.v2_head; node != null; node = node.nxt) {
							if (node.fid == ID_COMMENT) {
								p = set_frame_comment(buffer, p, node);
							} else {
								p = set_frame_custom2(buffer, p, node);
							}
						}
					}
				}
				for (i = 0; i < gfc.tag_spec.num_values; ++i) {
					p = set_frame_custom(buffer, p, gfc.tag_spec.values.get(i)
							.toCharArray());
				}
				if (albumart_mime != null) {
					p = set_frame_apic(buffer, p, albumart_mime.toCharArray(),
							gfc.tag_spec.albumart, gfc.tag_spec.albumart_size);
				}
				/* clear any padding bytes */
				Arrays.fill(buffer, p, tag_size, (byte) 0);
				return tag_size;
			}
		}
		return 0;
	}

	public final int id3tag_write_v2(final LameGlobalFlags gfp) {
		LameInternalFlags gfc = gfp.internal_flags;
		if ((gfc.tag_spec.flags & CHANGED_FLAG) != 0
				&& 0 == (gfc.tag_spec.flags & V1_ONLY_FLAG)) {
			byte[] tag = null;
			int tag_size, n;

			n = lame_get_id3v2_tag(gfp, null, 0);
			tag = new byte[n];
			tag_size = lame_get_id3v2_tag(gfp, tag, n);
			if (tag_size > n) {
				return -1;
			} else {
				/* write tag directly into bitstream at current position */
				for (int i = 0; i < tag_size; ++i) {
					bits.add_dummy_byte(gfp, tag[i] & 0xff, 1);
				}
			}
			return (int) tag_size;
			/* ok, tag should not exceed 2GB */
		}
		return 0;
	}

	private int set_text_field(final byte[] field, int fieldPos,
			final String text, int size, final int pad) {
		int textPos = 0;
		while (size-- != 0) {
			if (text != null && textPos < text.length()) {
				field[fieldPos++] = (byte) text.charAt(textPos++);
			} else {
				field[fieldPos++] = (byte) pad;
			}
		}
		return fieldPos;
	}

	public final int lame_get_id3v1_tag(final LameGlobalFlags gfp,
			final byte[] buffer, final int size) {
		int tag_size = 128;
		LameInternalFlags gfc;

		if (gfp == null) {
			return 0;
		}
		if (size < tag_size) {
			return tag_size;
		}
		gfc = gfp.internal_flags;
		if (gfc == null) {
			return 0;
		}
		if (buffer == null) {
			return 0;
		}
		if ((gfc.tag_spec.flags & CHANGED_FLAG) != 0
				&& 0 == (gfc.tag_spec.flags & V2_ONLY_FLAG)) {
			int p = 0;
			int pad = (gfc.tag_spec.flags & SPACE_V1_FLAG) != 0 ? ' ' : 0;
			String year;

			/* set tag identifier */
			buffer[p++] = 'T';
			buffer[p++] = 'A';
			buffer[p++] = 'G';
			/* set each field in tag */
			p = set_text_field(buffer, p, gfc.tag_spec.title, 30, pad);
			p = set_text_field(buffer, p, gfc.tag_spec.artist, 30, pad);
			p = set_text_field(buffer, p, gfc.tag_spec.album, 30, pad);
			year = String.format("%d", Integer.valueOf(gfc.tag_spec.year));
			p = set_text_field(buffer, p, gfc.tag_spec.year != 0 ? year : null,
					4, pad);
			/* limit comment field to 28 bytes if a track is specified */
			p = set_text_field(buffer, p, gfc.tag_spec.comment,
					gfc.tag_spec.track_id3v1 != 0 ? 28 : 30, pad);
			if (gfc.tag_spec.track_id3v1 != 0) {
				/* clear the next byte to indicate a version 1.1 tag */
				buffer[p++] = 0;
				buffer[p++] = (byte) gfc.tag_spec.track_id3v1;
			}
			buffer[p++] = (byte) gfc.tag_spec.genre_id3v1;
			return tag_size;
		}
		return 0;
	}

	public final int id3tag_write_v1(final LameGlobalFlags gfp) {
		byte tag[] = new byte[128];

		int m = tag.length;
		int n = lame_get_id3v1_tag(gfp, tag, m);
		if (n > m) {
			return 0;
		}
		/* write tag directly into bitstream at current position */
		for (int i = 0; i < n; ++i) {
			bits.add_dummy_byte(gfp, tag[i] & 0xff, 1);
		}
		return (int) n; /* ok, tag has fixed size of 128 bytes, well below 2GB */
	}

}
