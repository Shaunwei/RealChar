package mp3;

public class VBRSeekInfo {
	/**
	 * What we have seen so far.
	 */
	int sum;
	/**
	 * How many frames we have seen in this chunk.
	 */
	int seen;
	/**
	 * How many frames we want to collect into one chunk.
	 */
	int want;
	/**
	 * Actual position in our bag.
	 */
	int pos;
	/**
	 * Size of our bag.
	 */
	int size;
	/**
	 * Pointer to our bag.
	 */
	int[] bag;
	int nVbrNumFrames;
	int nBytesWritten;
	/* VBR tag data */
	int TotalFrameSize;
}