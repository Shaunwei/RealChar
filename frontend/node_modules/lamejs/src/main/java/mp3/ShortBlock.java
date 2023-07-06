package mp3;

public enum ShortBlock {
	/**
	 * LAME may use them, even different block types for L/R.
	 */
	short_block_allowed,
	/**
	 * LAME may use them, but always same block types in L/R.
	 */
	short_block_coupled,
	/**
	 * LAME will not use short blocks, long blocks only.
	 */
	short_block_dispensed,
	/**
	 * LAME will not use long blocks, short blocks only.
	 */
	short_block_forced
}
