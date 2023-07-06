package mp3;

public class IIISideInfo {
	public IIISideInfo() {
		for (int gr = 0; gr < 2; gr++) {
			for (int ch = 0; ch < 2; ch++) {
				tt[gr][ch] = new GrInfo();
			}
		}
	}

	GrInfo tt[][] = new GrInfo[2][2];
	int main_data_begin;
	int private_bits;
	int resvDrain_pre;
	int resvDrain_post;
	int scfsi[][] = new int[2][4];
}