(function (exports) {
  'use strict';

  var MP3Converter = function (config) {
    config = config || {};
    var busy = false;
    var mp3Worker = new Worker('worker.js');

    this.isBusy = function () {
      return busy
    };

    this.convert = function (blob) {
      var conversionId = 'conversion_' + Date.now(),
        tag = conversionId + ":"
        ;
      var opts = [];
      for(var i=1; i < arguments.length;i++){
        opts.push(arguments[i]);
      }
      console.log(tag, 'Starting conversion');
      var preferredConfig = {}, onSuccess, onProgress, onError;
      if (typeof opts[0] == 'object') {
          preferredConfig = opts.shift();
      }


      onSuccess = opts.shift();
      onProgress = opts.shift();
      onError = opts.shift();

      if (busy) {
        throw ("Another conversion is in progress");
      }

      var initialSize = blob.size,
        fileReader = new FileReader(),
        startTime = Date.now();

      fileReader.onload = function (e) {
        console.log(tag, "Passed to BG process");
        mp3Worker.postMessage({
          cmd: 'init',
          config: preferredConfig
        });
        
        mp3Worker.postMessage({cmd: 'encode', rawInput: e.target.result});
        mp3Worker.postMessage({cmd: 'finish'});

        mp3Worker.onmessage = function (e) {
          if (e.data.cmd == 'end') {
            console.log(tag, "Done converting to Mp3");
            var mp3Blob = new Blob(e.data.buf, {type: 'audio/mp3'});
            console.log(tag, "Conversion completed in: " + ((Date.now() - startTime) / 1000) + 's');
            var finalSize = mp3Blob.size;
            console.log(tag +
              "Initial size: = " + initialSize + ", " +
              "Final size = " + finalSize
              + ", Reduction: " + Number((100 * (initialSize - finalSize) / initialSize)).toPrecision(4) + "%");

            busy = false;

            if(onProgress && typeof onProgress=='function'){
              onProgress(1);
            }

            if (onSuccess && typeof onSuccess === 'function') {
              onSuccess(mp3Blob);
            }
          } else if(e.data.cmd == 'progress'){
            //post progress
            if(onProgress && typeof onProgress=='function'){
              onProgress(e.data.progress);
            }
          } else if(e.data.cmd == 'error'){

          }
        };
      };
      busy = true;
      fileReader.readAsArrayBuffer(blob);
    }
  };

  exports.MP3Converter = MP3Converter;
})(window);
