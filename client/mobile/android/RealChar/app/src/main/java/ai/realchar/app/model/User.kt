/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.model

data class User(
    val name: String? = null,
    val email: String? = null,
)
data class LoginUser(
    val token: String,
    val user: User,
    val type: LoginType = LoginType.Google,
)

enum class LoginType {
    Google
}
