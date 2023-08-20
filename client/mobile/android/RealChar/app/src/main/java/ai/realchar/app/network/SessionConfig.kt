/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.network

import ai.realchar.app.model.ILanguage
import ai.realchar.app.model.ILlmOption
import ai.realchar.app.model.LanguageOption
import ai.realchar.app.model.LlmOption

data class SessionConfig(
    val useSearch: Boolean = false,
    val useQuivr: Boolean = false,
    val language: ILanguage = LanguageOption.English,
    val llmModel: ILlmOption = LlmOption.GPT35,
    val characterId: String,
    val token: String = "",
)
