package mp3;

/**
 * ATH related stuff, if something new ATH related has to be added, please plug
 * it here into the ATH.
 */
public class ATH {
	/**
	 * Method for the auto adjustment.
	 */
	int useAdjust;
	/**
	 * factor for tuning the (sample power) point below which adaptive threshold
	 * of hearing adjustment occurs
	 */
	float aaSensitivityP;
	/**
	 * Lowering based on peak volume, 1 = no lowering.
	 */
	float adjust;
	/**
	 * Limit for dynamic ATH adjust.
	 */
	float adjustLimit;
	/**
	 * Determined to lower x dB each second.
	 */
	float decay;
	/**
	 * Lowest ATH value.
	 */
	float floor;
	/**
	 * ATH for sfbs in long blocks.
	 */
	float l[] = new float[Encoder.SBMAX_l];
	/**
	 * ATH for sfbs in short blocks.
	 */
	float s[] = new float[Encoder.SBMAX_s];
	/**
	 * ATH for partitioned sfb21 in long blocks.
	 */
	float psfb21[] = new float[Encoder.PSFB21];
	/**
	 * ATH for partitioned sfb12 in short blocks.
	 */
	float psfb12[] = new float[Encoder.PSFB12];
	/**
	 * ATH for long block convolution bands.
	 */
	float cb_l[] = new float[Encoder.CBANDS];
	/**
	 * ATH for short block convolution bands.
	 */
	float cb_s[] = new float[Encoder.CBANDS];
	/**
	 * Equal loudness weights (based on ATH).
	 */
	float eql_w[] = new float[Encoder.BLKSIZE / 2];
}