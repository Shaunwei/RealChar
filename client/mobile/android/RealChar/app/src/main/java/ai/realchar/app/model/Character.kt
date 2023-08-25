/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.model

import androidx.annotation.Keep
import java.io.Serializable
import java.net.URL

@Keep
data class Character(
    val id: String? = null,
    val name: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val authorName: String? = null,
    val source: String? = null
): Serializable {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Character

        if (id != other.id) return false

        return true
    }
}

class CharacterResponse: ArrayList<Character>() {}