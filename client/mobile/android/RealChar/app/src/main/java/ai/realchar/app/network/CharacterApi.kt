/**
 * Created by obesitychow on 8/20/23
 */

package ai.realchar.app.network

import ai.realchar.app.model.CharacterResponse
import io.reactivex.Observable
import retrofit2.http.GET

interface CharacterApi {
    @GET("characters")
    fun getCharacters(): Observable<CharacterResponse?>
}