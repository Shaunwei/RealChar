package mp3;

/**
 * PSY Model related stuff
 */
public class PSY {
	/**
	 * The dbQ stuff.
	 */
	float mask_adjust;
	/**
	 * The dbQ stuff.
	 */
	float mask_adjust_short;
	/* at transition from one scalefactor band to next */
	/**
	 * Band weight long scalefactor bands.
	 */
	float bo_l_weight[] = new float[Encoder.SBMAX_l];
	/**
	 * Band weight short scalefactor bands.
	 */
	float bo_s_weight[] = new float[Encoder.SBMAX_s];
}