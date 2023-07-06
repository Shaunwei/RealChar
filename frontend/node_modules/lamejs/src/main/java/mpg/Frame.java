package mpg;

import mpg.L2Tables.al_table2;

public class Frame {

    int     stereo;
    int     jsbound;
    int     single;          /* single channel (monophonic) */
    int		lsf;             /* 0 = MPEG-1, 1 = MPEG-2/2.5 */
    boolean mpeg25;          /* 1 = MPEG-2.5, 0 = MPEG-1/2 */
    int     lay;             /* Layer */
    boolean error_protection; /* 1 = CRC-16 code following header */
    int     bitrate_index;
    int     sampling_frequency; /* sample rate of decompressed audio in Hz */
    int     padding;
    int     extension;
    int     mode;
    int     mode_ext;
    int     copyright;
    int     original;
    int     emphasis;
    int     framesize;       /* computed framesize */

    /* AF: ADDED FOR LAYER1/LAYER2 */
    int     II_sblimit;
	al_table2 []alloc;
    int     down_sample_sblimit;
    int     down_sample;

}
