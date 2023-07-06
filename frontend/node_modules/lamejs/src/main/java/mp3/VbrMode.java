package mp3;

public enum VbrMode {
	vbr_off, vbr_mt, vbr_rh, vbr_abr, vbr_mtrh;
	public static final VbrMode vbr_default = vbr_mtrh;
}
