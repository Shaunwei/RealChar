/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.model

sealed interface ILlmOption {
    val raw: String
    val display: String
}

object LlmOption {
    fun fromRaw(raw: String) = options.firstOrNull { it.raw == raw }
    private val options = arrayOf(
        GPT35,
        GPT4,
        Claude,
        Llama
    )
    object GPT35 : ILlmOption {
        override val raw = "gpt-3.5-turbo-16k"
        override val display = "GPT-3.5"
    }

    object GPT4 : ILlmOption {
        override val raw = "gpt-4"
        override val display = "GPT-4"
    }

    object Claude : ILlmOption {
        override val raw = "claude-2"
        override val display = "Claude-2"
    }

    object Llama : ILlmOption {
        override val raw = "meta-llama/Llama-2-70b-chat-hf"
        override val display = "LLaMA-70b"
    }
}
