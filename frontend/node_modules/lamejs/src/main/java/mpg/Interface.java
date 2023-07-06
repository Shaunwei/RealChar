/*
 * interface.c
 *
 * Copyright (C) 1999-2010 The L.A.M.E. project
 *
 * Initially written by Michael Hipp, see also AUTHORS and README.
 *  
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */
/* $Id: Interface.java,v 1.12 2011/08/27 18:57:09 kenchis Exp $ */

package mpg;

import mp3.VBRTag;
import mp3.VBRTagData;
import mpg.Decode.Factory;
import mpg.MPGLib.ProcessedBytes;
import mpg.MPGLib.buf;
import mpg.MPGLib.mpstr_tag;

public class Interface {

	private VBRTag vbr;
	private Common common;

	public void setModules(VBRTag v, Common c) {
		vbr = v;
		common = c;
		layer1.setModules(common, decode);
		layer2.setModules(common);
		layer3.setModules(common);
		decode.setModules(tab, dct);
		dct.setModules(tab);
	}

	protected Decode decode = new Decode();
	private Layer1 layer1 = new Layer1() ;
	private Layer2 layer2 = new Layer2();
	private Layer3 layer3 = new Layer3();
	private DCT64 dct = new DCT64();
	private TabInit tab = new TabInit();

	mpstr_tag
	InitMP3()
	{
		mpstr_tag mp = new mpstr_tag();

	    mp.framesize = 0;
	    mp.num_frames = 0;
	    mp.enc_delay = -1;
	    mp.enc_padding = -1;
	    mp.vbr_header = false;
	    mp.header_parsed = false;
	    mp.side_parsed = false;
	    mp.data_parsed = false;
	    mp.free_format = false;
	    mp.old_free_format = false;
	    mp.ssize = 0;
	    mp.dsize = 0;
	    mp.fsizeold = -1;
	    mp.bsize = 0;
	    mp.head = mp.tail = null;
	    mp.fr.single = -1;
	    mp.bsnum = 0;
	    mp.wordpointer = mp.bsspace[mp.bsnum];
	    mp.wordpointerPos = 512;
	    mp.bitindex = 0;
	    mp.synth_bo = 1;
	    mp.sync_bitstream = 1;

	    tab.make_decode_tables(32767);

	    layer3.init_layer3(MPG123.SBLIMIT);

	    layer2.init_layer2();

	    return mp;
	}
	
	void
	ExitMP3(mpstr_tag mp)
	{
	    buf b, bn;

	    b = mp.tail;
	    while (b!=null) {
	        b.pnt=null;
	        bn = b.next;
	        b = bn;
	    }
	}

	buf
	addbuf(mpstr_tag mp, byte []buf, int bufPos, int size)
	{
	    buf nbuf;

	    nbuf = new buf();
	    nbuf.pnt = new byte[size];
	    nbuf.size = size;
	    System.arraycopy(buf, bufPos, nbuf.pnt, 0, size);
	    nbuf.next = null;
	    nbuf.prev = mp.head;
	    nbuf.pos = 0;

	    if (null==mp.tail) {
	        mp.tail = nbuf;
	    }
	    else {
	        mp.head.next = nbuf;
	    }

	    mp.head = nbuf;
	    mp.bsize += size;

	    return nbuf;
	}

	void
	remove_buf(mpstr_tag mp)
	{
	    buf buf = mp.tail;

	    mp.tail = buf.next;
	    if (mp.tail!=null)
	        mp.tail.prev = null;
	    else {
	        mp.tail = mp.head = null;
	    }

	    buf.pnt=null;
	    buf=null;

	}

	int
	read_buf_byte(mpstr_tag mp)
	{
	    int b;

	    int     pos;


	    pos = mp.tail.pos;
	    while (pos >= mp.tail.size) {
	        remove_buf(mp);
	        if (null==mp.tail) {
	            throw new RuntimeException("hip: Fatal error! tried to read past mp buffer");
	        }
	        pos = mp.tail.pos;
	    }

	    b = mp.tail.pnt[pos] & 0xff;
	    mp.bsize--;
	    mp.tail.pos++;


	    return b;
	}

	void
	read_head(mpstr_tag mp)
	{
	    long head;

	    head = read_buf_byte(mp);
	    head <<= 8;
	    head |= read_buf_byte(mp);
	    head <<= 8;
	    head |= read_buf_byte(mp);
	    head <<= 8;
	    head |= read_buf_byte(mp);

	    mp.header = head;
	}

	void
	copy_mp(mpstr_tag mp, int size, byte[]ptr, int ptrPos)
	{
	    int     len = 0;

	    while (len < size && mp.tail!=null) {
	        int     nlen;
	        int     blen = mp.tail.size - mp.tail.pos;
	        if ((size - len) <= blen) {
	            nlen = size - len;
	        }
	        else {
	            nlen = blen;
	        }
	        System.arraycopy(mp.tail.pnt, mp.tail.pos, ptr, ptrPos+len, nlen);
	        len += nlen;
	        mp.tail.pos += nlen;
	        mp.bsize -= nlen;
	        if (mp.tail.pos == mp.tail.size) {
	            remove_buf(mp);
	        }
	    }
	}

	/* number of bytes needed by GetVbrTag to parse header */
	public static final int XING_HEADER_SIZE =194;

	/*
	traverse mp data structure without changing it
	(just like sync_buffer)
	pull out Xing bytes
	call vbr header check code from LAME
	if we find a header, parse it and also compute the VBR header size
	if no header, do nothing.

	bytes = number of bytes before MPEG header.  skip this many bytes
	before starting to read
	return value: number of bytes in VBR header, including syncword
	*/
	int
	check_vbr_header(mpstr_tag mp, int bytes)
	{
	    int     i, pos;
	    buf buf = mp.tail;
	    byte xing[]=new byte[XING_HEADER_SIZE];

	    pos = buf.pos;
	    /* skip to valid header */
	    for (i = 0; i < bytes; ++i) {
	        while (pos >= buf.size) {
	            buf = buf.next;
	            if (null==buf)
	                return -1; /* fatal error */
	            pos = buf.pos;
	        }
	        ++pos;
	    }
	    /* now read header */
	    for (i = 0; i < XING_HEADER_SIZE; ++i) {
	        while (pos >= buf.size) {
	            buf = buf.next;
	            if (null==buf)
	                return -1; /* fatal error */
	            pos = buf.pos;
	        }
	        xing[i] = buf.pnt[pos];
	        ++pos;
	    }

	    /* check first bytes for Xing header */
	    VBRTagData pTagData = vbr.getVbrTag(xing);
		mp.vbr_header = pTagData != null;
	    if (mp.vbr_header) {
	        mp.num_frames = pTagData.frames;
	        mp.enc_delay = pTagData.encDelay;
	        mp.enc_padding = pTagData.encPadding;

	        /* fprintf(stderr,"hip: delays: %i %i \n",mp.enc_delay,mp.enc_padding); */
	        /* fprintf(stderr,"hip: Xing VBR header dectected.  MP3 file has %i frames\n", pTagData.frames); */
	        if (pTagData.headersize < 1)
	            return 1;
	        return pTagData.headersize;
	    }
	    return 0;
	}

	int
	sync_buffer(mpstr_tag mp, boolean free_match)
	{
	    /* traverse mp structure without modifying pointers, looking
	     * for a frame valid header.
	     * if free_format, valid header must also have the same
	     * samplerate.   
	     * return number of bytes in mp, before the header
	     * return -1 if header is not found
	     */
	    int b[] = { 0, 0, 0, 0 };
	    int     i, pos;
	    boolean h;
	    buf buf = mp.tail;
	    if (null==buf)
	        return -1;

	    pos = buf.pos;
	    for (i = 0; i < mp.bsize; i++) {
	        /* get 4 bytes */

	        b[0] = b[1];
	        b[1] = b[2];
	        b[2] = b[3];
	        while (pos >= buf.size) {
	            buf = buf.next;
	            pos = buf.pos;
	        }
	        b[3] = buf.pnt[pos] & 0xff;
	        ++pos;

	        if (i >= 3) {
	            Frame fr = mp.fr;
	            long head;

	            head = b[0];
	            head <<= 8;
	            head |= b[1];
	            head <<= 8;
	            head |= b[2];
	            head <<= 8;
	            head |= b[3];
	            h = common.head_check(head, fr.lay);

	            if (h && free_match) {
	                /* just to be even more thorough, match the sample rate */
	                int     mode, stereo, sampling_frequency, lsf;
	                boolean mpeg25;

	                if ((head & (1 << 20))!=0) {
	                    lsf = (head & (1 << 19)) !=0 ? 0x0 : 0x1;
	                    mpeg25 = false;
	                }
	                else {
	                    lsf = 1;
	                    mpeg25 = true;
	                }

	                mode = (int) ((head >> 6) & 0x3);
	                stereo = (mode == MPG123.MPG_MD_MONO) ? 1 : 2;

	                if (mpeg25)
	                    sampling_frequency = (int) (6 + ((head >> 10) & 0x3));
	                else
	                    sampling_frequency = (int) (((head >> 10) & 0x3) + (lsf * 3));
	                h = ((stereo == fr.stereo) && (lsf == fr.lsf) && (mpeg25 == fr.mpeg25) &&
	                     (sampling_frequency == fr.sampling_frequency));
	            }

	            if (h) {
	                return i - 3;
	            }
	        }
	    }
	    return -1;
	}

	mpstr_tag
	decode_reset()
	{
		return InitMP3();        /* Less error prone to just to reinitialise. */
	}

	int
	audiodata_precedesframes(mpstr_tag mp)
	{
	    if (mp.fr.lay == 3)
	        return layer3.layer3_audiodata_precedesframes(mp);
	    else
	        return 0;       /* For Layer 1 & 2 the audio data starts at the frame that describes it, so no audio data precedes. */
	}

    interface ISynth {
    	<T>int synth_1to1_mono_ptr (mpstr_tag mp, float[] in, int inPos, T[] out, ProcessedBytes p, Factory<T> tFactory);
        <T>int synth_1to1_ptr (mpstr_tag mp, float[] in, int inPos, int i, T[] out, ProcessedBytes p, Factory<T> tFactory);
    }
    
	<T>int
	decodeMP3_clipchoice(mpstr_tag mp, byte[] in, int inPos, int isize, T[] out, ProcessedBytes done,
			ISynth synth, Factory<T> tFactory)
	{
	    int     i, iret, bits, bytes;

	    if (in!=null && isize!=0 && addbuf(mp, in, inPos, isize) == null)
	        return MPGLib.MP3_ERR;

	    /* First decode header */
	    if (!mp.header_parsed) {

	        if (mp.fsizeold == -1 || mp.sync_bitstream!=0) {
	            int     vbrbytes;
	            mp.sync_bitstream = 0;

	            /* This is the very first call.   sync with anything */
	            /* bytes= number of bytes before header */
	            bytes = sync_buffer(mp, false);

	            /* now look for Xing VBR header */
	            if (mp.bsize >= bytes + XING_HEADER_SIZE) {
	                /* vbrbytes = number of bytes in entire vbr header */
	                vbrbytes = check_vbr_header(mp, bytes);
	            }
	            else {
	                /* not enough data to look for Xing header */
//	#ifdef HIP_DEBUG
//	                fprintf(stderr, "hip: not enough data to look for Xing header\n");
//	#endif
	                return MPGLib.MP3_NEED_MORE;
	            }

	            if (mp.vbr_header) {
	                /* do we have enough data to parse entire Xing header? */
	                if (bytes + vbrbytes > mp.bsize) {
	                    /* fprintf(stderr,"hip: not enough data to parse entire Xing header\n"); */
	                    return MPGLib.MP3_NEED_MORE;
	                }

	                /* read in Xing header.  Buffer data in case it
	                 * is used by a non zero main_data_begin for the next
	                 * frame, but otherwise dont decode Xing header */
//	#ifdef HIP_DEBUG
//	                fprintf(stderr, "hip: found xing header, skipping %i bytes\n", vbrbytes + bytes);
//	#endif
	                for (i = 0; i < vbrbytes + bytes; ++i)
	                    read_buf_byte(mp);
	                /* now we need to find another syncword */
	                /* just return and make user send in more data */

	                return MPGLib.MP3_NEED_MORE;
	            }
	        }
	        else {
	            /* match channels, samplerate, etc, when syncing */
	            bytes = sync_buffer(mp, true);
	        }

	        /* buffer now synchronized */
	        if (bytes < 0) {
	            /* fprintf(stderr,"hip: need more bytes %d\n", bytes); */
	            return MPGLib.MP3_NEED_MORE;
	        }
	        if (bytes > 0) {
	            /* there were some extra bytes in front of header.
	             * bitstream problem, but we are now resynced 
	             * should try to buffer previous data in case new
	             * frame has nonzero main_data_begin, but we need
	             * to make sure we do not overflow buffer
	             */
	            int     size;
	            System.err.printf("hip: bitstream problem, resyncing skipping %d bytes...\n", bytes);
	            mp.old_free_format = false;

	            /* FIXME: correct ??? */
	            mp.sync_bitstream = 1;

	            /* skip some bytes, buffer the rest */
	            size = mp.wordpointerPos - 512;

	            if (size > MPG123.MAXFRAMESIZE) {
	                /* wordpointer buffer is trashed.  probably cant recover, but try anyway */
	                System.err.printf("hip: wordpointer trashed.  size=%i (%i)  bytes=%i \n",
	                        size, MPG123.MAXFRAMESIZE, bytes);
	                size = 0;
	                mp.wordpointer = mp.bsspace[mp.bsnum]; 
	                mp.wordpointerPos = 512;
	            }

	            /* buffer contains 'size' data right now 
	               we want to add 'bytes' worth of data, but do not 
	               exceed MAXFRAMESIZE, so we through away 'i' bytes */
	            i = (size + bytes) - MPG123.MAXFRAMESIZE;
	            for (; i > 0; --i) {
	                --bytes;
	                read_buf_byte(mp);
	            }

	            copy_mp(mp, bytes, mp.wordpointer, mp.wordpointerPos);
	            mp.fsizeold += bytes;
	        }

	        read_head(mp);
	        common.decode_header(mp.fr, mp.header);
	        mp.header_parsed = true;
	        mp.framesize = mp.fr.framesize;
	        mp.free_format = (mp.framesize == 0);

	        if (mp.fr.lsf!=0)
	            mp.ssize = (mp.fr.stereo == 1) ? 9 : 17;
	        else
	            mp.ssize = (mp.fr.stereo == 1) ? 17 : 32;
	        if (mp.fr.error_protection)
	            mp.ssize += 2;

	        mp.bsnum = 1 - mp.bsnum; /* toggle buffer */
            mp.wordpointer = mp.bsspace[mp.bsnum]; 
            mp.wordpointerPos = 512;
	        mp.bitindex = 0;

	        /* for very first header, never parse rest of data */
	        if (mp.fsizeold == -1) {
//	#ifdef HIP_DEBUG
//	            fprintf(stderr, "hip: not parsing the rest of the data of the first header\n");
//	#endif
	            return MPGLib.MP3_NEED_MORE;
	        }
	    }                   /* end of header parsing block */

	    /* now decode side information */
	    if (!mp.side_parsed) {

	        /* Layer 3 only */
	        if (mp.fr.lay == 3) {
	            if (mp.bsize < mp.ssize)
	                return MPGLib.MP3_NEED_MORE;

	            copy_mp(mp, mp.ssize, mp.wordpointer, mp.wordpointerPos);

	            if (mp.fr.error_protection)
	                common.getbits(mp, 16);
	            bits = layer3.do_layer3_sideinfo(mp);
	            /* bits = actual number of bits needed to parse this frame */
	            /* can be negative, if all bits needed are in the reservoir */
	            if (bits < 0)
	                bits = 0;

	            /* read just as many bytes as necessary before decoding */
	            mp.dsize = (bits + 7) / 8;

//	#ifdef HIP_DEBUG
//	            fprintf(stderr,
//	                    "hip: %d bits needed to parse layer III frame, number of bytes to read before decoding dsize = %d\n",
//	                    bits, mp.dsize);
//	#endif

	            /* this will force mpglib to read entire frame before decoding */
	            /* mp.dsize= mp.framesize - mp.ssize; */

	        }
	        else {
	            /* Layers 1 and 2 */

	            /* check if there is enough input data */
	            if (mp.fr.framesize > mp.bsize)
	                return MPGLib.MP3_NEED_MORE;

	            /* takes care that the right amount of data is copied into wordpointer */
	            mp.dsize = mp.fr.framesize;
	            mp.ssize = 0;
	        }

	        mp.side_parsed = true;
	    }

	    /* now decode main data */
	    iret = MPGLib.MP3_NEED_MORE;
	    if (!mp.data_parsed) {
	        if (mp.dsize > mp.bsize) {
	            return MPGLib.MP3_NEED_MORE;
	        }

	        copy_mp(mp, mp.dsize, mp.wordpointer, mp.wordpointerPos);

	        done.pb = 0;

	        /*do_layer3(&mp.fr,(unsigned char *) out,done); */
	        switch (mp.fr.lay) {
	        case 1:
	            if (mp.fr.error_protection)
	                common.getbits(mp, 16);

	            layer1.do_layer1(mp, out, done, tFactory);
	            break;

	        case 2:
	            if (mp.fr.error_protection)
	                common.getbits(mp, 16);

	            layer2.do_layer2(mp, out, done, synth, tFactory);
	            break;

	        case 3:
	            layer3.do_layer3(mp, out, done, synth, tFactory);
	            break;
	        default:
	            System.err.printf("hip: invalid layer %d\n", mp.fr.lay);
	        }

            mp.wordpointer = mp.bsspace[mp.bsnum]; 
            mp.wordpointerPos = 512 + mp.ssize + mp.dsize;

	        mp.data_parsed = true;
	        iret = MPGLib.MP3_OK;
	    }


	    /* remaining bits are ancillary data, or reservoir for next frame 
	     * If free format, scan stream looking for next frame to determine
	     * mp.framesize */
	    if (mp.free_format) {
	        if (mp.old_free_format) {
	            /* free format.  bitrate must not vary */
	            mp.framesize = mp.fsizeold_nopadding + (mp.fr.padding);
	        }
	        else {
	            bytes = sync_buffer(mp, true);
	            if (bytes < 0)
	                return iret;
	            mp.framesize = bytes + mp.ssize + mp.dsize;
	            mp.fsizeold_nopadding = mp.framesize - mp.fr.padding;
	            /*
	               fprintf(stderr,"hip: freeformat bitstream:  estimated bitrate=%ikbs  \n",
	               8*(4+mp.framesize)*freqs[mp.fr.sampling_frequency]/
	               (1000*576*(2-mp.fr.lsf)));
	             */
	        }
	    }

	    /* buffer the ancillary data and reservoir for next frame */
	    bytes = mp.framesize - (mp.ssize + mp.dsize);
	    if (bytes > mp.bsize) {
	        return iret;
	    }

	    if (bytes > 0) {
	        int     size;
	        copy_mp(mp, bytes, mp.wordpointer, mp.wordpointerPos);
	        mp.wordpointerPos += bytes;

	        size = mp.wordpointerPos - 512;
	        if (size > MPG123.MAXFRAMESIZE) {
	            System.err.printf("hip: fatal error.  MAXFRAMESIZE not large enough.\n");
	        }

	    }

	    /* the above frame is completely parsed.  start looking for next frame */
	    mp.fsizeold = mp.framesize;
	    mp.old_free_format = mp.free_format;
	    mp.framesize = 0;
	    mp.header_parsed = false;
	    mp.side_parsed = false;
	    mp.data_parsed = false;

	    return iret;
	}

    <T>int
    decodeMP3(MPGLib.mpstr_tag mp, byte []in, int bufferPos, int isize, T []out, int osize, ProcessedBytes done, Factory<T> tFactory)
    {
        if (osize < 2304) {
            System.err.printf("hip: Insufficient memory for decoding buffer %d\n", osize);
            return MPGLib.MP3_ERR;
        }

        /* passing pointers to the functions which clip the samples */
        ISynth synth = new ISynth() {

			@Override
			public <X> int synth_1to1_mono_ptr(mpstr_tag mp, float[] in,
					int inPos, X[] out, ProcessedBytes p,
					Factory<X> tFactory) {
				return decode.synth_1to1_mono(mp, in, inPos, out, p, tFactory);
			}

			@Override
			public <X> int synth_1to1_ptr(mpstr_tag mp, float[] in, int inPos,
					int i, X[] out, ProcessedBytes p,
					Factory<X> tFactory) {
				return decode.synth_1to1(mp, in, inPos, i, out, p, tFactory);
			}
			
		};
        return decodeMP3_clipchoice(mp, in, bufferPos, isize, out, done, synth, tFactory);
    }

    <T>int
    decodeMP3_unclipped(MPGLib.mpstr_tag mp, byte []in, int bufferPos, int isize, T []out, int osize, ProcessedBytes done, Factory<T> tFactory)
    {
        /* we forbid input with more than 1152 samples per channel for output in unclipped mode */
        if (osize < 1152 * 2) {
            System.err.printf("hip: out space too small for unclipped mode\n");
            return MPGLib.MP3_ERR;
        }

        ISynth synth = new ISynth() {

			@Override
			public <X>int synth_1to1_mono_ptr(mpstr_tag mp, float[] in,
					int inPos, X[] out, ProcessedBytes p,
					Factory<X> tFactory) {
				return decode.synth_1to1_mono_unclipped(mp, in, inPos, out, p, tFactory);
			}

			@Override
			public <X>int synth_1to1_ptr(mpstr_tag mp, float[] in, int inPos,
					int i, X[] out, ProcessedBytes p,
					Factory<X> tFactory) {
				return decode.synth_1to1_unclipped(mp, in, inPos, i, out, p, tFactory);
			}
			
		};
        /* passing pointers to the functions which don't clip the samples */
        return decodeMP3_clipchoice(mp, in, bufferPos, isize, out, done, synth, tFactory);
    }
}
