package mp3;

import mpg.Common;
import mpg.Interface;
import mpg.MPGLib;
import org.junit.Assert;
import org.junit.Test;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.ShortBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.StandardOpenOption;

public class LameTest {

/*
    @Test
    public void testEncode() throws IOException {
        Lame lame = new Lame();
        GetAudio gaud = new GetAudio();
        GainAnalysis ga = new GainAnalysis();
        BitStream bs = new BitStream();
        Presets p = new Presets();
        QuantizePVT qupvt = new QuantizePVT();
        Quantize qu = new Quantize();
        VBRTag vbr = new VBRTag();
        Version ver = new Version();
        ID3Tag id3 = new ID3Tag();
        Reservoir rv = new Reservoir();
        Takehiro tak = new Takehiro();
        Parse parse = new Parse();
        BRHist hist = new BRHist();

        MPGLib mpg = new MPGLib();
        Interface intf = new Interface();
        Common common = new Common();

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

        LameGlobalFlags gfp = lame.lame_init();

        gfp.num_channels = 1;
        gfp.in_samplerate = 48000;
        gfp.brate = 128;
        gfp.mode = MPEGMode.STEREO;
        gfp.quality = 3;
        gfp.bWriteVbrTag = false;
        gfp.disable_reservoir = true;
        gfp.write_id3tag_automatic = false;

        int retcode = lame.lame_init_params(gfp);
        System.out.println("DONE " + retcode);

        File file = new File("/Users/zhukov/git/tle1.3x/test-data/wav/440880.wav");
        MappedByteBuffer map = FileChannel.open(file.toPath(), StandardOpenOption.READ).map(FileChannel.MapMode.READ_ONLY, 0, file.length());
        map.order(ByteOrder.LITTLE_ENDIAN);
        int dataLen = map.getInt(0x28);
        map.position(0x2c);
        map.limit(0x2c + dataLen);
        ShortBuffer samples = map.slice().order(ByteOrder.LITTLE_ENDIAN).asShortBuffer();
        short i = samples.get(1);
        Assert.assertEquals(0x05e6, i);
        System.out.println(samples + " " + Integer.toHexString(i));
        int remaining = samples.remaining();
        short[] left = new short[remaining];
        short[] right = new short[remaining];
        samples.clear();
        samples.get(left);
        samples.clear();
        samples.get(right);

        int mp3buf_size = (int) (1.25 * remaining + 7200);
        byte[] mp3buf = new byte[mp3buf_size];
        int mp3bufPos = 0;
        int _sz = lame.lame_encode_buffer(gfp, left, right, remaining,
                mp3buf, mp3bufPos, mp3buf_size);
        System.out.println("lame_encode_buffer: " + _sz);
    }
*/

    @Test
    public void testEncodeChugai() throws IOException {
        Lame lame = new Lame();
        GetAudio gaud = new GetAudio();
        GainAnalysis ga = new GainAnalysis();
        BitStream bs = new BitStream();
        Presets p = new Presets();
        QuantizePVT qupvt = new QuantizePVT();
        Quantize qu = new Quantize();
        VBRTag vbr = new VBRTag();
        Version ver = new Version();
        ID3Tag id3 = new ID3Tag();
        Reservoir rv = new Reservoir();
        Takehiro tak = new Takehiro();
        Parse parse = new Parse();
        BRHist hist = new BRHist();

        MPGLib mpg = new MPGLib();
        Interface intf = new Interface();
        Common common = new Common();

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

        LameGlobalFlags gfp = lame.lame_init();

        gfp.num_channels = 2;
        gfp.in_samplerate = 48000;
        gfp.brate = 128;
        gfp.mode = MPEGMode.STEREO;
        gfp.quality = 3;
        gfp.bWriteVbrTag = false;
        gfp.disable_reservoir = true;
        gfp.write_id3tag_automatic = false;

        int retcode = lame.lame_init_params(gfp);
        System.out.println("DONE " + retcode);

//        File file = new File("/Users/zhukov/git/tle1.3x/test-data/wav/440880.wav");
        File file = new File("/Users/chugai/dev/DPlayer/merm2/proxy/c00.wav");
        MappedByteBuffer map = FileChannel.open(file.toPath(), StandardOpenOption.READ).map(FileChannel.MapMode.READ_ONLY, 0, file.length());
        map.order(ByteOrder.LITTLE_ENDIAN);
        int dataLen = map.getInt(0x28);
        map.position(0x2c);
        map.limit(0x2c + dataLen);

        ShortBuffer samples = map.slice().order(ByteOrder.LITTLE_ENDIAN).asShortBuffer();
        samples.limit(1152 * 8);
        Assert.assertEquals(0, samples.get(0));
        Assert.assertEquals(943, samples.get(1));
        int remaining = samples.remaining();

        int[] left = new int[remaining];
        for (int i = 0; i < remaining; i++)
            left[i] = samples.get(i);

        int mp3buf_size = (int) (1.25 * remaining + 7200);
        byte[] mp3buf = new byte[mp3buf_size];
        int mp3bufPos = 0;

        int _sz = lame.lame_encode_buffer_int(gfp, left, left, remaining,
                mp3buf, mp3bufPos, mp3buf_size);
        mp3bufPos += _sz;
        System.out.println("lame_encode_buffer: " + _sz);

        _sz = lame.lame_encode_flush(gfp, mp3buf, mp3bufPos, mp3buf_size);
        mp3bufPos += _sz;
        System.out.println("lame_encode_flush: " + _sz);

        OutputStream out = new BufferedOutputStream(new FileOutputStream("/Users/chugai/Downloads/generated_java.mp3"));
        out.write(mp3buf, 0, mp3bufPos);
        out.close();
    }
}
