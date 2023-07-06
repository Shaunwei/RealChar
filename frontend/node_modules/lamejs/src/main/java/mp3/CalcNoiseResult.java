package mp3;

public class CalcNoiseResult {
	/**
	 * sum of quantization noise > masking
	 */
	float over_noise;
	/**
	 * sum of all quantization noise
	 */
	float tot_noise;
	/**
	 * max quantization noise
	 */
	float max_noise;
	/**
	 * number of quantization noise > masking
	 */
	int over_count;
	/**
	 * SSD-like cost of distorted bands
	 */
	int over_SSD;
	int bits;
}