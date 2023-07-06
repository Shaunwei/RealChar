package mp3;

/**
 * allows re-use of previously computed noise values
 */
public class CalcNoiseData {
	int global_gain;
	int sfb_count1;
	int step[] = new int[39];
	float noise[] = new float[39];
	float noise_log[] = new float[39];
}