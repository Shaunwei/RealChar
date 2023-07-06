package mp3;

/**
 * Layer III side information.
 * 
 * @author Ken
 * 
 */
public final class ScaleFac {
	public ScaleFac() {
	}

	public ScaleFac(final int[] arrL, final int[] arrS, final int[] arr21,
			final int[] arr12) {
		System.arraycopy(arrL, 0, l, 0, Math.min(arrL.length, l.length));
		System.arraycopy(arrS, 0, s, 0, Math.min(arrS.length, s.length));
		System.arraycopy(arr21, 0, psfb21, 0,
				Math.min(arr21.length, psfb21.length));
		System.arraycopy(arr12, 0, psfb12, 0,
				Math.min(arr12.length, psfb12.length));
	}

	int[] l = new int[1 + Encoder.SBMAX_l];
	int[] s = new int[1 + Encoder.SBMAX_s];
	int[] psfb21 = new int[1 + Encoder.PSFB21];
	int[] psfb12 = new int[1 + Encoder.PSFB12];
}