//package mp3;

//import java.util.ArrayList;

//import mp3.ID3Tag.MimeType;

function ID3TagSpec() {
    this.flags = 0;
    this.year = 0;
    this.title = null;
    this.artist = null;
    this.album = null;
    this.comment = null;
    this.track_id3v1 = 0;
    this.genre_id3v1 = 0;
    //byte[] albumart;
    this.albumart = null;
    this.albumart_size = 0;
    this.padding_size = 0;
    this.albumart_mimetype = null;
    this.values = [];
    this.num_values = 0;
    this.v2_head = null;
    this.v2_tail = null;
}
