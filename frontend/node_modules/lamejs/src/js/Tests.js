var fs = require("fs");
var path = require("path")
var common = require("./common.js");

var lamejs = require("./index");

var WavHeader = lamejs.WavHeader;
var Mp3Encoder = lamejs.Mp3Encoder;

var assert = common.assert;

function testFullLength() {
    var r = fs.readFileSync(path.join("testdata", "Left44100.wav"));
    var sampleBuf = new Uint8Array(r).buffer;
    var w = WavHeader.readHeader(new DataView(sampleBuf));
    var samples = new Int16Array(sampleBuf, w.dataOffset, w.dataLen / 2);
    var remaining = samples.length;
    var lameEnc = new Mp3Encoder(); //w.channels, w.sampleRate, 128);
    var maxSamples = 1152;

    var fd = fs.openSync(path.join("testdata", "testjs2.mp3"), "w");
    var time = new Date().getTime();
    for (var i = 0; remaining >= maxSamples; i += maxSamples) {
        var left = samples.subarray(i, i + maxSamples);
        var right = samples.subarray(i, i + maxSamples);

        var mp3buf = lameEnc.encodeBuffer(left, right);
        if (mp3buf.length > 0) {
            fs.writeSync(fd, new Buffer(mp3buf), 0, mp3buf.length);
        }
        remaining -= maxSamples;
    }
    var mp3buf = lameEnc.flush();
    if (mp3buf.length > 0) {
        fs.writeSync(fd, new Buffer(mp3buf), 0, mp3buf.length);
    }
    fs.closeSync(fd);
    time = new Date().getTime() - time;
    console.log('done in ' + time + 'msec');
}

function testStereo44100() {
    var r1 = fs.readFileSync(path.join("testdata", "Left44100.wav"));
    var r2 = fs.readFileSync(path.join("testdata", "Right44100.wav"));
    var fd = fs.openSync(path.join("testdata", "stereo.mp3"), "w");

    var sampleBuf1 = new Uint8Array(r1).buffer;
    var sampleBuf2 = new Uint8Array(r2).buffer;
    var w1 = WavHeader.readHeader(new DataView(sampleBuf1));
    var w2 = WavHeader.readHeader(new DataView(sampleBuf2));

    var samples1 = new Int16Array(sampleBuf1, w1.dataOffset, w1.dataLen / 2);
    var samples2 = new Int16Array(sampleBuf2, w2.dataOffset, w2.dataLen / 2);
    var remaining1 = samples1.length;
    var remaining2 = samples2.length;
    assert(remaining1 == remaining2);
    assert(w1.sampleRate == w2.sampleRate);

    var lameEnc = new Mp3Encoder(2, w1.sampleRate, 128);
    var maxSamples = 1152;

    var time = new Date().getTime();
    for (var i = 0; remaining1 >= maxSamples; i += maxSamples) {
        var left = samples1.subarray(i, i + maxSamples);
        var right = samples2.subarray(i, i + maxSamples);

        var mp3buf = lameEnc.encodeBuffer(left, right);
        if (mp3buf.length > 0) {
            fs.writeSync(fd, new Buffer(mp3buf), 0, mp3buf.length);
        }
        remaining1 -= maxSamples;

    }
    var mp3buf = lameEnc.flush();
    if (mp3buf.length > 0) {
        fs.writeSync(fd, new Buffer(mp3buf), 0, mp3buf.length);
    }
    fs.closeSync(fd);
    time = new Date().getTime() - time;
    console.log('done in ' + time + 'msec');
}

testStereo44100();
testFullLength();