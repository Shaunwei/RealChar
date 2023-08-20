/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.model

import java.net.URL

data class Character(
    val id: String,
    val name: String,
    val description: String?,
    val imageUrl: URL?,
    val authorName: String,
    val source: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Character

        /** fixme: server does not return id.......  */
        if (name != other.name) return false

        return true
    }
}

class CharacterResponse: ArrayList<Character>() {}