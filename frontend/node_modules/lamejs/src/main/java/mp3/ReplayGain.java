package mp3;

public final class ReplayGain {
	float linprebuf[] = new float[GainAnalysis.MAX_ORDER * 2];
	/**
	 * left input samples, with pre-buffer
	 */
	int linpre;
	float lstepbuf[] = new float[GainAnalysis.MAX_SAMPLES_PER_WINDOW + GainAnalysis.MAX_ORDER];
	/**
	 * left "first step" (i.e. post first filter) samples
	 */
	int lstep;
	float loutbuf[] = new float[GainAnalysis.MAX_SAMPLES_PER_WINDOW + GainAnalysis.MAX_ORDER];
	/**
	 * left "out" (i.e. post second filter) samples
	 */
	int lout;
	float rinprebuf[] = new float[GainAnalysis.MAX_ORDER * 2];
	/**
	 * right input samples ...
	 */
	int rinpre;
	float rstepbuf[] = new float[GainAnalysis.MAX_SAMPLES_PER_WINDOW + GainAnalysis.MAX_ORDER];
	int rstep;
	float routbuf[] = new float[GainAnalysis.MAX_SAMPLES_PER_WINDOW + GainAnalysis.MAX_ORDER];
	int rout;
	/**
	 * number of samples required to reach number of milliseconds required
	 * for RMS window
	 */
	int sampleWindow;
	int totsamp;
	double lsum;
	double rsum;
	int freqindex;
	int first;
	int A[] = new int[(int) (GainAnalysis.STEPS_per_dB * GainAnalysis.MAX_dB)];
	int B[] = new int[(int) (GainAnalysis.STEPS_per_dB * GainAnalysis.MAX_dB)];

}