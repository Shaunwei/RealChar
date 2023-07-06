package mp3;

public class Version {

	/**
	 * URL for the LAME website.
	 */
	private static final String LAME_URL = "http://www.mp3dev.org/";

	/**
	 * Major version number.
	 */
	private static final int LAME_MAJOR_VERSION = 3;
	/**
	 * Minor version number.
	 */
	private static final int LAME_MINOR_VERSION = 98;
	/**
	 * Patch level.
	 */
	private static final int LAME_PATCH_VERSION = 4;

	/**
	 * Major version number.
	 */
	private static final int PSY_MAJOR_VERSION = 0;
	/**
	 * Minor version number.
	 */
	private static final int PSY_MINOR_VERSION = 93;

	/**
	 * A string which describes the version of LAME.
	 * 
	 * @return string which describes the version of LAME
	 */
	public final String getLameVersion() {
		// primary to write screen reports
		return (LAME_MAJOR_VERSION + "." + LAME_MINOR_VERSION + "." + LAME_PATCH_VERSION);
	}

	/**
	 * The short version of the LAME version string.
	 * 
	 * @return short version of the LAME version string
	 */
	public final String getLameShortVersion() {
		// Adding date and time to version string makes it harder for output
		// validation
		return (LAME_MAJOR_VERSION + "." + LAME_MINOR_VERSION + "." + LAME_PATCH_VERSION);
	}

	/**
	 * The shortest version of the LAME version string.
	 * 
	 * @return shortest version of the LAME version string
	 */
	public final String getLameVeryShortVersion() {
		// Adding date and time to version string makes it harder for output
		return ("LAME" + LAME_MAJOR_VERSION + "." + LAME_MINOR_VERSION + "r");
	}

	/**
	 * String which describes the version of GPSYCHO
	 * 
	 * @return string which describes the version of GPSYCHO
	 */
	public final String getPsyVersion() {
		return (PSY_MAJOR_VERSION + "." + PSY_MINOR_VERSION);
	}

	/**
	 * String which is a URL for the LAME website.
	 * 
	 * @return string which is a URL for the LAME website
	 */
	public final String getLameUrl() {
		return LAME_URL;
	}

	/**
	 * Quite useless for a java version, however we are compatible ;-)
	 * 
	 * @return "32bits"
	 */
	public final String getLameOsBitness() {
		return "32bits";
	}

}
