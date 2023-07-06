package mpg;

public class MPG123 {
	public static final double M_SQRT2 = 1.41421356237309504880;
	public static final double M_PI = 3.14159265358979323846;

	public static final int        SBLIMIT                 =32;
	public static final int        SSLIMIT                 =18;

	public static final int        MPG_MD_STEREO           =0;
	public static final int        MPG_MD_JOINT_STEREO     =1;
	public static final int        MPG_MD_DUAL_CHANNEL     =2;
	public static final int        MPG_MD_MONO             =3;

	public static final int MAXFRAMESIZE =2880;

	/* AF: ADDED FOR LAYER1/LAYER2 */
	public static final int         SCALE_BLOCK             =12;


	static class gr_info_s {
	    int     scfsi;
	    int part2_3_length;
	    int big_values;
	    int scalefac_compress;
	    int block_type;
	    int mixed_block_flag;
	    int table_select[]=new int[3];
	    int subblock_gain[]=new int[3];
	    int maxband[]=new int[3];
	    int maxbandl;
	    int maxb;
	    int region1start;
	    int region2start;
	    int preflag;
	    int scalefac_scale;
	    int count1table_select;
	    float   full_gain[][]=new float[3][];
	    int		full_gainPos[]=new int[3];
	    float   []pow2gain;
	    int		pow2gainPos;
	};

	static class grT {
		public grT() {
			gr[0] = new gr_info_s();
			gr[1] = new gr_info_s();
		}
        gr_info_s gr[]=new gr_info_s[2];
    } 
	static class III_sideinfo {
		public III_sideinfo() {
			ch[0]= new grT();
			ch[1]= new grT();
		}
	    int main_data_begin;
	    int private_bits;
	    grT ch[]=new grT[2];
	};
	


}
