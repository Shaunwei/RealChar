/*
 *      Command line frontend program
 *
 *      Copyright (c) 1999 Mark Taylor
 *                    2000 Takehiro TOMINAGA
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

/* $Id: Main.java,v 1.38 2011/08/27 18:57:12 kenchis Exp $ */

package mp3;

import java.beans.PropertyChangeSupport;
import java.io.Closeable;
import java.io.DataOutput;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.ArrayList;
import java.util.Locale;
import java.util.StringTokenizer;

import mp3.GetAudio.sound_file_format;
import mpg.Common;
import mpg.Interface;
import mpg.MPGLib;

public class Main {

	private GetAudio gaud;
	private ID3Tag id3;
	private Lame lame;
	private GainAnalysis ga;
	private BitStream bs;
	private Presets p;
	private QuantizePVT qupvt;
	private Quantize qu;
	private VBRTag vbr;
	private Version ver;
	private Reservoir rv;
	private Takehiro tak;
	private Parse parse;
	private BRHist hist;

	private MPGLib mpg;
	private Interface intf;
	private Common common;

	private PropertyChangeSupport support = new PropertyChangeSupport(this);
	
	public PropertyChangeSupport getSupport() {
		return support;
	}
	
	/**
	 * PURPOSE: MPEG-1,2 Layer III encoder with GPSYCHO psychoacoustic model.
	 */
	private int parse_args_from_string(final LameGlobalFlags gfp,
			final String argv, final StringBuilder inPath,
			final StringBuilder outPath) {
		/* Quick & very Dirty */
		if (argv == null || argv.length() == 0)
			return 0;

		StringTokenizer tok = new StringTokenizer(argv, " ");
		ArrayList<String> args = new ArrayList<String>();
		while (tok.hasMoreTokens()) {
			args.add(tok.nextToken());
		}
		return parse.parse_args(gfp, args, inPath, outPath, null, null);
	}

	public DataOutput init_files(final LameGlobalFlags gf,
			final String inPath, final String outPath, final Enc enc) {
		/*
		 * Mostly it is not useful to use the same input and output name. This
		 * test is very easy and buggy and don't recognize different names
		 * assigning the same file
		 */
		if (inPath.equals(outPath)) {
			System.err
					.println("Input file and Output file are the same. Abort.");
			return null;
		}

		/*
		 * open the wav/aiff/raw pcm or mp3 input file. This call will open the
		 * file, try to parse the headers and set gf.samplerate,
		 * gf.num_channels, gf.num_samples. if you want to do your own file
		 * input, skip this call and set samplerate, num_channels and
		 * num_samples yourself.
		 */
		gaud.init_infile(gf, inPath, enc);

		DataOutput outf;
		if ((outf = gaud.init_outfile(outPath)) == null) {
			System.err.printf("Can't init outfile '%s'\n", outPath);
			return null;
		}

		return outf;
	}
	
	/**
	 * the simple lame decoder
	 * 
	 * After calling lame_init(), lame_init_params() and init_infile(), call
	 * this routine to read the input MP3 file and output .wav data to the
	 * specified file pointer
	 * 
	 * lame_decoder will ignore the first 528 samples, since these samples
	 * represent the mpglib delay (and are all 0). skip = number of additional
	 * samples to skip, to (for example) compensate for the encoder delay
	 */
	private void lame_decoder(final LameGlobalFlags gfp,
			DataOutput outf, int skip_start, final String inPath,
			final String outPath, final Enc enc) throws IOException {
		short Buffer[][] = new short[2][1152];
		int iread;
		int skip_end = 0;
		int i;
		int tmp_num_channels = gfp.num_channels;

		if (parse.silent < 10)
			System.out.printf("\rinput:  %s%s(%g kHz, %d channel%s, ", inPath,
					inPath.length() > 26 ? "\n\t" : "  ",
					gfp.in_samplerate / 1.e3, tmp_num_channels,
					tmp_num_channels != 1 ? "s" : "");

		switch (parse.input_format) {
		case sf_mp123: /* FIXME: !!! */
			throw new RuntimeException("Internal error.  Aborting.");

		case sf_mp3:
			if (skip_start == 0) {
				if (enc.enc_delay > -1 || enc.enc_padding > -1) {
					if (enc.enc_delay > -1)
						skip_start = enc.enc_delay + 528 + 1;
					if (enc.enc_padding > -1)
						skip_end = enc.enc_padding - (528 + 1);
				} else
					skip_start = gfp.encoder_delay + 528 + 1;
			} else {
				/* user specified a value of skip. just add for decoder */
				skip_start += 528 + 1;
				/*
				 * mp3 decoder has a 528 sample delay, plus user supplied "skip"
				 */
			}

			if (parse.silent < 10)
				System.out.printf("MPEG-%d%s Layer %s", 2 - gfp.version,
						gfp.out_samplerate < 16000 ? ".5" : "", "III");
			break;
		case sf_mp2:
			skip_start += 240 + 1;
			if (parse.silent < 10)
				System.out.printf("MPEG-%d%s Layer %s", 2 - gfp.version,
						gfp.out_samplerate < 16000 ? ".5" : "", "II");
			break;
		case sf_mp1:
			skip_start += 240 + 1;
			if (parse.silent < 10)
				System.out.printf("MPEG-%d%s Layer %s", 2 - gfp.version,
						gfp.out_samplerate < 16000 ? ".5" : "", "I");
			break;
		case sf_raw:
			if (parse.silent < 10)
				System.out.printf("raw PCM data");
			parse.mp3input_data.nsamp = gfp.num_samples;
			parse.mp3input_data.framesize = 1152;
			skip_start = 0;
			/* other formats have no delay */
			break;
		case sf_wave:
			if (parse.silent < 10)
				System.out.printf("Microsoft WAVE");
			parse.mp3input_data.nsamp = gfp.num_samples;
			parse.mp3input_data.framesize = 1152;
			skip_start = 0;
			/* other formats have no delay */
			break;
		case sf_aiff:
			if (parse.silent < 10)
				System.out.printf("SGI/Apple AIFF");
			parse.mp3input_data.nsamp = gfp.num_samples;
			parse.mp3input_data.framesize = 1152;
			skip_start = 0;
			/* other formats have no delay */
			break;
		default:
			if (parse.silent < 10)
				System.out.printf("unknown");
			parse.mp3input_data.nsamp = gfp.num_samples;
			parse.mp3input_data.framesize = 1152;
			skip_start = 0;
			/* other formats have no delay */
			assert (false);
			break;
		}

		if (parse.silent < 10) {
			System.out.printf(")\noutput: %s%s(16 bit, Microsoft WAVE)\n",
					outPath, outPath.length() > 45 ? "\n\t" : "  ");

			if (skip_start > 0)
				System.out
						.printf("skipping initial %d samples (encoder+decoder delay)\n",
								skip_start);
			if (skip_end > 0)
				System.out
						.printf("skipping final %d samples (encoder padding-decoder delay)\n",
								skip_end);
		}

		System.out.print("|");
		for (int j = 0; j < MAX_WIDTH - 2; j++) {
			System.out.print("=");
		}
		System.out.println("|");
		oldPercent = curPercent = oldConsoleX = 0;

		if (!parse.disable_wav_header)
			gaud.WriteWaveHeader(outf, Integer.MAX_VALUE, gfp.in_samplerate,
					tmp_num_channels, 16);
		/* unknown size, so write maximum 32 bit signed value */

		double wavsize = -(skip_start + skip_end);
		parse.mp3input_data.totalframes = parse.mp3input_data.nsamp
				/ parse.mp3input_data.framesize;

		assert (tmp_num_channels >= 1 && tmp_num_channels <= 2);

		do {
			iread = gaud.get_audio16(gfp, Buffer);
			/* read in 'iread' samples */
			if (iread >= 0) {
				parse.mp3input_data.framenum += iread
						/ parse.mp3input_data.framesize;
				wavsize += iread;

				if (parse.silent <= 0) {
					timestatus(parse.mp3input_data.framenum,
							parse.mp3input_data.totalframes);
				}

				skip_start -= (i = skip_start < iread ? skip_start : iread);
				/*
				 * 'i' samples are to skip in this frame
				 */

				if (skip_end > 1152
						&& parse.mp3input_data.framenum + 2 > parse.mp3input_data.totalframes) {
					iread -= (skip_end - 1152);
					skip_end = 1152;
				} else if (parse.mp3input_data.framenum == parse.mp3input_data.totalframes
						&& iread != 0)
					iread -= skip_end;

				for (; i < iread; i++) {
					if (parse.disable_wav_header) {
						if (parse.swapbytes) {
							WriteBytesSwapped(outf, Buffer[0], i);
						} else {
							WriteBytes(outf, Buffer[0], i);
						}
						if (tmp_num_channels == 2) {
							if (parse.swapbytes) {
								WriteBytesSwapped(outf, Buffer[1], i);
							} else {
								WriteBytes(outf, Buffer[1], i);
							}
						}
					} else {
						gaud.write16BitsLowHigh(outf, Buffer[0][i] & 0xffff);
						if (tmp_num_channels == 2)
							gaud.write16BitsLowHigh(outf, Buffer[1][i] & 0xffff);
					}
				}
			}
		} while (iread > 0);

		i = (16 / 8) * tmp_num_channels;
		assert (i > 0);
		if (wavsize <= 0) {
			if (parse.silent < 10)
				System.err.println("WAVE file contains 0 PCM samples");
			wavsize = 0;
		} else if (wavsize > 0xFFFFFFD0L / i) {
			if (parse.silent < 10)
				System.err
						.println("Very huge WAVE file, can't set filesize accordingly");
			wavsize = 0xFFFFFFD0;
		} else {
			wavsize *= i;
		}

		((Closeable)outf).close();
		/* if outf is seekable, rewind and adjust length */
		if (!parse.disable_wav_header) {
			RandomAccessFile rf = new RandomAccessFile(outPath, "rw");
			gaud.WriteWaveHeader(rf, (int) wavsize, gfp.in_samplerate,
					tmp_num_channels, 16);
			rf.close();
		}

		System.out.print("|");
		for (int j = 0; j < MAX_WIDTH - 2; j++) {
			System.out.print("=");
		}
		System.out.println("|");
	}

	private void print_lame_tag_leading_info(final LameGlobalFlags gf) {
		if (gf.bWriteVbrTag)
			System.out.println("Writing LAME Tag...");
	}
    
	private void print_trailing_info(final LameGlobalFlags gf) {
		if (gf.bWriteVbrTag)
			System.out.println("done\n");

		if (gf.findReplayGain) {
			int RadioGain = gf.internal_flags.RadioGain;
			System.out.printf("ReplayGain: %s%.1fdB\n", RadioGain > 0 ? "+"
					: "", (RadioGain) / 10.0f);
			if (RadioGain > 0x1FE || RadioGain < -0x1FE)
				System.out
						.println("WARNING: ReplayGain exceeds the -51dB to +51dB range. Such a result is too\n"
								+ "         high to be stored in the header.");
		}

		/*
		 * if (the user requested printing info about clipping) and (decoding on
		 * the fly has actually been performed)
		 */
		if (parse.print_clipping_info && gf.decode_on_the_fly) {
			float noclipGainChange = (float) gf.internal_flags.noclipGainChange / 10.0f;
			float noclipScale = gf.internal_flags.noclipScale;

			if (noclipGainChange > 0.0) {
				/* clipping occurs */
				System.out
						.printf("WARNING: clipping occurs at the current gain. Set your decoder to decrease\n"
								+ "         the  gain  by  at least %.1fdB or encode again ",
								noclipGainChange);

				/* advice the user on the scale factor */
				if (noclipScale > 0) {
					System.out.printf(Locale.US, "using  --scale %.2f\n", noclipScale);
					System.out
							.print("         or less (the value under --scale is approximate).\n");
				} else {
					/*
					 * the user specified his own scale factor. We could suggest
					 * the scale factor of
					 * (32767.0/gfp->PeakSample)*(gfp->scale) but it's usually
					 * very inaccurate. So we'd rather advice him to disable
					 * scaling first and see our suggestion on the scale factor
					 * then.
					 */
					System.out
							.print("using --scale <arg>\n"
									+ "         (For   a   suggestion  on  the  optimal  value  of  <arg>  encode\n"
									+ "         with  --scale 1  first)\n");
				}

			} else { /* no clipping */
				if (noclipGainChange > -0.1)
					System.out
							.print("\nThe waveform does not clip and is less than 0.1dB away from full scale.\n");
				else
					System.out
							.printf("\nThe waveform does not clip and is at least %.1fdB away from full scale.\n",
									-noclipGainChange);
			}
		}

	}

	private int write_xing_frame(final LameGlobalFlags gf,
			final RandomAccessFile outf) {
		byte mp3buffer[] = new byte[Lame.LAME_MAXMP3BUFFER];

		int imp3 = vbr.getLameTagFrame(gf, mp3buffer);
		if (imp3 > mp3buffer.length) {
			System.err
					.printf("Error writing LAME-tag frame: buffer too small: buffer size=%d  frame size=%d\n",
							mp3buffer.length, imp3);
			return -1;
		}
		if (imp3 <= 0) {
			return 0;
		}
		try {
			outf.write(mp3buffer, 0, imp3);
		} catch (IOException e) {
			System.err.println("Error writing LAME-tag");
			return -1;
		}
		return imp3;
	}

	private int lame_encoder(final LameGlobalFlags gf,
			final DataOutput outf, final boolean nogap,
			final String inPath, final String outPath) {
		byte mp3buffer[] = new byte[Lame.LAME_MAXMP3BUFFER];
		int Buffer[][] = new int[2][1152];
		int iread;

		encoder_progress_begin(gf, inPath, outPath);

		int imp3 = id3.lame_get_id3v2_tag(gf, mp3buffer, mp3buffer.length);
		if (imp3 > mp3buffer.length) {
			encoder_progress_end(gf);
			System.err
					.printf("Error writing ID3v2 tag: buffer too small: buffer size=%d  ID3v2 size=%d\n",
							mp3buffer.length, imp3);
			return 1;
		}
		try {
			outf.write(mp3buffer, 0, imp3);
		} catch (IOException e) {
			encoder_progress_end(gf);
			System.err.printf("Error writing ID3v2 tag \n");
			return 1;
		}
		int id3v2_size = imp3;

		/* encode until we hit eof */
		do {
			/* read in 'iread' samples */
			iread = gaud.get_audio(gf, Buffer);

			if (iread >= 0) {
				encoder_progress(gf);

				/* encode */
				imp3 = lame.lame_encode_buffer_int(gf, Buffer[0], Buffer[1],
						iread, mp3buffer, 0, mp3buffer.length);

				/* was our output buffer big enough? */
				if (imp3 < 0) {
					if (imp3 == -1)
						System.err.printf("mp3 buffer is not big enough... \n");
					else
						System.err.printf(
								"mp3 internal error:  error code=%d\n", imp3);
					return 1;
				}

				try {
					outf.write(mp3buffer, 0, imp3);
				} catch (IOException e) {
					encoder_progress_end(gf);
					System.err.printf("Error writing mp3 output \n");
					return 1;
				}
			}
		} while (iread > 0);

		if (nogap)
			imp3 = lame
					.lame_encode_flush_nogap(gf, mp3buffer, mp3buffer.length);
		/*
		 * may return one more mp3 frame
		 */
		else
			imp3 = lame.lame_encode_flush(gf, mp3buffer, 0, mp3buffer.length);
		/*
		 * may return one more mp3 frame
		 */

		if (imp3 < 0) {
			if (imp3 == -1)
				System.err.printf("mp3 buffer is not big enough... \n");
			else
				System.err.printf("mp3 internal error:  error code=%d\n", imp3);
			return 1;

		}

		encoder_progress_end(gf);

		try {
			outf.write(mp3buffer, 0, imp3);
		} catch (IOException e) {
			encoder_progress_end(gf);
			System.err.printf("Error writing mp3 output \n");
			return 1;
		}

		imp3 = id3.lame_get_id3v1_tag(gf, mp3buffer, mp3buffer.length);
		if (imp3 > mp3buffer.length) {
			System.err
					.printf("Error writing ID3v1 tag: buffer too small: buffer size=%d  ID3v1 size=%d\n",
							mp3buffer.length, imp3);
		} else {
			if (imp3 > 0) {
				try {
					outf.write(mp3buffer, 0, imp3);
				} catch (IOException e) {
					encoder_progress_end(gf);
					System.err.printf("Error writing ID3v1 tag \n");
					return 1;
				}
			}
		}

		if (parse.silent <= 0) {
			print_lame_tag_leading_info(gf);
		}
		try {
			((Closeable)outf).close();
			RandomAccessFile rf = new RandomAccessFile(outPath, "rw");
			rf.seek(id3v2_size);
			write_xing_frame(gf, rf);
			rf.close();
		} catch (IOException e) {
			System.err.printf("fatal error: can't update LAME-tag frame!\n");
		}

		print_trailing_info(gf);
		return 0;
	}

	private void brhist_init_package(final LameGlobalFlags gf) {
		if (parse.brhist) {
			if (hist.brhist_init(gf, gf.VBR_min_bitrate_kbps,
					gf.VBR_max_bitrate_kbps) != 0) {
				/* fail to initialize */
				parse.brhist = false;
			}
		} else {
			hist.brhist_init(gf, 128, 128);
			/* Dirty hack */
		}
	}

	private void parse_nogap_filenames(final int nogapout, final String inPath,
			final StringBuilder outPath, final StringBuilder outdir) {
		outPath.setLength(0);
		outPath.append(outdir);
		if (0 == nogapout) {
			outPath.setLength(0);
			outPath.append(inPath);
			/* nuke old extension, if one */
			if (outPath.toString().endsWith(".wav")) {
				outPath.setLength(0);
				outPath.append(outPath.substring(0, outPath.length() - 4)
						+ ".mp3");
			} else {
				outPath.setLength(0);
				outPath.append(outPath + ".mp3");
			}
		} else {
			int slasher = inPath.lastIndexOf(System
					.getProperty("file.separator"));

			/* backseek to last dir delemiter */

			/* skip one foward if needed */
			if (slasher != 0
					&& (outPath.toString().endsWith(
							System.getProperty("file.separator")) || outPath
							.toString().endsWith(":")))
				slasher++;
			else if (slasher == 0
					&& (!outPath.toString().endsWith(
							System.getProperty("file.separator")) || outPath
							.toString().endsWith(":")))
				outPath.append(System.getProperty("file.separator"));

			outPath.append(inPath.substring(slasher));
			/* nuke old extension */
			if (outPath.toString().endsWith(".wav")) {
				String string = outPath.substring(0, outPath.length() - 4)
						+ ".mp3";
				outPath.setLength(0);
				outPath.append(string);
			} else {
				String string = outPath + ".mp3";
				outPath.setLength(0);
				outPath.append(string);
			}
		}
	}

	private static final int MAX_NOGAP = 200;

	public static final void main(final String[] args) {
		try {
			new Main().run(args);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public int run(String[] args) throws IOException {
		// encoder modules
		lame = new Lame();
		gaud = new GetAudio();
		ga = new GainAnalysis();
		bs = new BitStream();
		p = new Presets();
		qupvt = new QuantizePVT();
		qu = new Quantize();
		vbr = new VBRTag();
		ver = new Version();
		id3 = new ID3Tag();
		rv = new Reservoir();
		tak = new Takehiro();
		parse = new Parse();
		hist = new BRHist();

		mpg = new MPGLib();
		intf = new Interface();
		common = new Common();

		lame.setModules(ga, bs, p, qupvt, qu, vbr, ver, id3, mpg);
		bs.setModules(ga, mpg, ver, vbr);
		id3.setModules(bs, ver);
		p.setModules(lame);
		qu.setModules(bs, rv, qupvt, tak);
		qupvt.setModules(tak, rv, lame.enc.psy);
		rv.setModules(bs);
		tak.setModules(qupvt);
		vbr.setModules(lame, bs, ver);
		gaud.setModules(parse, mpg);
		parse.setModules(ver, id3, p);

		// decoder modules
		mpg.setModules(intf, common);
		intf.setModules(vbr, common);

		StringBuilder outPath = new StringBuilder();
		StringBuilder nogapdir = new StringBuilder();
		StringBuilder inPath = new StringBuilder();

		/* add variables for encoder delay/padding */
		Enc enc = new Enc();

		/* support for "nogap" encoding of up to 200 .wav files */
		int nogapout = 0;
		int max_nogap = MAX_NOGAP;
		String[] nogap_inPath = new String[max_nogap];
		DataOutput outf;

		/* initialize libmp3lame */
		parse.input_format = sound_file_format.sf_unknown;
		LameGlobalFlags gf = lame.lame_init();
		if (args.length < 1) {
			parse.usage(System.err, "lame");
			/*
			 * no command-line args, print usage, exit
			 */
			lame.lame_close(gf);
			return 1;
		}

		/*
		 * parse the command line arguments, setting various flags in the struct
		 * 'gf'. If you want to parse your own arguments, or call libmp3lame
		 * from a program which uses a GUI to set arguments, skip this call and
		 * set the values of interest in the gf struct. (see the file API and
		 * lame.h for documentation about these parameters)
		 */
		parse_args_from_string(gf, System.getenv("LAMEOPT"), inPath, outPath);
		ArrayList<String> argsList = new ArrayList<String>();
		for (int i = 0; i < args.length; i++) {
			argsList.add(args[i]);
		}
		Parse.NoGap ng = new Parse.NoGap();
		int ret = parse.parse_args(gf, argsList, inPath, outPath, nogap_inPath, ng);
		max_nogap = ng.num_nogap;
		if (ret < 0) {
			lame.lame_close(gf);
			return ret == -2 ? 0 : 1;
		}

		if (parse.update_interval < 0.)
			parse.update_interval = 2.f;

		if (outPath.length() != 0 && max_nogap > 0) {
			nogapdir = outPath;
			nogapout = 1;
		}

		/*
		 * initialize input file. This also sets samplerate and as much other
		 * data on the input file as available in the headers
		 */
		if (max_nogap > 0) {
			/*
			 * for nogap encoding of multiple input files, it is not possible to
			 * specify the output file name, only an optional output directory.
			 */
			parse_nogap_filenames(nogapout, nogap_inPath[0], outPath, nogapdir);
			outf = init_files(gf, nogap_inPath[0], outPath.toString(), enc);
		} else {
			outf = init_files(gf, inPath.toString(), outPath.toString(), enc);
		}
		if (outf == null) {
			lame.lame_close(gf);
			return -1;
		}
		/*
		 * turn off automatic writing of ID3 tag data into mp3 stream we have to
		 * call it before 'lame_init_params', because that function would spit
		 * out ID3v2 tag data.
		 */
		gf.write_id3tag_automatic = false;

		/*
		 * Now that all the options are set, lame needs to analyze them and set
		 * some more internal options and check for problems
		 */
		int i = lame.lame_init_params(gf);
		if (i < 0) {
			if (i == -1) {
				parse.display_bitrates(System.err);
			}
			System.err.println("fatal error during initialization");
			lame.lame_close(gf);
			return i;
		}
		if (parse.silent > 0) {
			parse.brhist = false; /* turn off VBR histogram */
		}

		if (gf.decode_only) {
			/* decode an mp3 file to a .wav */
			if (parse.mp3_delay_set)
				lame_decoder(gf, outf, parse.mp3_delay, inPath.toString(),
						outPath.toString(), enc);
			else
				lame_decoder(gf, outf, 0, inPath.toString(),
						outPath.toString(), enc);

		} else {
			if (max_nogap > 0) {
				/*
				 * encode multiple input files using nogap option
				 */
				for (i = 0; i < max_nogap; ++i) {
					boolean use_flush_nogap = (i != (max_nogap - 1));
					if (i > 0) {
						parse_nogap_filenames(nogapout, nogap_inPath[i],
								outPath, nogapdir);
						/*
						 * note: if init_files changes anything, like
						 * samplerate, num_channels, etc, we are screwed
						 */
						outf = init_files(gf, nogap_inPath[i],
								outPath.toString(), enc);
						/*
						 * reinitialize bitstream for next encoding. this is
						 * normally done by lame_init_params(), but we cannot
						 * call that routine twice
						 */
						lame.lame_init_bitstream(gf);
					}
					brhist_init_package(gf);
					gf.internal_flags.nogap_total = max_nogap;
					gf.internal_flags.nogap_current = i;

					ret = lame_encoder(gf, outf, use_flush_nogap,
							nogap_inPath[i], outPath.toString());

					((Closeable)outf).close();
					gaud.close_infile(); /* close the input file */

				}
			} else {
				/*
				 * encode a single input file
				 */
				brhist_init_package(gf);

				ret = lame_encoder(gf, outf, false, inPath.toString(),
						outPath.toString());

				((Closeable)outf).close();
				gaud.close_infile(); /* close the input file */
			}
		}
		lame.lame_close(gf);
		return ret;
	}
    
	private void encoder_progress_begin(final LameGlobalFlags gf,
			final String inPath, final String outPath) {
		if (parse.silent < 10) {
			lame.lame_print_config(gf);
			/* print useful information about options being used */

			System.out.printf("Encoding %s%s to %s\n", inPath, inPath.length()
					+ outPath.length() < 66 ? "" : "\n     ", outPath);

			System.out.printf("Encoding as %g kHz ", 1.e-3 * gf.out_samplerate);

			{
				String[][] mode_names = {
						{ "stereo", "j-stereo", "dual-ch", "single-ch" },
						{ "stereo", "force-ms", "dual-ch", "single-ch" } };
				switch (gf.VBR) {
				case vbr_rh:
					System.out.printf(
							"%s MPEG-%d%s Layer III VBR(q=%g) qval=%d\n",
							mode_names[gf.force_ms ? 1 : 0][gf.mode.ordinal()],
							2 - gf.version, gf.out_samplerate < 16000 ? ".5"
									: "", gf.VBR_q + gf.VBR_q_frac, gf.quality);
					break;
				case vbr_mt:
				case vbr_mtrh:
					System.out.printf("%s MPEG-%d%s Layer III VBR(q=%d)\n",
							mode_names[gf.force_ms ? 1 : 0][gf.mode.ordinal()],
							2 - gf.version, gf.out_samplerate < 16000 ? ".5"
									: "", gf.quality);
					break;
				case vbr_abr:
					System.out
							.printf("%s MPEG-%d%s Layer III (%gx) average %d kbps qval=%d\n",
									mode_names[gf.force_ms ? 1 : 0][gf.mode
											.ordinal()],
									2 - gf.version,
									gf.out_samplerate < 16000 ? ".5" : "",
									0.1 * (int) (10. * gf.compression_ratio + 0.5),
									gf.VBR_mean_bitrate_kbps, gf.quality);
					break;
				default:
					System.out.printf(
							"%s MPEG-%d%s Layer III (%gx) %3d kbps qval=%d\n",
							mode_names[gf.force_ms ? 1 : 0][gf.mode.ordinal()],
							2 - gf.version, gf.out_samplerate < 16000 ? ".5"
									: "",
							0.1 * (int) (10. * gf.compression_ratio + 0.5),
							gf.brate, gf.quality);
					break;
				}
			}

			if (parse.silent <= -10) {
				lame.lame_print_internals(gf);
			}
			System.out.print("|");
			for (int i = 0; i < MAX_WIDTH - 2; i++) {
				System.out.print("=");
			}
			System.out.println("|");
			oldPercent = curPercent = oldConsoleX = 0;
		}
	}

    private double last_time = 0.0;

	private void encoder_progress(final LameGlobalFlags gf) {
		if (parse.silent <= 0) {
			int frames = gf.frameNum;
			if (parse.update_interval <= 0) {
				/* most likely --disptime x not used */
				if ((frames % 100) != 0) {
					/* true, most of the time */
					return;
				}
			} else {
				if (frames != 0 && frames != 9) {
					double act = System.currentTimeMillis();
					double dif = act - last_time;
					if (dif >= 0 && dif < parse.update_interval) {
						return;
					}
				}
				last_time = System.currentTimeMillis();
				/* from now! disp_time seconds */
			}
			if (parse.brhist) {
				hist.brhist_jump_back();
			}
			timestatus(gf.frameNum, lame_get_totalframes(gf));
			if (parse.brhist) {
				hist.brhist_disp(gf);
			}
		}
	}

	private void encoder_progress_end(final LameGlobalFlags gf) {
		if (parse.silent <= 0) {
			if (parse.brhist) {
				hist.brhist_jump_back();
			}
			timestatus(gf.frameNum, lame_get_totalframes(gf));
			if (parse.brhist) {
				hist.brhist_disp(gf);
			}
			System.out.print("|");
			for (int i = 0; i < MAX_WIDTH - 2; i++) {
				System.out.print("=");
			}
			System.out.println("|");
		}
	}

	private int oldPercent, curPercent, oldConsoleX;

	private void timestatus(final int frameNum, final int totalframes) {
		int percent;

		if (frameNum < totalframes) {
			percent = (int) (100. * frameNum / totalframes + 0.5);
		} else {
			percent = 100;
		}
		boolean stepped = false;
		if (oldPercent != percent) {
			progressStep();
			stepped = true;
		}
		oldPercent = percent;
		if (percent == 100) {
			for (int i = curPercent; i < 100; i++) {
				progressStep();
				stepped = true;
			}
		}
		if (percent == 100 && stepped) {
			System.out.println();
		}
	}

	private static final int MAX_WIDTH = 79;

	private void progressStep() {
		curPercent++;
		float consoleX = (float) curPercent * MAX_WIDTH / 100f;
		if ((int) consoleX != oldConsoleX)
			System.out.print(".");
		oldConsoleX = (int) consoleX;
		support.firePropertyChange("progress", oldPercent, curPercent);
	}

	/**
	 * LAME's estimate of the total number of frames to be encoded. Only valid
	 * if calling program set num_samples.
	 */
	private int lame_get_totalframes(final LameGlobalFlags gfp) {
		/* estimate based on user set num_samples: */
		int totalframes = (int) (2 + ((double) gfp.num_samples * gfp.out_samplerate)
				/ ((double) gfp.in_samplerate * gfp.framesize));

		return totalframes;
	}

	private void WriteBytesSwapped(final DataOutput fp, final short[] p,
			final int pPos) throws IOException {
		fp.writeShort(p[pPos]);
	}

	private void WriteBytes(final DataOutput fp, final short[] p,
			final int pPos) throws IOException {
		/* No error condition checking */
		fp.write(p[pPos] & 0xff);
		fp.write(((p[pPos] & 0xffff) >> 8) & 0xff);
	}

}
