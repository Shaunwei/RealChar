/*
 *      LAME MP3 encoding engine
 *
 *      Copyright (c) 1999-2000 Mark Taylor
 *      Copyright (c) 2003 Olcios
 *      Copyright (c) 2008 Robert Hegemann
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
package mpg;

import mp3.Enc;
import mp3.MP3Data;
import mp3.PlottingData;
import mpg.MPG123;
import mpg.Decode.Factory;

public class MPGLib {

	Interface interf;
	Common common;
	
	public void setModules(Interface i, Common c) {
		interf = i;
		common = c;
	}

	public static class buf {
	    byte[] pnt;
	    int    size;
	    int    pos;
	    buf next;
	    buf prev;
	};

	public static class framebuf {
	    buf buf;
	    long    pos;
	    Frame next;
	    Frame prev;
	};


	public static class mpstr_tag {
	    buf head, tail; /* buffer linked list pointers, tail points to oldest buffer */
	    boolean vbr_header;      /* 1 if valid Xing vbr header detected */
	    int     num_frames;      /* set if vbr header present */
	    int     enc_delay;       /* set if vbr header present */
	    int     enc_padding;     /* set if vbr header present */
	    /* header_parsed, side_parsed and data_parsed must be all set 1
	       before the full frame has been parsed */
	    boolean header_parsed;   /* 1 = header of current frame has been parsed */
	    boolean side_parsed;     /* 1 = header of sideinfo of current frame has been parsed */
	    boolean data_parsed;
	    boolean free_format;     /* 1 = free format frame */
	    boolean old_free_format; /* 1 = last frame was free format */
	    int     bsize;
	    int     framesize;
	    int     ssize;           /* number of bytes used for side information, including 2 bytes for CRC-16 if present */
	    int     dsize;
	    int     fsizeold;        /* size of previous frame, -1 for first */
	    int     fsizeold_nopadding;
	    Frame fr = new Frame();         /* holds the parameters decoded from the header */
	    byte bsspace[][]=new byte[2][MPG123.MAXFRAMESIZE + 1024]; /* bit stream space used ???? */ /* MAXFRAMESIZE */
	    float    hybrid_block[][][]=new float[2][2][MPG123.SBLIMIT * MPG123.SSLIMIT];
	    int     hybrid_blc[]=new int[2];
	    long header;
	    int     bsnum;
	    float    synth_buffs[][][]= new float[2][2][0x110];
	    int     synth_bo;
	    int     sync_bitstream;  /* 1 = bitstream is yet to be synchronized */

	    int     bitindex;
		byte[] wordpointer;
	    int wordpointerPos;
	    PlottingData pinfo;
	}

	public final static int MP3_ERR =-1;
	public final static int MP3_OK  =0;
	final static int MP3_NEED_MORE =1;

    /* copy mono samples */
	@SuppressWarnings("unchecked")
	protected <DST_TYPE, SRC_TYPE> void COPY_MONO(DST_TYPE[] pcm_l,
			int pcm_lPos, int processed_samples, SRC_TYPE[] p) {
		int p_samples = 0;
		for (int i = 0; i < processed_samples; i++)
			pcm_l[pcm_lPos++] = (DST_TYPE) (p[p_samples++]);
	}

    /* copy stereo samples */
	@SuppressWarnings("unchecked")
	protected <DST_TYPE, SRC_TYPE> void COPY_STEREO(DST_TYPE[] pcm_l,
			int pcm_lPos, DST_TYPE[] pcm_r, int pcm_rPos,
			int processed_samples, SRC_TYPE[] p) {
		int p_samples = 0;
		for (int i = 0; i < processed_samples; i++) {
			pcm_l[pcm_lPos++] = (DST_TYPE) (p[p_samples++]);
			pcm_r[pcm_rPos++] = (DST_TYPE) (p[p_samples++]);
		}
	}

    static class ProcessedBytes {
    	int pb;
    }

    interface IDecoder {
    	<T>int decode(mpstr_tag mp, byte []in, int bufferPos, int isize, T []out, int osize, ProcessedBytes done, Factory<T> tFactory);
    }
    
    private static final int smpls[][] = {
        /* Layer   I    II   III */
        {0, 384, 1152, 1152}, /* MPEG-1     */
        {0, 384, 1152, 576} /* MPEG-2(.5) */
    };

    /*
     * For lame_decode:  return code
     * -1     error
     *  0     ok, but need more data before outputing any samples
     *  n     number of samples output.  either 576 or 1152 depending on MP3 file.
     */

	private <S,T>int decode1_headersB_clipchoice(mpstr_tag pmp, byte[] buffer,
			int bufferPos, int len, S pcm_l[], int pcm_lPos, S pcm_r[], int pcm_rPos, MP3Data mp3data,
			Enc enc, T[] p, int psize,
			IDecoder decodeMP3_ptr, Factory<T> tFactory) {

        int     processed_samples; /* processed samples per channel */
        int     ret;

        mp3data.header_parsed = false;

        ProcessedBytes pb = new ProcessedBytes();
        ret = decodeMP3_ptr.decode(pmp, buffer, bufferPos, len, p, psize, pb, tFactory);
        processed_samples = pb.pb;
        /* three cases:  
         * 1. headers parsed, but data not complete
         *       pmp.header_parsed==1 
         *       pmp.framesize=0           
         *       pmp.fsizeold=size of last frame, or 0 if this is first frame
         *
         * 2. headers, data parsed, but ancillary data not complete
         *       pmp.header_parsed==1 
         *       pmp.framesize=size of frame           
         *       pmp.fsizeold=size of last frame, or 0 if this is first frame
         *
         * 3. frame fully decoded:  
         *       pmp.header_parsed==0 
         *       pmp.framesize=0           
         *       pmp.fsizeold=size of frame (which is now the last frame)
         *
         */
        if (pmp.header_parsed || pmp.fsizeold > 0 || pmp.framesize > 0) {
            mp3data.header_parsed = true;
            mp3data.stereo = pmp.fr.stereo;
            mp3data.samplerate = Common.freqs[pmp.fr.sampling_frequency];
            mp3data.mode = pmp.fr.mode;
            mp3data.mode_ext = pmp.fr.mode_ext;
            mp3data.framesize = smpls[pmp.fr.lsf][pmp.fr.lay];

            /* free format, we need the entire frame before we can determine
             * the bitrate.  If we haven't gotten the entire frame, bitrate=0 */
            if (pmp.fsizeold > 0) /* works for free format and fixed, no overrun, temporal results are < 400.e6 */
                mp3data.bitrate = (int) (8 * (4 + pmp.fsizeold) * mp3data.samplerate /
                    (1.e3 * mp3data.framesize) + 0.5);
            else if (pmp.framesize > 0)
                mp3data.bitrate = (int) (8 * (4 + pmp.framesize) * mp3data.samplerate /
                    (1.e3 * mp3data.framesize) + 0.5);
            else
                mp3data.bitrate = Common.tabsel_123[pmp.fr.lsf][pmp.fr.lay - 1][pmp.fr.bitrate_index];



            if (pmp.num_frames > 0) {
                /* Xing VBR header found and num_frames was set */
                mp3data.totalframes = pmp.num_frames;
                mp3data.nsamp = mp3data.framesize * pmp.num_frames;
                enc.enc_delay = pmp.enc_delay;
                enc.enc_padding = pmp.enc_padding;
            }
        }

        switch (ret) {
        case MP3_OK:
            switch (pmp.fr.stereo) {
            case 1:
				COPY_MONO(pcm_l, pcm_lPos, processed_samples, p);
                break;
            case 2:
                processed_samples = (processed_samples) >> 1;
				COPY_STEREO(pcm_l, pcm_lPos, pcm_r, pcm_rPos,processed_samples, p);
                break;
            default:
                processed_samples = -1;
                assert(false);
                break;
            }
            break;

        case MP3_NEED_MORE:
            processed_samples = 0;
            break;

        case MP3_ERR:
            processed_samples = -1;
            break;

        default:
            processed_samples = -1;
            assert(false);
            break;
        }

        /*fprintf(stderr,"ok, more, err:  %i %i %i\n", MP3_OK, MP3_NEED_MORE, MP3_ERR ); */
        /*fprintf(stderr,"ret = %i out=%i\n", ret, processed_samples ); */
        return processed_samples;
    }

    private static final int OUTSIZE_CLIPPED = 4096;

	public mpstr_tag hip_decode_init()
    {
        return interf.InitMP3();
    }


    public int hip_decode_exit(mpstr_tag hip)
    {
        if (hip!=null) {
        	interf.ExitMP3(hip);
            hip = null;
        }
        return 0;
    }

    /* we forbid input with more than 1152 samples per channel for output in the unclipped mode */
	private final static int OUTSIZE_UNCLIPPED = 1152*2;

	/*
	 * same as hip_decode1 (look in lame.h), but returns unclipped raw
	 * floating-point samples. It is declared here, not in lame.h, because it
	 * returns LAME's internal type sample_t. No more than 1152 samples per
	 * channel are allowed.
	 */
	public int hip_decode1_unclipped(mpstr_tag hip, byte[] buffer, int bufferPos,
			int len, final float pcm_l[], final float pcm_r[]) {

		MP3Data mp3data = new MP3Data();
		Enc enc = new Enc();

		if (hip != null) {
            IDecoder dec = new IDecoder() {
				
				@Override
				public <X>int decode(mpstr_tag mp, byte[] in, int bufferPos, int isize,
						X[] out, int osize, ProcessedBytes done, Factory<X> tFactory) {
					return interf.decodeMP3_unclipped(mp, in, bufferPos, isize, out, osize, done, tFactory);
				}
			};
			Float[] out = new Float[OUTSIZE_UNCLIPPED];
			Factory<Float> tFactory = new Factory<Float>() {

				@Override
				public Float create(float x) {
					return Float.valueOf(x);
				}
			};
			// XXX should we avoid the primitive type version?
			Float[] pcmL = new Float[pcm_l.length];
			for (int i = 0; i < pcmL.length; i++) {
				pcmL[i] = Float.valueOf(pcm_l[i]);
			}
			Float[] pcmR = new Float[pcm_r.length];
			for (int i = 0; i < pcmR.length; i++) {
				pcmR[i] = Float.valueOf(pcm_r[i]);
			}
			int decode1_headersB_clipchoice = decode1_headersB_clipchoice(hip, buffer, bufferPos, len,
					pcmL, 0, pcmR, 0, mp3data, enc, out, OUTSIZE_UNCLIPPED, dec, tFactory );
			for (int i = 0; i < pcmL.length; i++) {
				pcm_l[i] = pcmL[i];
			}
			for (int i = 0; i < pcmR.length; i++) {
				pcm_r[i] = pcmR[i];
			}
			return decode1_headersB_clipchoice;
		}
		return 0;
	}

	/*
	 * For lame_decode:  return code
	 *  -1     error
	 *   0     ok, but need more data before outputing any samples
	 *   n     number of samples output.  Will be at most one frame of
	 *         MPEG data.  
	 */
	public int
	hip_decode1_headers(mpstr_tag hip, byte[]buffer,
	                     int len, short pcm_l[], short pcm_r[], MP3Data mp3data)
	{
		Enc enc = new Enc();
	    return hip_decode1_headersB(hip, buffer, len, pcm_l, pcm_r, mp3data, enc);
	}

    public int
    hip_decode1_headersB(mpstr_tag hip, byte[] buffer,
                          int len,
                          final short pcm_l[], final short pcm_r[], MP3Data mp3data,
                          Enc enc)
    {
        if (hip!=null) {
            IDecoder dec = new IDecoder() {
				
				@Override
				public <X>int decode(mpstr_tag mp, byte[] in, int bufferPos, int isize,
						X[] out, int osize, ProcessedBytes done, Factory<X> tFactory) {
					return interf.decodeMP3(mp, in, bufferPos, isize, out, osize, done, tFactory);
				}
			};
			Short[] out = new Short[OUTSIZE_CLIPPED];
			Factory<Short> tFactory = new Factory<Short>() {

				@Override
				public Short create(float x) {
					return Short.valueOf((short)x);
				}
			};
			// XXX should we avoid the primitive type version?
			Short[] pcmL = new Short[pcm_l.length];
			for (int i = 0; i < pcmL.length; i++) {
				pcmL[i] = Short.valueOf(pcm_l[i]);
			}
			Short[] pcmR = new Short[pcm_r.length];
			for (int i = 0; i < pcmR.length; i++) {
				pcmR[i] = Short.valueOf(pcm_r[i]);
			}
			int decode1_headersB_clipchoice = decode1_headersB_clipchoice(hip, buffer, 0, len, pcmL, 0, pcmR, 0, mp3data,
                                               enc, out, OUTSIZE_CLIPPED,
                                               dec, tFactory );
			for (int i = 0; i < pcmL.length; i++) {
				pcm_l[i] = pcmL[i];
			}
			for (int i = 0; i < pcmR.length; i++) {
				pcm_r[i] = pcmR[i];
			}
			return decode1_headersB_clipchoice;
        }
        return -1;
    }

    void hip_set_pinfo(mpstr_tag hip, PlottingData pinfo)
    {
        if (hip!=null) {
            hip.pinfo = pinfo;
        }
    }
    
}
