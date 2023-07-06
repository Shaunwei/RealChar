/*
 *	Get Audio routines source file
 *
 *	Copyright (c) 1999 Albert L Faber
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	 See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */

/* $Id: GetAudio.java,v 1.26 2011/08/27 18:57:12 kenchis Exp $ */

package mp3;

import java.io.BufferedOutputStream;
import java.io.DataOutput;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteOrder;
import java.nio.charset.Charset;
import java.util.Arrays;

import mpg.MPGLib;

public class GetAudio {

	Parse parse;
	MPGLib mpg;

	public void setModules(Parse parse2, MPGLib mpg2) {
		parse = parse2;
		mpg = mpg2;
	}

	public enum sound_file_format {
		sf_unknown, sf_raw, sf_wave, sf_aiff,
		/**
		 * MPEG Layer 1, aka mpg
		 */
		sf_mp1,
		/**
		 * MPEG Layer 2
		 */
		sf_mp2,
		/**
		 * MPEG Layer 3
		 */
		sf_mp3,
		/**
		 * MPEG Layer 1,2 or 3; whatever .mp3, .mp2, .mp1 or .mpg contains
		 */
		sf_mp123, sf_ogg
	}

	protected static final class BlockAlign {
		int offset;
		int blockSize;
	}

	protected static final class IFF_AIFF {
		short numChannels;
		int numSampleFrames;
		short sampleSize;
		double sampleRate;
		int sampleType;
		BlockAlign blkAlgn = new BlockAlign();
	}

	private boolean count_samples_carefully;
	private int pcmbitwidth;
	private boolean pcmswapbytes;
	private boolean pcm_is_unsigned_8bit;
	private int num_samples_read;
	private RandomAccessFile musicin;
	private MPGLib.mpstr_tag hip;

	public DataOutput init_outfile(final String outPath) {
		/* open the output file */
		DataOutput outf;
		try {
			new File(outPath).delete();
			outf = new DataOutputStream(new BufferedOutputStream(new FileOutputStream(outPath), 1<<20));
		} catch (FileNotFoundException e) {
			e.printStackTrace();
			return null;
		}
		return outf;
	}

	public final void init_infile(final LameGlobalFlags gfp,
			final String inPath, final Enc enc) {
		/* open the input file */
		count_samples_carefully = false;
		num_samples_read = 0;
		pcmbitwidth = parse.in_bitwidth;
		pcmswapbytes = parse.swapbytes;
		pcm_is_unsigned_8bit = !parse.in_signed;
		musicin = OpenSndFile(gfp, inPath, enc);
	}

	public final void close_infile() {
		closeSndFile(parse.input_format, musicin);
	}

	/**
	 * reads a frame of audio data from a file to the buffer, aligns the data
	 * for future processing, and separates the left and right channels
	 */
	public final int get_audio(final LameGlobalFlags gfp, int buffer[][]) {
		return get_audio_common(gfp, buffer, null);
	}

	/**
	 * behave as the original get_audio function, with a limited 16 bit per
	 * sample output
	 */
	public final int get_audio16(final LameGlobalFlags gfp,
			final short buffer[][]) {
		return (get_audio_common(gfp, null, buffer));
	}

	/**
	 * central functionality of get_audio* note: either buffer or buffer16 must
	 * be allocated upon call
	 * 
	 * @param gfp
	 *            global flags
	 * @param buffer
	 *            buffer output to the int buffer or 16-bit buffer
	 * @param buffer16
	 *            16-bit output (if buffer == NULL)
	 * @return samples read
	 */
	private int get_audio_common(final LameGlobalFlags gfp,
			final int buffer[][], final short buffer16[][]) {
		int num_channels = gfp.num_channels;
		int insamp[] = new int[2 * 1152];
		short buf_tmp16[][] = new short[2][1152];
		int samples_read;
		int framesize;
		int samples_to_read;
		int remaining, tmp_num_samples;

		/*
		 * NOTE: LAME can now handle arbritray size input data packets, so there
		 * is no reason to read the input data in chuncks of size "framesize".
		 * EXCEPT: the LAME graphical frame analyzer will get out of sync if we
		 * read more than framesize worth of data.
		 */

		samples_to_read = framesize = gfp.framesize;
		assert (framesize <= 1152);

		/* get num_samples */
		tmp_num_samples = gfp.num_samples;

		/*
		 * if this flag has been set, then we are carefull to read exactly
		 * num_samples and no more. This is useful for .wav and .aiff files
		 * which have id3 or other tags at the end. Note that if you are using
		 * LIBSNDFILE, this is not necessary
		 */
		if (count_samples_carefully) {
			remaining = tmp_num_samples
					- Math.min(tmp_num_samples, num_samples_read);
			if (remaining < framesize && 0 != tmp_num_samples)
				/*
				 * in case the input is a FIFO (at least it's reproducible with
				 * a FIFO) tmp_num_samples may be 0 and therefore remaining
				 * would be 0, but we need to read some samples, so don't change
				 * samples_to_read to the wrong value in this case
				 */
				samples_to_read = remaining;
		}

		if (is_mpeg_file_format(parse.input_format)) {
			if (buffer != null)
				samples_read = read_samples_mp3(gfp, musicin, buf_tmp16);
			else
				samples_read = read_samples_mp3(gfp, musicin, buffer16);
			if (samples_read < 0) {
				return samples_read;
			}
		} else { /* convert from int; output to 16-bit buffer */
			samples_read = read_samples_pcm(musicin, insamp, num_channels
					* samples_to_read);
			if (samples_read < 0) {
				return samples_read;
			}
			int p = samples_read;
			samples_read /= num_channels;
			if (buffer != null) { /* output to int buffer */
				if (num_channels == 2) {
					for (int i = samples_read; --i >= 0;) {
						buffer[1][i] = insamp[--p];
						buffer[0][i] = insamp[--p];
					}
				} else if (num_channels == 1) {
					Arrays.fill(buffer[1], 0, samples_read, 0);
					for (int i = samples_read; --i >= 0;) {
						buffer[0][i] = insamp[--p];
					}
				} else
					assert (false);
			} else { /* convert from int; output to 16-bit buffer */
				if (num_channels == 2) {
					for (int i = samples_read; --i >= 0;) {
						buffer16[1][i] = (short) ((insamp[--p] >> 16) & 0xffff);
						buffer16[0][i] = (short) ((insamp[--p] >> 16) & 0xffff);
					}
				} else if (num_channels == 1) {
					Arrays.fill(buffer16[1], 0, samples_read, (short) 0);
					for (int i = samples_read; --i >= 0;) {
						buffer16[0][i] = (short) ((insamp[--p] >> 16) & 0xffff);
					}
				} else
					assert (false);
			}
		}

		/* LAME mp3 output 16bit - convert to int, if necessary */
		if (is_mpeg_file_format(parse.input_format)) {
			if (buffer != null) {
				for (int i = samples_read; --i >= 0;)
					buffer[0][i] = (buf_tmp16[0][i] & 0xffff) << 16;
				if (num_channels == 2) {
					for (int i = samples_read; --i >= 0;)
						buffer[1][i] = (buf_tmp16[1][i] & 0xffff) << 16;
				} else if (num_channels == 1) {
					Arrays.fill(buffer[1], 0, samples_read, 0);
				} else
					assert (false);
			}
		}

		/*
		 * if num_samples = MAX_U_32_NUM, then it is considered infinitely long.
		 * Don't count the samples
		 */
		if (tmp_num_samples != Integer.MAX_VALUE)
			num_samples_read += samples_read;

		return samples_read;
	}

	private static final String type_name = "MP3 file";

	int read_samples_mp3(final LameGlobalFlags gfp, RandomAccessFile musicin,
			short mpg123pcm[][]) {
		int out;

		out = lame_decode_fromfile(musicin, mpg123pcm[0], mpg123pcm[1],
				parse.mp3input_data);
		/*
		 * out < 0: error, probably EOF out = 0: not possible with
		 * lame_decode_fromfile() ??? out > 0: number of output samples
		 */
		if (out < 0) {
			Arrays.fill(mpg123pcm[0], (short) 0);
			Arrays.fill(mpg123pcm[1], (short) 0);
			return 0;
		}

		if (gfp.num_channels != parse.mp3input_data.stereo) {
			if (parse.silent < 10) {
				System.err
						.printf("Error: number of channels has changed in %s - not supported\n",
								type_name);
			}
			out = -1;
		}
		if (gfp.in_samplerate != parse.mp3input_data.samplerate) {
			if (parse.silent < 10) {
				System.err
						.printf("Error: sample frequency has changed in %s - not supported\n",
								type_name);
			}
			out = -1;
		}
		return out;
	}

	public final int WriteWaveHeader(final DataOutput fp,
			final int pcmbytes, final int freq, final int channels,
			final int bits) {
		try {
			int bytes = (bits + 7) / 8;

			/* quick and dirty, but documented */
			fp.writeBytes("RIFF"); /* label */
			write32BitsLowHigh(fp, pcmbytes + 44 - 8);
			/* length in bytes without header */
			fp.writeBytes("WAVEfmt ");
			/* 2 labels */
			write32BitsLowHigh(fp, 2 + 2 + 4 + 4 + 2 + 2);
			/* length of PCM format declaration area */
			write16BitsLowHigh(fp, 1);
			/* is PCM? */
			write16BitsLowHigh(fp, channels);
			/* number of channels */
			write32BitsLowHigh(fp, freq);
			/* sample frequency in [Hz] */
			write32BitsLowHigh(fp, freq * channels * bytes);
			/* bytes per second */
			write16BitsLowHigh(fp, channels * bytes);
			/* bytes per sample time */
			write16BitsLowHigh(fp, bits);
			/* bits per sample */
			fp.writeBytes("data");
			/* label */
			write32BitsLowHigh(fp, pcmbytes);
			/* length in bytes of raw PCM data */
		} catch (IOException e) {
			return -1;
		}
		return 0;
	}

	/**
	 * read and unpack signed low-to-high byte or unsigned single byte input.
	 * (used for read_samples function) Output integers are stored in the native
	 * byte order (little or big endian). -jd
	 * 
	 * @param swap_order
	 *            set for high-to-low byte order input stream
	 * @param sample_buffer
	 *            (must be allocated up to samples_to_read upon call)
	 * @return number of samples read
	 */
	private int unpack_read_samples(final int samples_to_read,
			final int bytes_per_sample, final boolean swap_order,
			final int[] sample_buffer, final RandomAccessFile pcm_in)
			throws IOException {
		byte[] bytes = new byte[bytes_per_sample * samples_to_read];
		pcm_in.readFully(bytes);
		int samples_read = samples_to_read;

		int op = samples_read;
		if (!swap_order) {
			if (bytes_per_sample == 1)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff) << 24;
			if (bytes_per_sample == 2)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff) << 16
							| (bytes[i + 1] & 0xff) << 24;
			if (bytes_per_sample == 3)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff) << 8
							| (bytes[i + 1] & 0xff) << 16
							| (bytes[i + 2] & 0xff) << 24;
			if (bytes_per_sample == 4)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff)
							| (bytes[i + 1] & 0xff) << 8
							| (bytes[i + 2] & 0xff) << 16
							| (bytes[i + 3] & 0xff) << 24;
		} else {
			if (bytes_per_sample == 1)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = ((bytes[i] ^ 0x80) & 0xff) << 24
							| 0x7f << 16; /* convert from unsigned */
			if (bytes_per_sample == 2)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff) << 24
							| (bytes[i + 1] & 0xff) << 16;
			if (bytes_per_sample == 3)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff) << 24
							| (bytes[i + 1] & 0xff) << 16
							| (bytes[i + 2] & 0xff) << 8;
			if (bytes_per_sample == 4)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
					sample_buffer[--op] = (bytes[i] & 0xff) << 24
							| (bytes[i + 1] & 0xff) << 16
							| (bytes[i + 2] & 0xff) << 8
							| (bytes[i + 3] & 0xff);
		}
		return (samples_read);
	}

	/**
	 * reads the PCM samples from a file to the buffer
	 * 
	 * SEMANTICS: Reads #samples_read# number of shorts from #musicin#
	 * filepointer into #sample_buffer[]#. Returns the number of samples read.
	 */
	private int read_samples_pcm(final RandomAccessFile musicin,
			final int sample_buffer[], final int samples_to_read) {
		int samples_read = 0;
		boolean swap_byte_order;
		/* byte order of input stream */

		try {
			switch (pcmbitwidth) {
			case 32:
			case 24:
			case 16:
				if (!parse.in_signed) {
					throw new RuntimeException("Unsigned input only supported with bitwidth 8");
				}
				{
					swap_byte_order = (parse.in_endian != ByteOrder.LITTLE_ENDIAN);
					if (pcmswapbytes) {
						swap_byte_order = !swap_byte_order;
					}
					samples_read = unpack_read_samples(samples_to_read,
							pcmbitwidth / 8, swap_byte_order, sample_buffer,
							musicin);

				}
				break;

			case 8: {
				samples_read = unpack_read_samples(samples_to_read, 1,
						pcm_is_unsigned_8bit, sample_buffer, musicin);
			}
				break;

			default: {
				throw new RuntimeException("Only 8, 16, 24 and 32 bit input files supported");
			}
			}
		} catch (IOException e) {
			throw new RuntimeException("Error reading input file", e);
		}

		return samples_read;
	}

	/* AIFF Definitions */

	/**
	 * "FORM"
	 */
	private static final int IFF_ID_FORM = 0x464f524d;
	/**
	 * "AIFF"
	 */
	private static final int IFF_ID_AIFF = 0x41494646;
	/**
	 * "AIFC"
	 */
	private static final int IFF_ID_AIFC = 0x41494643;
	/**
	 * "COMM"
	 */
	private static final int IFF_ID_COMM = 0x434f4d4d;
	/**
	 * "SSND"
	 */
	private static final int IFF_ID_SSND = 0x53534e44;

	/**
	 * "NONE" AIFF-C data format
	 */
	private static final int IFF_ID_NONE = 0x4e4f4e45;
	/**
	 * "twos" AIFF-C data format
	 */
	private static final int IFF_ID_2CBE = 0x74776f73;
	/**
	 * "sowt" AIFF-C data format
	 */
	private static final int IFF_ID_2CLE = 0x736f7774;

	/**
	 * "RIFF"
	 */
	private static final int WAV_ID_RIFF = 0x52494646;
	/**
	 * "WAVE"
	 */
	private static final int WAV_ID_WAVE = 0x57415645;
	/**
	 * "fmt "
	 */
	private static final int WAV_ID_FMT = 0x666d7420;
	/**
	 * "data"
	 */
	private static final int WAV_ID_DATA = 0x64617461;

	private static final short WAVE_FORMAT_PCM = 0x0001;
	private static final short WAVE_FORMAT_EXTENSIBLE = (short) 0xFFFE;

	/**
	 * Read Microsoft Wave headers
	 * 
	 * By the time we get here the first 32-bits of the file have already been
	 * read, and we're pretty sure that we're looking at a WAV file.
	 */
	private int parse_wave_header(final LameGlobalFlags gfp,
			final RandomAccessFile sf) {
		int format_tag = 0;
		int channels = 0;
		int bits_per_sample = 0;
		int samples_per_sec = 0;

		boolean is_wav = false;
		int data_length = 0, subSize = 0;
		int loop_sanity = 0;

		/* file_length = */Read32BitsHighLow(sf);
		if (Read32BitsHighLow(sf) != WAV_ID_WAVE)
			return -1;

		for (loop_sanity = 0; loop_sanity < 20; ++loop_sanity) {
			int type = Read32BitsHighLow(sf);

			if (type == WAV_ID_FMT) {
				subSize = Read32BitsLowHigh(sf);
				if (subSize < 16) {
					return -1;
				}

				format_tag = Read16BitsLowHigh(sf);
				subSize -= 2;
				channels = Read16BitsLowHigh(sf);
				subSize -= 2;
				samples_per_sec = Read32BitsLowHigh(sf);
				subSize -= 4;
				/* avg_bytes_per_sec = */Read32BitsLowHigh(sf);
				subSize -= 4;
				/* block_align = */Read16BitsLowHigh(sf);
				subSize -= 2;
				bits_per_sample = Read16BitsLowHigh(sf);
				subSize -= 2;

				/* WAVE_FORMAT_EXTENSIBLE support */
				if ((subSize > 9) && (format_tag == WAVE_FORMAT_EXTENSIBLE)) {
					Read16BitsLowHigh(sf); /* cbSize */
					Read16BitsLowHigh(sf); /* ValidBitsPerSample */
					Read32BitsLowHigh(sf); /* ChannelMask */
					/* SubType coincident with format_tag for PCM int or float */
					format_tag = Read16BitsLowHigh(sf);
					subSize -= 10;
				}

				if (subSize > 0) {
					try {
						sf.skipBytes(subSize);
					} catch (IOException e) {
						return -1;
					}
				}

			} else if (type == WAV_ID_DATA) {
				subSize = Read32BitsLowHigh(sf);
				data_length = subSize;
				is_wav = true;
				/* We've found the audio data. Read no further! */
				break;

			} else {
				subSize = Read32BitsLowHigh(sf);
				try {
					sf.skipBytes(subSize);
				} catch (IOException e) {
					return -1;
				}
			}
		}

		if (is_wav) {
			if (format_tag != WAVE_FORMAT_PCM) {
				if (parse.silent < 10) {
					System.err.printf("Unsupported data format: 0x%04X\n",
							format_tag);
				}
				/* oh no! non-supported format */
				return 0;
			}

			/* make sure the header is sane */
			if (-1 == (gfp.num_channels = channels)) {
				if (parse.silent < 10) {
					System.err.printf("Unsupported number of channels: %d\n",
							channels);
				}
				return 0;
			}
			gfp.in_samplerate = samples_per_sec;
			pcmbitwidth = bits_per_sample;
			pcm_is_unsigned_8bit = true;
			gfp.num_samples = data_length
					/ (channels * ((bits_per_sample + 7) / 8));
			return 1;
		}
		return -1;
	}

	/**
	 * Checks AIFF header information to make sure it is valid. returns 0 on
	 * success, 1 on errors
	 */
	private int aiff_check2(final IFF_AIFF pcm_aiff_data) {
		if (pcm_aiff_data.sampleType != IFF_ID_SSND) {
			if (parse.silent < 10) {
				System.err.printf("ERROR: input sound data is not PCM\n");
			}
			return 1;
		}
		switch (pcm_aiff_data.sampleSize) {
		case 32:
		case 24:
		case 16:
		case 8:
			break;
		default:
			if (parse.silent < 10) {
				System.err
						.printf("ERROR: input sound data is not 8, 16, 24 or 32 bits\n");
			}
			return 1;
		}
		if (pcm_aiff_data.numChannels != 1 && pcm_aiff_data.numChannels != 2) {
			if (parse.silent < 10) {
				System.err
						.printf("ERROR: input sound data is not mono or stereo\n");
			}
			return 1;
		}
		if (pcm_aiff_data.blkAlgn.blockSize != 0) {
			if (parse.silent < 10) {
				System.err
						.printf("ERROR: block size of input sound data is not 0 bytes\n");
			}
			return 1;
		}
		return 0;
	}

	private long make_even_number_of_bytes_in_length(final int x) {
		if ((x & 0x01) != 0) {
			return x + 1;
		}
		return x;
	}

	/**
	 * Read Audio Interchange File Format (AIFF) headers.
	 * 
	 * By the time we get here the first 32 bits of the file have already been
	 * read, and we're pretty sure that we're looking at an AIFF file.
	 */
	private int parse_aiff_header(final LameGlobalFlags gfp,
			final RandomAccessFile sf) {
		int subSize = 0, dataType = IFF_ID_NONE;
		IFF_AIFF aiff_info = new IFF_AIFF();
		int seen_comm_chunk = 0, seen_ssnd_chunk = 0;
		long pcm_data_pos = -1;

		int chunkSize = Read32BitsHighLow(sf);

		int typeID = Read32BitsHighLow(sf);
		if ((typeID != IFF_ID_AIFF) && (typeID != IFF_ID_AIFC))
			return -1;

		while (chunkSize > 0) {
			long ckSize;
			int type = Read32BitsHighLow(sf);
			chunkSize -= 4;

			/* don't use a switch here to make it easier to use 'break' for SSND */
			if (type == IFF_ID_COMM) {
				seen_comm_chunk = seen_ssnd_chunk + 1;
				subSize = Read32BitsHighLow(sf);
				ckSize = make_even_number_of_bytes_in_length(subSize);
				chunkSize -= ckSize;

				aiff_info.numChannels = (short) Read16BitsHighLow(sf);
				ckSize -= 2;
				aiff_info.numSampleFrames = Read32BitsHighLow(sf);
				ckSize -= 4;
				aiff_info.sampleSize = (short) Read16BitsHighLow(sf);
				ckSize -= 2;
				try {
					aiff_info.sampleRate = readIeeeExtendedHighLow(sf);
				} catch (IOException e1) {
					return -1;
				}
				ckSize -= 10;
				if (typeID == IFF_ID_AIFC) {
					dataType = Read32BitsHighLow(sf);
					ckSize -= 4;
				}
				try {
					sf.skipBytes((int) ckSize);
				} catch (IOException e) {
					return -1;
				}
			} else if (type == IFF_ID_SSND) {
				seen_ssnd_chunk = 1;
				subSize = Read32BitsHighLow(sf);
				ckSize = make_even_number_of_bytes_in_length(subSize);
				chunkSize -= ckSize;

				aiff_info.blkAlgn.offset = Read32BitsHighLow(sf);
				ckSize -= 4;
				aiff_info.blkAlgn.blockSize = Read32BitsHighLow(sf);
				ckSize -= 4;

				aiff_info.sampleType = IFF_ID_SSND;

				if (seen_comm_chunk > 0) {
					try {
						sf.skipBytes(aiff_info.blkAlgn.offset);
					} catch (IOException e) {
						return -1;
					}
					/* We've found the audio data. Read no further! */
					break;
				}
				try {
					pcm_data_pos = sf.getFilePointer();
				} catch (IOException e) {
					return -1;
				}
				if (pcm_data_pos >= 0) {
					pcm_data_pos += aiff_info.blkAlgn.offset;
				}
				try {
					sf.skipBytes((int) ckSize);
				} catch (IOException e) {
					return -1;
				}
			} else {
				subSize = Read32BitsHighLow(sf);
				ckSize = make_even_number_of_bytes_in_length(subSize);
				chunkSize -= ckSize;

				try {
					sf.skipBytes((int) ckSize);
				} catch (IOException e) {
					return -1;
				}
			}
		}
		if (dataType == IFF_ID_2CLE) {
			pcmswapbytes = parse.swapbytes;
		} else if (dataType == IFF_ID_2CBE) {
			pcmswapbytes = !parse.swapbytes;
		} else if (dataType == IFF_ID_NONE) {
			pcmswapbytes = !parse.swapbytes;
		} else {
			return -1;
		}

		if (seen_comm_chunk != 0
				&& (seen_ssnd_chunk > 0 || aiff_info.numSampleFrames == 0)) {
			/* make sure the header is sane */
			if (0 != aiff_check2(aiff_info))
				return 0;
			if (-1 == (gfp.num_channels = aiff_info.numChannels)) {
				if (parse.silent < 10) {
					System.err.printf("Unsupported number of channels: %u\n",
							aiff_info.numChannels);
				}
				return 0;
			}
			gfp.in_samplerate = (int) aiff_info.sampleRate;
			gfp.num_samples = aiff_info.numSampleFrames;
			pcmbitwidth = aiff_info.sampleSize;
			pcm_is_unsigned_8bit = false;

			if (pcm_data_pos >= 0) {
				try {
					sf.seek(pcm_data_pos);
				} catch (IOException e) {
					if (parse.silent < 10) {
						System.err
								.printf("Can't rewind stream to audio data position\n");
					}
					return 0;
				}
			}

			return 1;
		}
		return -1;
	}

	/**
	 * Read the header from a bytestream. Try to determine whether it's a WAV
	 * file or AIFF without rewinding, since rewind doesn't work on pipes and
	 * there's a good chance we're reading from stdin (otherwise we'd probably
	 * be using libsndfile).
	 * 
	 * When this function returns, the file offset will be positioned at the
	 * beginning of the sound data.
	 */
	private sound_file_format parse_file_header(final LameGlobalFlags gfp,
			final RandomAccessFile sf) {

		int type = Read32BitsHighLow(sf);
		count_samples_carefully = false;
		pcm_is_unsigned_8bit = !parse.in_signed;
		/*
		 * input_format = sf_raw; commented out, because it is better to fail
		 * here as to encode some hundreds of input files not supported by LAME
		 * If you know you have RAW PCM data, use the -r switch
		 */

		if (type == WAV_ID_RIFF) {
			/* It's probably a WAV file */
			int ret = parse_wave_header(gfp, sf);
			if (ret > 0) {
				count_samples_carefully = true;
				return sound_file_format.sf_wave;
			}
			if (ret < 0) {
				if (parse.silent < 10) {
					System.err
							.println("Warning: corrupt or unsupported WAVE format");
				}
			}
		} else if (type == IFF_ID_FORM) {
			/* It's probably an AIFF file */
			int ret = parse_aiff_header(gfp, sf);
			if (ret > 0) {
				count_samples_carefully = true;
				return sound_file_format.sf_aiff;
			}
			if (ret < 0) {
				if (parse.silent < 10) {
					System.err
							.printf("Warning: corrupt or unsupported AIFF format\n");
				}
			}
		} else {
			if (parse.silent < 10) {
				System.err.println("Warning: unsupported audio format\n");
			}
		}
		return sound_file_format.sf_unknown;
	}

	private void closeSndFile(final sound_file_format input,
			final RandomAccessFile musicin) {
		if (musicin != null) {
			try {
				musicin.close();
			} catch (IOException e) {
				throw new RuntimeException("Could not close sound file", e);
			}
		}
	}

	private RandomAccessFile OpenSndFile(final LameGlobalFlags gfp,
			final String inPath, final Enc enc) {

		/* set the defaults from info in case we cannot determine them from file */
		gfp.num_samples = -1;

		try {
			musicin = new RandomAccessFile(inPath, "r");
		} catch (FileNotFoundException e) {
			throw new RuntimeException(String.format("Could not find \"%s\".", inPath), e);
		}

		if (is_mpeg_file_format(parse.input_format)) {
			if (-1 == lame_decode_initfile(musicin, parse.mp3input_data, enc)) {
				throw new RuntimeException(String.format("Error reading headers in mp3 input file %s.", inPath));
			}
			gfp.num_channels = parse.mp3input_data.stereo;
			gfp.in_samplerate = parse.mp3input_data.samplerate;
			gfp.num_samples = parse.mp3input_data.nsamp;
		} else if (parse.input_format == sound_file_format.sf_ogg) {
			throw new RuntimeException("sorry, vorbis support in LAME is deprecated.");
		} else if (parse.input_format == sound_file_format.sf_raw) {
			/* assume raw PCM */
			if (parse.silent < 10) {
				System.out.println("Assuming raw pcm input file");
				if (parse.swapbytes)
					System.out.printf(" : Forcing byte-swapping\n");
				else
					System.out.printf("\n");
			}
			pcmswapbytes = parse.swapbytes;
		} else {
			parse.input_format = parse_file_header(gfp, musicin);
		}
		if (parse.input_format == sound_file_format.sf_unknown) {
			throw new RuntimeException("Unknown sound format!");
		}

		if (gfp.num_samples == -1) {

			double flen = new File(inPath).length();
			/* try to figure out num_samples */
			if (flen >= 0) {
				/* try file size, assume 2 bytes per sample */
				if (is_mpeg_file_format(parse.input_format)) {
					if (parse.mp3input_data.bitrate > 0) {
						double totalseconds = (flen * 8.0 / (1000.0 * parse.mp3input_data.bitrate));
						int tmp_num_samples = (int) (totalseconds * gfp.in_samplerate);

						gfp.num_samples = tmp_num_samples;
						parse.mp3input_data.nsamp = tmp_num_samples;
					}
				} else {
					gfp.num_samples = (int) (flen / (2 * gfp.num_channels));
				}
			}
		}
		return musicin;
	}

	private static final Charset ISO_8859_1 = Charset.forName("ISO-8859-1");

	private boolean check_aid(final byte[] header) {
		return new String(header, ISO_8859_1).startsWith("AiD\1");
	}

	private static final char abl2[] = { 0, 7, 7, 7, 0, 7, 0, 0, 0, 0, 0, 8, 8,
			8, 8, 8 };

	/**
	 * Please check this and don't kill me if there's a bug This is a (nearly?)
	 * complete header analysis for a MPEG-1/2/2.5 Layer I, II or III data
	 * stream
	 */
	private boolean is_syncword_mp123(final byte[] headerptr) {
		int p = 0;

		if ((headerptr[p + 0] & 0xFF) != 0xFF) {
			/* first 8 bits must be '1' */
			return false;
		}
		if ((headerptr[p + 1] & 0xE0) != 0xE0) {
			/* next 3 bits are also */
			return false;
		}
		if ((headerptr[p + 1] & 0x18) == 0x08) {
			/* no MPEG-1, -2 or -2.5 */
			return false;
		}
		switch (headerptr[p + 1] & 0x06) {
		default:
		case 0x00:
			/* illegal Layer */
			return false;

		case 0x02:
			/* Layer3 */
			if (parse.input_format != sound_file_format.sf_mp3
					&& parse.input_format != sound_file_format.sf_mp123) {
				return false;
			}
			parse.input_format = sound_file_format.sf_mp3;
			break;

		case 0x04:
			/* Layer2 */
			if (parse.input_format != sound_file_format.sf_mp2
					&& parse.input_format != sound_file_format.sf_mp123) {
				return false;
			}
			parse.input_format = sound_file_format.sf_mp2;
			break;

		case 0x06:
			/* Layer1 */
			if (parse.input_format != sound_file_format.sf_mp1
					&& parse.input_format != sound_file_format.sf_mp123) {
				return false;
			}
			parse.input_format = sound_file_format.sf_mp1;
			break;
		}
		if ((headerptr[p + 1] & 0x06) == 0x00) {
			/* no Layer I, II and III */
			return false;
		}
		if ((headerptr[p + 2] & 0xF0) == 0xF0) {
			/* bad bitrate */
			return false;
		}
		if ((headerptr[p + 2] & 0x0C) == 0x0C) {
			/* no sample frequency with (32,44.1,48)/(1,2,4) */
			return false;
		}
		if ((headerptr[p + 1] & 0x18) == 0x18
				&& (headerptr[p + 1] & 0x06) == 0x04
				&& (abl2[(headerptr[p + 2] & 0xff) >> 4] & (1 << ((headerptr[p + 3] & 0xff) >> 6))) != 0)
			return false;
		if ((headerptr[p + 3] & 3) == 2) {
			/* reserved enphasis mode */
			return false;
		}
		return true;
	}

	private int lame_decode_initfile(final RandomAccessFile fd,
			final MP3Data mp3data, final Enc enc) {
		byte buf[] = new byte[100];
		short pcm_l[] = new short[1152], pcm_r[] = new short[1152];
		boolean freeformat = false;

		if (hip != null) {
			mpg.hip_decode_exit(hip);
		}
		hip = mpg.hip_decode_init();

		int len = 4;
		try {
			fd.readFully(buf, 0, len);
		} catch (IOException e) {
			e.printStackTrace();
			return -1; /* failed */
		}
		if (buf[0] == 'I' && buf[1] == 'D' && buf[2] == '3') {
			if (parse.silent < 10) {
				System.out
						.println("ID3v2 found. "
								+ "Be aware that the ID3 tag is currently lost when transcoding.");
			}
			len = 6;
			try {
				fd.readFully(buf, 0, len);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
			buf[2] &= 127;
			buf[3] &= 127;
			buf[4] &= 127;
			buf[5] &= 127;
			len = (((((buf[2] << 7) + buf[3]) << 7) + buf[4]) << 7) + buf[5];
			try {
				fd.skipBytes(len);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
			len = 4;
			try {
				fd.readFully(buf, 0, len);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
		}
		if (check_aid(buf)) {
			try {
				fd.readFully(buf, 0, 2);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
			int aid_header = (buf[0] & 0xff) + 256 * (buf[1] & 0xff);
			if (parse.silent < 10) {
				System.out.printf("Album ID found.  length=%d \n", aid_header);
			}
			/* skip rest of AID, except for 6 bytes we have already read */
			try {
				fd.skipBytes(aid_header - 6);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}

			/* read 4 more bytes to set up buffer for MP3 header check */
			try {
				fd.readFully(buf, 0, len);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
		}
		len = 4;
		while (!is_syncword_mp123(buf)) {
			int i;
			for (i = 0; i < len - 1; i++)
				buf[i] = buf[i + 1];
			try {
				fd.readFully(buf, len - 1, 1);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
		}

		if ((buf[2] & 0xf0) == 0) {
			if (parse.silent < 10) {
				System.out.println("Input file is freeformat.");
			}
			freeformat = true;
		}
		/* now parse the current buffer looking for MP3 headers. */
		/* (as of 11/00: mpglib modified so that for the first frame where */
		/* headers are parsed, no data will be decoded. */
		/* However, for freeformat, we need to decode an entire frame, */
		/* so mp3data->bitrate will be 0 until we have decoded the first */
		/* frame. Cannot decode first frame here because we are not */
		/* yet prepared to handle the output. */
		int ret = mpg.hip_decode1_headersB(hip, buf, len, pcm_l, pcm_r,
				mp3data, enc);
		if (-1 == ret)
			return -1;

		/* repeat until we decode a valid mp3 header. */
		while (!mp3data.header_parsed) {
			try {
				fd.readFully(buf);
			} catch (IOException e) {
				e.printStackTrace();
				return -1; /* failed */
			}
			ret = mpg.hip_decode1_headersB(hip, buf, buf.length, pcm_l, pcm_r,
					mp3data, enc);
			if (-1 == ret)
				return -1;
		}

		if (mp3data.bitrate == 0 && !freeformat) {
			if (parse.silent < 10) {
				System.err.println("fail to sync...");
			}
			return lame_decode_initfile(fd, mp3data, enc);
		}

		if (mp3data.totalframes > 0) {
			/* mpglib found a Xing VBR header and computed nsamp & totalframes */
		} else {
			/*
			 * set as unknown. Later, we will take a guess based on file size
			 * ant bitrate
			 */
			mp3data.nsamp = -1;
		}

		return 0;
	}

	/**
	 * @return -1 error n number of samples output. either 576 or 1152 depending
	 *         on MP3 file.
	 */
	private int lame_decode_fromfile(final RandomAccessFile fd,
			final short pcm_l[], final short pcm_r[], final MP3Data mp3data) {
		int ret = 0;
		int len = 0;
		byte buf[] = new byte[1024];

		/* first see if we still have data buffered in the decoder: */
		ret = -1;
		ret = mpg.hip_decode1_headers(hip, buf, len, pcm_l, pcm_r, mp3data);
		if (ret != 0)
			return ret;

		/* read until we get a valid output frame */
		while (true) {
			try {
				len = fd.read(buf, 0, 1024);
			} catch (IOException e) {
				e.printStackTrace();
				return -1;
			}
			if (len <= 0) {
				/* we are done reading the file, but check for buffered data */
				ret = mpg.hip_decode1_headers(hip, buf, 0, pcm_l, pcm_r,
						mp3data);
				if (ret <= 0) {
					mpg.hip_decode_exit(hip);
					/* release mp3decoder memory */
					hip = null;
					return -1; /* done with file */
				}
				break;
			}

			ret = mpg.hip_decode1_headers(hip, buf, len, pcm_l, pcm_r, mp3data);
			if (ret == -1) {
				mpg.hip_decode_exit(hip);
				/* release mp3decoder memory */
				hip = null;
				return -1;
			}
			if (ret > 0)
				break;
		}
		return ret;
	}

	private boolean is_mpeg_file_format(
			final sound_file_format input_file_format) {
		switch (input_file_format) {
		case sf_mp1:
		case sf_mp2:
		case sf_mp3:
		case sf_mp123:
			return true;
		default:
			break;
		}
		return false;
	}

	// Rest of portableio.c:

	private int Read32BitsLowHigh(final RandomAccessFile fp) {
		int first = 0xffff & Read16BitsLowHigh(fp);
		int second = 0xffff & Read16BitsLowHigh(fp);

		int result = (second << 16) + first;
		return (result);
	}

	private int Read16BitsLowHigh(final RandomAccessFile fp) {
		try {
			int first = 0xff & fp.read();
			int second = 0xff & fp.read();

			int result = (second << 8) + first;
			return (result);
		} catch (IOException e) {
			e.printStackTrace();
			return 0;
		}
	}

	private int Read16BitsHighLow(final RandomAccessFile fp) {
		try {
			int high = fp.readUnsignedByte();
			int low = fp.readUnsignedByte();

			return (high << 8) | low;
		} catch (IOException e) {
			e.printStackTrace();
			return 0;
		}
	}

	private int Read32BitsHighLow(final RandomAccessFile fp) {
		int first = 0xffff & Read16BitsHighLow(fp);
		int second = 0xffff & Read16BitsHighLow(fp);

		int result = (first << 16) + second;
		return (result);
	}

	private double unsignedToFloat(final double u) {
		return ((double) ((long) (u - 2147483647L - 1))) + 2147483648.0;
	}

	private double ldexp(final double x, final double exp) {
		return x * Math.pow(2, exp);
	}

	/**
	 * Extended precision IEEE floating-point conversion routines
	 */
	private double convertFromIeeeExtended(final byte[] bytes) {
		double f;
		long expon = ((bytes[0] & 0x7F) << 8) | (bytes[1] & 0xFF);
		long hiMant = ((long) (bytes[2] & 0xFF) << 24)
				| ((long) (bytes[3] & 0xFF) << 16)
				| ((long) (bytes[4] & 0xFF) << 8) | ((long) (bytes[5] & 0xFF));
		long loMant = ((long) (bytes[6] & 0xFF) << 24)
				| ((long) (bytes[7] & 0xFF) << 16)
				| ((long) (bytes[8] & 0xFF) << 8) | ((long) (bytes[9] & 0xFF));

		/*
		 * This case should also be called if the number is below the smallest
		 * positive double variable
		 */
		if (expon == 0 && hiMant == 0 && loMant == 0) {
			f = 0;
		} else {
			/*
			 * This case should also be called if the number is too large to fit
			 * into a double variable
			 */

			if (expon == 0x7FFF) { /* Infinity or NaN */
				f = Double.POSITIVE_INFINITY;
			} else {
				expon -= 16383;

				f = ldexp(unsignedToFloat(hiMant), (int) (expon -= 31));
				f += ldexp(unsignedToFloat(loMant), (int) (expon -= 32));
			}
		}

		if ((bytes[0] & 0x80) != 0)
			return -f;
		else
			return f;
	}

	private double readIeeeExtendedHighLow(final RandomAccessFile fp)
			throws IOException {
		byte bytes[] = new byte[10];

		fp.readFully(bytes);
		return convertFromIeeeExtended(bytes);
	}

	private void write32BitsLowHigh(final DataOutput fp, final int i)
			throws IOException {
		write16BitsLowHigh(fp, (int) (i & 0xffffL));
		write16BitsLowHigh(fp, (int) ((i >> 16) & 0xffffL));
	}

	public final void write16BitsLowHigh(final DataOutput fp, final int i)
			throws IOException {
		fp.write(i & 0xff);
		fp.write((i >> 8) & 0xff);
	}
}
