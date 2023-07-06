# lamejs
Fast mp3 encoder written in JavaScript.
On my machine it works 20x faster than realtime (it will encode 132 second long sample in 6.5 seconds) both on node and chrome.
lamejs is a rewrite of jump3r-code which is a rewrite of libmp3lame.

## Installation

To install via Bower or npm, simply do the following:

```bash
$ bower install lamejs --save
```

```bash
$ npm install lamejs
```

# Quick Start

```javascript
<script src='lame.all.js'></script>
<script>
var mp3Data = [];

var mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128); //mono 44.1khz encode to 128kbps
var samples = new Int16Array(44100); //one second of silence replace that with your own samples
var mp3Tmp = mp3encoder.encodeBuffer(samples); //encode mp3

//Push encode buffer to mp3Data variable
mp3Data.push(mp3Tmp);

// Get end part of mp3
mp3Tmp = mp3encoder.flush();

// Write last data to the output data, too
// mp3Data contains now the complete mp3Data
mp3Data.push(mp3Tmp);

console.debug(mp3Data);
</script>
```

To use lamejs in Node.js build, you can install it from `npm`:

```
npm install lamejs
```

Then use it:

```
var lamejs = require("lamejs");
```

# Real Example

Either see [example.html](https://github.com/zhuker/lamejs/blob/master/example.html) for full example of wav file encoding in browser or use this:

```javascript
<script src='lame.all.js'></script>
<script>
channels = 1; //1 for mono or 2 for stereo
sampleRate = 44100; //44.1khz (normal mp3 samplerate)
kbps = 128; //encode 128kbps mp3
mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
var mp3Data = [];

samples = new Int16Array(44100); //one second of silence (get your data from the source you have)
sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

var mp3Data = [];
for (var i = 0; i < samples.length; i += sampleBlockSize) {
  sampleChunk = samples.subarray(i, i + sampleBlockSize);
  var mp3buf = mp3encoder.encodeBuffer(sampleChunk);
  if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
  }
}
var mp3buf = mp3encoder.flush();   //finish writing mp3

if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
}

var blob = new Blob(mp3Data, {type: 'audio/mp3'});
var url = window.URL.createObjectURL(blob);
console.log('MP3 URl: ', url);
</script>
```

# Stereo

If you want to encode stereo mp3 use separate sample buffers for left and right channel

```javascript
<script src='lame.all.js'></script>
<script>
mp3encoder = new lamejs.Mp3Encoder(2, 44100, 128);
var mp3Data = [];

left = new Int16Array(44100); //one second of silence (get your data from the source you have)
right = new Int16Array(44100); //one second of silence (get your data from the source you have)
sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

for (var i = 0; i < samples.length; i += sampleBlockSize) {
  leftChunk = left.subarray(i, i + sampleBlockSize);
  rightChunk = right.subarray(i, i + sampleBlockSize);
  var mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }
}
var mp3buf = mp3encoder.flush();   //finish writing mp3

if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
}

console.log(mp3Data);
</script>
```
