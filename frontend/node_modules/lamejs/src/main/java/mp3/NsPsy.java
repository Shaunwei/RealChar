package mp3;

/**
 * Variables used for --nspsytune
 * 
 * @author Ken
 * 
 */
public class NsPsy {
	float last_en_subshort[][] = new float[4][9];
	int lastAttacks[] = new int[4];
	float pefirbuf[] = new float[19];
	float longfact[] = new float[Encoder.SBMAX_l];
	float shortfact[] = new float[Encoder.SBMAX_s];

	/**
	 * short block tuning
	 */
	float attackthre;
	float attackthre_s;
}