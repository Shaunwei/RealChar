package mp3;

public final class III_psy_xmin {
	float[] l = new float[Encoder.SBMAX_l];
	float[][] s = new float[Encoder.SBMAX_s][3];

	public void assign(III_psy_xmin iii_psy_xmin) {
		System.arraycopy(iii_psy_xmin.l, 0, l, 0, Encoder.SBMAX_l);
		for (int i = 0; i < Encoder.SBMAX_s; i++) {
			for (int j = 0; j < 3; j++) {
				s[i][j] = iii_psy_xmin.s[i][j];
			}
		}
	}
}