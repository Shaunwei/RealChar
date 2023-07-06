//package mp3;

function VBRSeekInfo() {
    /**
     * What we have seen so far.
     */
    this.sum = 0;
    /**
     * How many frames we have seen in this chunk.
     */
    this.seen = 0;
    /**
     * How many frames we want to collect into one chunk.
     */
    this.want = 0;
    /**
     * Actual position in our bag.
     */
    this.pos = 0;
    /**
     * Size of our bag.
     */
    this.size = 0;
    /**
     * Pointer to our bag.
     */
    this.bag = null;
    this.nVbrNumFrames = 0;
    this.nBytesWritten = 0;
    /* VBR tag data */
    this.TotalFrameSize = 0;
}

module.exports = VBRSeekInfo;
