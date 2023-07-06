(function () {
  'use strict';

  console.log('MP3 conversion worker started.');
  importScripts('../lame.min.js');

  var mp3Encoder, maxSamples = 1152,
    wav, samplesLeft, config, dataBuffer, samplesRight;
  var clearBuffer = function () {
    dataBuffer = [];
  };

  var appendToBuffer = function (mp3Buf) {
    dataBuffer.push(new Int8Array(mp3Buf));
  };


  var init = function (prefConfig) {
    config = prefConfig || {};
    clearBuffer();
  };

  var encode = function (arrayBuffer) {
    wav = lamejs.WavHeader.readHeader(new DataView(arrayBuffer));
    console.log('wave:', wav);
    if (!wav) {
      self.postMessage({cmd: 'error', msg: 'Specified file is not a Wave file'});
      return;
    }

    var dataView = new Int16Array(arrayBuffer, wav.dataOffset, wav.dataLen / 2);
    samplesLeft = wav.channels === 1 ? dataView : new Int16Array(wav.dataLen / (2 * wav.channels));
    samplesRight = wav.channels === 2 ? new Int16Array(wav.dataLen / (2 * wav.channels)) : undefined;
    if (wav.channels > 1) {
      for (var i = 0; i < samplesLeft.length; i++) {
        samplesLeft[i] = dataView[i * 2];
        samplesRight[i] = dataView[i * 2 + 1];
      }
    }

    mp3Encoder = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, config.bitRate || 96);

    var remaining = samplesLeft.length;
    for (var i = 0; remaining >= maxSamples; i += maxSamples) {
      var left = samplesLeft.subarray(i, i + maxSamples);
      var right;
      if (samplesRight) {
        right = samplesRight.subarray(i, i + maxSamples);
      }
      var mp3buf = mp3Encoder.encodeBuffer(left, right);
      appendToBuffer(mp3buf);
      remaining -= maxSamples;
      self.postMessage({
        cmd: 'progress',
        progress: (1 - remaining / samplesLeft.length)
      });
    }
  };

  var finish = function () {
    if (!wav) {
      return;
    }
    var mp3buf = mp3Encoder.flush();
    appendToBuffer(mp3buf);
    self.postMessage({
      cmd: 'end',
      buf: dataBuffer
    });
    console.log('done encoding');
    clearBuffer(); //free up memory
  };

  self.onmessage = function (e) {
    switch (e.data.cmd) {
      case 'init':
        init(e.data.config);
        break;

      case 'encode':
        encode(e.data.rawInput);
        break;

      case 'finish':
        finish();
        break;
    }
  };

})();