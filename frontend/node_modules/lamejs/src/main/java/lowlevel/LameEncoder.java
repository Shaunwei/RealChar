package lowlevel;

import static javax.sound.sampled.AudioSystem.NOT_SPECIFIED;

import java.nio.ByteOrder;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioFormat.Encoding;

import mp3.BRHist;
import mp3.BitStream;
import mp3.GainAnalysis;
import mp3.GetAudio;
import mp3.ID3Tag;
import mp3.Lame;
import mp3.LameGlobalFlags;
import mp3.MPEGMode;
import mp3.Parse;
import mp3.Presets;
import mp3.Quantize;
import mp3.QuantizePVT;
import mp3.Reservoir;
import mp3.Takehiro;
import mp3.Util;
import mp3.VBRTag;
import mp3.VbrMode;
import mp3.Version;
import mpg.Common;
import mpg.Interface;
import mpg.MPGLib;

/**
 * Wrapper for the jump3r encoder.
 * 
 * @author Ken Handel
 */
public class LameEncoder {

	public static final AudioFormat.Encoding MPEG1L3 = new AudioFormat.Encoding(
			"MPEG1L3");
	// Lame converts automagically to MPEG2 or MPEG2.5, if necessary.
	public static final AudioFormat.Encoding MPEG2L3 = new AudioFormat.Encoding(
			"MPEG2L3");
	public static final AudioFormat.Encoding MPEG2DOT5L3 = new AudioFormat.Encoding(
			"MPEG2DOT5L3");

	// property constants
	/**
	 * property key to read/set the VBR mode: an instance of Boolean (default:
	 * false)
	 */
	public static final String P_VBR = "vbr";
	/**
	 * property key to read/set the channel mode: a String, one of
	 * &quot;jointstereo&quot;, &quot;dual&quot;, &quot;mono&quot;,
	 * &quot;auto&quot; (default).
	 */
	public static final String P_CHMODE = "chmode";
	/**
	 * property key to read/set the bitrate: an Integer value. Set to -1 for
	 * default bitrate.
	 */
	public static final String P_BITRATE = "bitrate";
	/**
	 * property key to read/set the quality: an Integer from 1 (highest) to 9
	 * (lowest).
	 */
	public static final String P_QUALITY = "quality";

	// constants from lame.h
	public static final int MPEG_VERSION_2 = 0; // MPEG-2
	public static final int MPEG_VERSION_1 = 1; // MPEG-1
	public static final int MPEG_VERSION_2DOT5 = 2; // MPEG-2.5

	// low mean bitrate in VBR mode
	public static final int QUALITY_LOWEST = 9;
	public static final int QUALITY_LOW = 7;
	public static final int QUALITY_MIDDLE = 5;
	public static final int QUALITY_HIGH = 2;
	// quality==0 not yet coded in LAME (3.83alpha)
	// high mean bitrate in VBR // mode
	public static final int QUALITY_HIGHEST = 1;

	public static final int CHANNEL_MODE_STEREO = 0;
	public static final int CHANNEL_MODE_JOINT_STEREO = 1;
	public static final int CHANNEL_MODE_DUAL_CHANNEL = 2;
	public static final int CHANNEL_MODE_MONO = 3;

	// channel mode has no influence on mono files.
	public static final int CHANNEL_MODE_AUTO = -1;
	public static final int BITRATE_AUTO = -1;

	// suggested maximum buffer size for an mpeg frame
	private static final int DEFAULT_PCM_BUFFER_SIZE = 2048 * 16;

	// frame size=576 for MPEG2 and MPEG2.5
	// =576*2 for MPEG1

	private static int DEFAULT_QUALITY = QUALITY_MIDDLE;
	private static int DEFAULT_BITRATE = BITRATE_AUTO;
	private static int DEFAULT_CHANNEL_MODE = CHANNEL_MODE_AUTO;
	// in VBR mode, bitrate is ignored.
	private static boolean DEFAULT_VBR = false;

	// encoding source values
	private Encoding sourceEncoding;
	private ByteOrder sourceByteOrder;
	private int sourceChannels;
	private int sourceSampleRate;
	private int sourceSampleSizeInBits;
	private boolean sourceIsBigEndian;
	
	private int quality = DEFAULT_QUALITY;
	private int bitRate = DEFAULT_BITRATE;
	private boolean vbrMode = DEFAULT_VBR;
	private int chMode = DEFAULT_CHANNEL_MODE;

	// these fields are set upon successful initialization to show effective
	// values.
	private int effQuality;
	private int effBitRate;
	private int effVbr;
	private int effChMode;
	private int effSampleRate;
	private int effEncoding;
	private LameGlobalFlags gfp;
	private AudioFormat sourceFormat;
	private AudioFormat targetFormat;
	
	
	
	public LameEncoder() {
		
	}

	/**
	 * Initializes the encoder with the given source/PCM format. The default mp3
	 * encoding parameters are used, see DEFAULT_BITRATE, DEFAULT_CHANNEL_MODE,
	 * DEFAULT_QUALITY, and DEFAULT_VBR.
	 * 
	 * @throws IllegalArgumentException
	 *             when parameters are not supported by LAME.
	 */




	public LameEncoder(AudioFormat sourceFormat) {
		readParams(sourceFormat, null);
		setFormat(sourceFormat, null);
	}

	/**
	 * Initializes the encoder with the given source/PCM format. The mp3
	 * parameters are read from the targetFormat's properties. For any parameter
	 * that is not set, global system properties are queried for backwards
	 * tritonus compatibility. Last, parameters will use the default values
	 * DEFAULT_BITRATE, DEFAULT_CHANNEL_MODE, DEFAULT_QUALITY, and DEFAULT_VBR.
	 * 
	 * @throws IllegalArgumentException
	 *             when parameters are not supported by LAME.
	 */
	public LameEncoder(AudioFormat sourceFormat, AudioFormat targetFormat) {
		readParams(sourceFormat, targetFormat.properties());
		setFormat(sourceFormat, targetFormat);
	}


	/**
	 * Initializes the encoder, overriding any parameters set in the audio
	 * format's properties or in the system properties.
	 * 
	 * @throws IllegalArgumentException
	 *             when parameters are not supported by LAME.
	 */
	public LameEncoder(AudioFormat sourceFormat, int bitRate, int channelMode, int quality, boolean VBR) {
		this.bitRate = bitRate;
		this.chMode = channelMode;
		this.quality = quality;
		this.vbrMode = VBR;
		setFormat(sourceFormat, null);
	}

	private void readParams(AudioFormat sourceFormat, Map<String, Object> props) {
		if (props != null) {
			readProps(props);
		}
	}

	public void setSourceFormat(AudioFormat sourceFormat) {
		setFormat(sourceFormat, null);
	}

	public void setTargetFormat(AudioFormat targetFormat) {
		setFormat(null, targetFormat);
	}
	
	public void setFormat(AudioFormat sourceFormat, AudioFormat targetFormat) {
		this.sourceFormat = sourceFormat;
		if (sourceFormat!=null){			
			sourceEncoding = sourceFormat.getEncoding();
			sourceSampleSizeInBits = sourceFormat.getSampleSizeInBits();
			sourceByteOrder = sourceFormat.isBigEndian() ? ByteOrder.BIG_ENDIAN : ByteOrder.LITTLE_ENDIAN;
			sourceChannels = sourceFormat.getChannels();
			sourceSampleRate = Math.round(sourceFormat.getSampleRate());
			sourceIsBigEndian = sourceFormat.isBigEndian();
			// simple check that bitrate is not too high for MPEG2 and MPEG2.5
			// todo: exception ?
			if (sourceFormat.getSampleRate() < 32000 && bitRate > 160) {
				bitRate = 160;
			}
		}
		//-1 means do not change the sample rate
		int targetSampleRate = -1;
		this.targetFormat = targetFormat;
		if (targetFormat!=null){
			targetSampleRate = Math.round(targetFormat.getSampleRate());
		}
		int result = nInitParams(sourceChannels, 
								 sourceSampleRate,
								 targetSampleRate,
								 bitRate, 
								 chMode,
								 quality, 
								 vbrMode, 
								 sourceIsBigEndian);
		if (result < 0) {
			throw new IllegalArgumentException("parameters not supported by LAME (returned " + result + ")");
		}
	}

	GetAudio gaud;
	ID3Tag id3;
	Lame lame;
	GainAnalysis ga;
	BitStream bs;
	Presets p;
	QuantizePVT qupvt;
	Quantize qu;
	VBRTag vbr;
	Version ver;
	Util util;
	Reservoir rv;
	Takehiro tak;
	Parse parse;
	BRHist hist;

	MPGLib mpg;
	Interface intf;
	Common common;

	/**
	 * Initializes the lame encoder. Throws IllegalArgumentException when
	 * parameters are not supported by LAME.
	 */
	private int nInitParams(int channels, int inSampleRate, int outSampleRate, int bitrate,
			int mode, int quality, boolean VBR, boolean bigEndian) {
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

		gfp = lame.lame_init();
		gfp.num_channels = channels;
		gfp.in_samplerate = inSampleRate;
		if (outSampleRate>=0)
			gfp.out_samplerate = outSampleRate;
		if (mode != CHANNEL_MODE_AUTO) {
			gfp.mode = Enum.valueOf(MPEGMode.class, chmode2string(mode));
		}
		if (VBR) {
			gfp.VBR = VbrMode.vbr_default;
			gfp.VBR_q = quality;
		} else {
			if (bitrate != BITRATE_AUTO) {
				gfp.brate = bitrate;
			}
		}
		gfp.quality = quality;

		id3.id3tag_init(gfp);
		/*
		 * turn off automatic writing of ID3 tag data into mp3 stream we have to
		 * call it before 'lame_init_params', because that function would spit
		 * out ID3v2 tag data.
		 */
		gfp.write_id3tag_automatic = false;
		gfp.findReplayGain = true;

		int rc = lame.lame_init_params(gfp);
		// return effective values
		effSampleRate = gfp.out_samplerate;
		effBitRate = gfp.brate;
		effChMode = gfp.mode.ordinal();
		effVbr = gfp.VBR.ordinal();
		effQuality = (VBR) ? gfp.VBR_q : gfp.quality;
		return rc;
	}

	/**
	 * returns -1 if string is too short or returns one of the exception
	 * constants if everything OK, returns the length of the string
	 */
	public String getEncoderVersion() {
		return ver.getLameVersion();
	}

	/**
	 * Returns the buffer needed pcm buffer size. The passed parameter is a
	 * wished buffer size. The implementation of the encoder may return a lower
	 * or higher buffer size. The encoder must be initalized (i.e. not closed)
	 * at this point. A return value of <0 denotes an error.
	 */
	public int getPCMBufferSize() {
		return DEFAULT_PCM_BUFFER_SIZE;
	}

	public int getMP3BufferSize() {
		// bad estimate :)
		return getPCMBufferSize() / 2 + 1024;
	}


	public int getInputBufferSize() {
		return getPCMBufferSize();
	}

	public int getOutputBufferSize() {
		return getMP3BufferSize();
	}

	private int doEncodeBuffer(byte[] pcm, int offset, int length,	byte[] encoded) {
		int bytes_per_sample = sourceSampleSizeInBits >> 3;
		int samples_read = length / bytes_per_sample;



		int[] sample_buffer = new int[samples_read];

		int sample_index = samples_read;
		if (!sourceEncoding.toString().equals("PCM_FLOAT")){
			if (sourceByteOrder == ByteOrder.LITTLE_ENDIAN) {
				if (bytes_per_sample == 1)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff) << 24;
				if (bytes_per_sample == 2)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff) << 16
								| (pcm[offset + i + 1] & 0xff) << 24;
				if (bytes_per_sample == 3)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff) << 8
								| (pcm[offset + i + 1] & 0xff) << 16
								| (pcm[offset + i + 2] & 0xff) << 24;
				if (bytes_per_sample == 4)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff)
								| (pcm[offset + i + 1] & 0xff) << 8
								| (pcm[offset + i + 2] & 0xff) << 16
								| (pcm[offset + i + 3] & 0xff) << 24;
			} else {
				if (bytes_per_sample == 1)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = ((pcm[offset + i] & 0xff) ^ 0x80) << 24
								| 0x7f << 16;
				if (bytes_per_sample == 2)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff) << 24
								| (pcm[offset + i + 1] & 0xff) << 16;
				if (bytes_per_sample == 3)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff) << 24
								| (pcm[offset + i + 1] & 0xff) << 16
								| (pcm[offset + i + 2] & 0xff) << 8;
				if (bytes_per_sample == 4)
					for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;)
						sample_buffer[--sample_index] = (pcm[offset + i] & 0xff) << 24
								| (pcm[offset + i + 1] & 0xff) << 16
								| (pcm[offset + i + 2] & 0xff) << 8
								| (pcm[offset + i + 3] & 0xff);
			}
		} else {
			if (bytes_per_sample == 4)
				for (int i = samples_read * bytes_per_sample; (i -= bytes_per_sample) >= 0;){
					byte[] sample = new byte[4];
					sample[0] = pcm [offset + i];
					sample[1] = pcm [offset + i + 1];
					sample[2] = pcm [offset + i + 2];
					sample[3] = pcm [offset + i + 3];
					float amlitude = convertByteArrayToFloat(sample, 0, sourceByteOrder);
					if (Math.abs(amlitude)>=1.0) continue;
					int sampleInt = Math.round(Integer.MAX_VALUE*amlitude);
					sample_buffer[--sample_index]=sampleInt;
//					System.out.print(sample_buffer[--sample_index]=sampleInt);
//					System.out.println(Arrays.toString(sample));
				}
		}
		int p = samples_read;
		samples_read /= gfp.num_channels;

		int buffer[][] = new int[2][samples_read];
		if (gfp.num_channels == 2) {
			for (int i = samples_read; --i >= 0;) {
				buffer[1][i] = sample_buffer[--p];
				buffer[0][i] = sample_buffer[--p];
			}
		} else if (gfp.num_channels == 1) {
			Arrays.fill(buffer[1], 0, samples_read, 0);
			for (int i = samples_read; --i >= 0;) {
				buffer[0][i] = buffer[1][i] = sample_buffer[--p];
			}
		}
			
		int res = lame.lame_encode_buffer_int(gfp, buffer[0], buffer[1], samples_read, encoded, 0, encoded.length);
		return res;
	}

	/**
	 * Encode a block of data. Throws IllegalArgumentException when parameters
	 * are wrong. When the <code>encoded</code> array is too small, an
	 * ArrayIndexOutOfBoundsException is thrown. <code>length</code> should be
	 * the value returned by getPCMBufferSize.
	 * 
	 * @return the number of bytes written to <code>encoded</code>. May be 0.
	 */
	public int encodeBuffer(byte[] pcm, int offset, int length, byte[] encoded)
			throws ArrayIndexOutOfBoundsException {
		if (length < 0 || (offset + length) > pcm.length) {
			throw new IllegalArgumentException("inconsistent parameters");
		}
		int result = doEncodeBuffer(pcm, offset, length, encoded);
		if (result < 0) {
			if (result == -1) {
				throw new ArrayIndexOutOfBoundsException(
						"Encode buffer too small");
			}
			throw new RuntimeException("crucial error in encodeBuffer.");
		}
		return result;
	}

	public int encodeFinish(byte[] encoded) {
		return lame.lame_encode_flush(gfp, encoded, 0, encoded.length);
	}

	public void close() {
		lame.lame_close(gfp);
	}

	// properties
	private void readProps(Map<String, Object> props) {
		Object q = props.get(P_QUALITY);
		if (q instanceof String) {
			quality = string2quality(((String) q).toLowerCase(), quality);
		} else if (q instanceof Integer) {
			quality = (Integer) q;
		} else if (q != null) {
			throw new IllegalArgumentException(
					"illegal type of quality property: " + q);
		}
		q = props.get(P_BITRATE);
		if (q instanceof String) {
			bitRate = Integer.parseInt((String) q);
		} else if (q instanceof Integer) {
			bitRate = (Integer) q;
		} else if (q != null) {
			throw new IllegalArgumentException(
					"illegal type of bitrate property: " + q);
		}
		q = props.get(P_CHMODE);
		if (q instanceof String) {
			chMode = string2chmode(((String) q).toLowerCase(), chMode);
		} else if (q != null) {
			throw new IllegalArgumentException(
					"illegal type of chmode property: " + q);
		}
		q = props.get(P_VBR);
		if (q instanceof String) {
			vbrMode = string2bool(((String) q));
		} else if (q instanceof Boolean) {
			vbrMode = (Boolean) q;
		} else if (q != null) {
			throw new IllegalArgumentException("illegal type of vbr property: "
					+ q);
		}
	}

	/**
	 * Return the audioformat representing the encoded mp3 stream. The format
	 * object will have the following properties:
	 * <ul>
	 * <li>quality: an Integer, 1 (highest) to 9 (lowest)
	 * <li>bitrate: an Integer, 32...320 kbit/s
	 * <li>chmode: channel mode, a String, one of &quot;jointstereo&quot;,
	 * &quot;dual&quot;, &quot;mono&quot;, &quot;auto&quot; (default).
	 * <li>vbr: a Boolean
	 * <li>encoder.version: a string with the version of the encoder
	 * <li>encoder.name: a string with the name of the encoder
	 * </ul>
	 */
	public AudioFormat getEffectiveFormat() {
		// first gather properties
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put(P_QUALITY, getEffectiveQuality());
		map.put(P_BITRATE, getEffectiveBitRate());
		map.put(P_CHMODE, chmode2string(getEffectiveChannelMode()));
		map.put(P_VBR, getEffectiveVBR());
		// map.put(P_SAMPLERATE, getEffectiveSampleRate());
		// map.put(P_ENCODING,getEffectiveEncoding());
		map.put("encoder.name", "LAME");
		map.put("encoder.version", getEncoderVersion());
		int channels = 2;
		if (chMode == CHANNEL_MODE_MONO) {
			channels = 1;
		}
		return new AudioFormat(getEffectiveEncoding(),
				getEffectiveSampleRate(), NOT_SPECIFIED, channels,
				NOT_SPECIFIED, NOT_SPECIFIED, false, map);
	}

	public int getEffectiveQuality() {
		if (effQuality >= QUALITY_LOWEST) {
			return QUALITY_LOWEST;
		} else if (effQuality >= QUALITY_LOW) {
			return QUALITY_LOW;
		} else if (effQuality >= QUALITY_MIDDLE) {
			return QUALITY_MIDDLE;
		} else if (effQuality >= QUALITY_HIGH) {
			return QUALITY_HIGH;
		}
		return QUALITY_HIGHEST;
	}

	public int getEffectiveBitRate() {
		return effBitRate;
	}

	public int getEffectiveChannelMode() {
		return effChMode;
	}

	public boolean getEffectiveVBR() {
		return effVbr != 0;
	}

	public int getEffectiveSampleRate() {
		return effSampleRate;
	}

	public AudioFormat.Encoding getEffectiveEncoding() {
		if (effEncoding == MPEG_VERSION_2) {
			if (getEffectiveSampleRate() < 16000) {
				return MPEG2DOT5L3;
			}
			return MPEG2L3;
		} else if (effEncoding == MPEG_VERSION_2DOT5) {
			return MPEG2DOT5L3;
		}
		// default
		return MPEG1L3;
	}

	private int string2quality(String quality, int def) {
		if (quality.equals("lowest")) {
			return QUALITY_LOWEST;
		} else if (quality.equals("low")) {
			return QUALITY_LOW;
		} else if (quality.equals("middle")) {
			return QUALITY_MIDDLE;
		} else if (quality.equals("high")) {
			return QUALITY_HIGH;
		} else if (quality.equals("highest")) {
			return QUALITY_HIGHEST;
		}
		return def;
	}

	private String chmode2string(int chmode) {
		if (chmode == CHANNEL_MODE_STEREO) {
			return "stereo";
		} else if (chmode == CHANNEL_MODE_JOINT_STEREO) {
			return "jointstereo";
		} else if (chmode == CHANNEL_MODE_DUAL_CHANNEL) {
			return "dual";
		} else if (chmode == CHANNEL_MODE_MONO) {
			return "mono";
		} else if (chmode == CHANNEL_MODE_AUTO) {
			return "auto";
		}
		return "auto";
	}

	private int string2chmode(String chmode, int def) {
		if (chmode.equals("stereo")) {
			return CHANNEL_MODE_STEREO;
		} else if (chmode.equals("jointstereo")) {
			return CHANNEL_MODE_JOINT_STEREO;
		} else if (chmode.equals("dual")) {
			return CHANNEL_MODE_DUAL_CHANNEL;
		} else if (chmode.equals("mono")) {
			return CHANNEL_MODE_MONO;
		} else if (chmode.equals("auto")) {
			return CHANNEL_MODE_AUTO;
		}
		return def;
	}

	/**
	 * @return true if val is starts with t or y or on, false if val starts with
	 *         f or n or off.
	 * @throws IllegalArgumentException
	 *             if val is neither true nor false
	 */
	private static boolean string2bool(String val) {
		if (val.length() > 0) {
			if ((val.charAt(0) == 'f') // false
					|| (val.charAt(0) == 'n') // no
					|| (val.equals("off"))) {
				return false;
			}
			if ((val.charAt(0) == 't') // true
					|| (val.charAt(0) == 'y') // yes
					|| (val.equals("on"))) {
				return true;
			}
		}
		throw new IllegalArgumentException(
				"wrong string for boolean property: " + val);
	}

	public final float convertByteArrayToFloat(byte bytes[], int offset, ByteOrder byteOrder)
	{
		byte byte0 = bytes[offset + 0];
		byte byte1 = bytes[offset + 1];
		byte byte2 = bytes[offset + 2];
		byte byte3 = bytes[offset + 3];
		int bits;
		if (byteOrder == ByteOrder.BIG_ENDIAN) //big endian
		{
			bits = ((0xff & byte0) << 24) | ((0xff & byte1) << 16) | ((0xff & byte2) << 8) | ((0xff & byte3) << 0);
		} else{
			// little endian
			bits = ((0xff & byte3) << 24) | ((0xff & byte2) << 16) | ((0xff & byte1) << 8) | ((0xff & byte0) << 0);
		}
		float result = Float.intBitsToFloat(bits);
		return result;
	}

	public AudioFormat getSourceFormat() {
		return sourceFormat;
	}

	public AudioFormat getTargetFormat() {
		return targetFormat;
	}

	/** * Lame.java ** */

}
