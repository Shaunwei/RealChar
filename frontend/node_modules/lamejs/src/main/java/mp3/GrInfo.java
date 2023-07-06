package mp3;

public final class GrInfo {
	float xr[] = new float[576];
	int l3_enc[] = new int[576];
	int scalefac[] = new int[L3Side.SFBMAX];
	float xrpow_max;

	int part2_3_length;
	int big_values;
	int count1;
	int global_gain;
	int scalefac_compress;
	int block_type;
	int mixed_block_flag;
	int table_select[] = new int[3];
	int subblock_gain[] = new int[3 + 1];
	int region0_count;
	int region1_count;
	int preflag;
	int scalefac_scale;
	int count1table_select;

	int part2_length;
	int sfb_lmax;
	int sfb_smin;
	int psy_lmax;
	int sfbmax;
	int psymax;
	int sfbdivide;
	int width[] = new int[L3Side.SFBMAX];
	int window[] = new int[L3Side.SFBMAX];
	int count1bits;
	/**
	 * added for LSF
	 */
	int[] sfb_partition_table;
	int slen[] = new int[4];

	int max_nonzero_coeff;

	public final void assign(final GrInfo other) {
		xr = other.xr.clone();
		l3_enc = other.l3_enc.clone();
		scalefac = other.scalefac.clone();
		xrpow_max = other.xrpow_max;

		part2_3_length = other.part2_3_length;
		big_values = other.big_values;
		count1 = other.count1;
		global_gain = other.global_gain;
		scalefac_compress = other.scalefac_compress;
		block_type = other.block_type;
		mixed_block_flag = other.mixed_block_flag;
		table_select = other.table_select.clone();
		subblock_gain = other.subblock_gain.clone();
		region0_count = other.region0_count;
		region1_count = other.region1_count;
		preflag = other.preflag;
		scalefac_scale = other.scalefac_scale;
		count1table_select = other.count1table_select;

		part2_length = other.part2_length;
		sfb_lmax = other.sfb_lmax;
		sfb_smin = other.sfb_smin;
		psy_lmax = other.psy_lmax;
		sfbmax = other.sfbmax;
		psymax = other.psymax;
		sfbdivide = other.sfbdivide;
		width = other.width.clone();
		window = other.window.clone();
		count1bits = other.count1bits;

		sfb_partition_table = other.sfb_partition_table.clone();
		slen = other.slen.clone();
		max_nonzero_coeff = other.max_nonzero_coeff;
	}
}