package lowlevel;

import java.nio.ByteBuffer;

import mp3.BitStream;
import mp3.Enc;
import mp3.GainAnalysis;
import mp3.GetAudio;
import mp3.ID3Tag;
import mp3.Lame;
import mp3.LameGlobalFlags;
import mp3.Parse;
import mp3.Presets;
import mp3.Quantize;
import mp3.QuantizePVT;
import mp3.Reservoir;
import mp3.Takehiro;
import mp3.VBRTag;
import mp3.Version;
import mpg.Common;
import mpg.Interface;
import mpg.MPGLib;

public class LameDecoder {

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

	private MPGLib mpg;
	private Interface intf;
	private Common common;

	private int wavsize;
	private short buffer[][] = new short[2][1152];
	// private DataOutput outf;
	private LameGlobalFlags gfp;

	public LameDecoder(String mp3File) {
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

		gfp = lame.lame_init();

		/*
		 * turn off automatic writing of ID3 tag data into mp3 stream we have to
		 * call it before 'lame_init_params', because that function would spit
		 * out ID3v2 tag data.
		 */
		gfp.write_id3tag_automatic = false;

		/*
		 * Now that all the options are set, lame needs to analyze them and set
		 * some more internal options and check for problems
		 */
		lame.lame_init_params(gfp);

		parse.input_format = GetAudio.sound_file_format.sf_mp3;

		StringBuilder inPath = new StringBuilder(mp3File);
		Enc enc = new Enc();

		gaud.init_infile(gfp, inPath.toString(), enc);

		int skip_start = 0;
		int skip_end = 0;

		if (parse.silent < 10)
			System.out.printf("\rinput:  %s%s(%g kHz, %d channel%s, ", inPath,
					inPath.length() > 26 ? "\n\t" : "  ",
					gfp.in_samplerate / 1.e3, gfp.num_channels,
					gfp.num_channels != 1 ? "s" : "");

		if (enc.enc_delay > -1 || enc.enc_padding > -1) {
			if (enc.enc_delay > -1)
				skip_start = enc.enc_delay + 528 + 1;
			if (enc.enc_padding > -1)
				skip_end = enc.enc_padding - (528 + 1);
		} else
			skip_start = gfp.encoder_delay + 528 + 1;

		System.out.printf("MPEG-%d%s Layer %s", 2 - gfp.version,
				gfp.out_samplerate < 16000 ? ".5" : "", "III");

		System.out.printf(")\noutput: (16 bit, Microsoft WAVE)\n");

		if (skip_start > 0)
			System.out.printf(
					"skipping initial %d samples (encoder+decoder delay)\n",
					skip_start);
		if (skip_end > 0)
			System.out
					.printf("skipping final %d samples (encoder padding-decoder delay)\n",
							skip_end);

		wavsize = -(skip_start + skip_end);
		parse.mp3input_data.totalframes = parse.mp3input_data.nsamp
				/ parse.mp3input_data.framesize;

		assert (gfp.num_channels >= 1 && gfp.num_channels <= 2);
	}

	public void decode(final ByteBuffer sampleBuffer, final boolean playOriginal) {
		int iread = gaud.get_audio16(gfp, buffer);
		if (iread >= 0) {
			parse.mp3input_data.framenum += iread
					/ parse.mp3input_data.framesize;
			wavsize += iread;

			for (int i = 0; i < iread; i++) {
				if (playOriginal) {
					// We put mp3 data into the sample buffer here!
					sampleBuffer.array()[i * 2] = (byte) (buffer[0][i] & 0xff);
					sampleBuffer.array()[i * 2 + 1] = (byte) (((buffer[0][i] & 0xffff) >> 8) & 0xff);
				}

				if (gfp.num_channels == 2) {
					// gaud.write16BitsLowHigh(outf, buffer[1][i] & 0xffff);
					// TODO two channels?
				}
			}
		}

	}

	public void close() {
		lame.lame_close(gfp);
	}
}
