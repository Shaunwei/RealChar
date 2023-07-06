//package mp3;

function CalcNoiseResult() {
    /**
     * sum of quantization noise > masking
     */
    this.over_noise = 0.;
    /**
     * sum of all quantization noise
     */
    this.tot_noise = 0.;
    /**
     * max quantization noise
     */
    this.max_noise = 0.;
    /**
     * number of quantization noise > masking
     */
    this.over_count = 0;
    /**
     * SSD-like cost of distorted bands
     */
    this.over_SSD = 0;
    this.bits = 0;
}

module.exports = CalcNoiseResult;
