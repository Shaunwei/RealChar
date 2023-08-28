/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.model

import java.util.Locale

sealed interface ILanguage {
    val raw: String
    val display: String
    val locale: Locale get() = Locale(raw)
}

object LanguageOption {
    fun fromRaw(raw: String) = LanguageOption.options.firstOrNull { it.raw == raw }
    private val options = arrayOf(
        English, Spanish, French, German, Italian, Portuguese, Polish, Hindi, Chinese
    )
    object English : ILanguage {
        override val raw = "en-US"
        override val display = "English"
    }

    object Spanish : ILanguage {
        override val raw = "es-ES"
        override val display = "Spanish"
    }

    object French : ILanguage {
        override val raw = "fr-FR"
        override val display = "French"
    }

    object German : ILanguage {
        override val raw = "de-DE"
        override val display = "German"
    }

    object Italian : ILanguage {
        override val raw = "it-IT"
        override val display = "Italian"
    }

    object Portuguese : ILanguage {
        override val raw = "pt-PT"
        override val display = "Portuguese"
    }

    object Polish : ILanguage {
        override val raw = "pl-PL"
        override val display = "Polish"
    }

    object Hindi : ILanguage {
        override val raw = "hi-IN"
        override val display = "Hindi"
    }

    object Chinese : ILanguage {
        override val raw = "zh-CN"
        override val display = "Chinese"
    }
}
