function Version() {

    /**
     * URL for the LAME website.
     */
    var LAME_URL = "http://www.mp3dev.org/";

    /**
     * Major version number.
     */
    var LAME_MAJOR_VERSION = 3;
    /**
     * Minor version number.
     */
    var LAME_MINOR_VERSION = 98;
    /**
     * Patch level.
     */
    var LAME_PATCH_VERSION = 4;

    /**
     * Major version number.
     */
    var PSY_MAJOR_VERSION = 0;
    /**
     * Minor version number.
     */
    var PSY_MINOR_VERSION = 93;

    /**
     * A string which describes the version of LAME.
     *
     * @return string which describes the version of LAME
     */
    this.getLameVersion = function () {
        // primary to write screen reports
        return (LAME_MAJOR_VERSION + "." + LAME_MINOR_VERSION + "." + LAME_PATCH_VERSION);
    }

    /**
     * The short version of the LAME version string.
     *
     * @return short version of the LAME version string
     */
    this.getLameShortVersion = function () {
        // Adding date and time to version string makes it harder for output
        // validation
        return (LAME_MAJOR_VERSION + "." + LAME_MINOR_VERSION + "." + LAME_PATCH_VERSION);
    }

    /**
     * The shortest version of the LAME version string.
     *
     * @return shortest version of the LAME version string
     */
    this.getLameVeryShortVersion = function () {
        // Adding date and time to version string makes it harder for output
        return ("LAME" + LAME_MAJOR_VERSION + "." + LAME_MINOR_VERSION + "r");
    }

    /**
     * String which describes the version of GPSYCHO
     *
     * @return string which describes the version of GPSYCHO
     */
    this.getPsyVersion = function () {
        return (PSY_MAJOR_VERSION + "." + PSY_MINOR_VERSION);
    }

    /**
     * String which is a URL for the LAME website.
     *
     * @return string which is a URL for the LAME website
     */
    this.getLameUrl = function () {
        return LAME_URL;
    }

    /**
     * Quite useless for a java version, however we are compatible ;-)
     *
     * @return "32bits"
     */
    this.getLameOsBitness = function () {
        return "32bits";
    }

}

module.exports = Version;
