/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.network

import ai.realchar.app.BuildConfig
import ai.realchar.app.log.RLog
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import java.util.UUID
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

class WSConnection {
    companion object {
        private const val WS_BASE_URL = BuildConfig.WS_BASE_URL
        private const val TAG = "WSConnection"
    }

    private val client = OkHttpClient.Builder()
        .pingInterval(10, TimeUnit.SECONDS)
        .build()

    private val status = AtomicReference(Status.DISCONNECTED)

    private var webSocket: WebSocket? = null
    private var lastSessionInfo: SessionInfo? = null
    fun connect(config: SessionConfig) {
        webSocket?.cancel()
        status.set(Status.DISCONNECTED)
        val sessionId = UUID.randomUUID().toString()
        val sessionInfo = SessionInfo(sessionId, config).also {
            lastSessionInfo = it
        }

        webSocket = client.newWebSocket(buildRequest(sessionInfo), wsListener)

    }

    private fun buildRequest(info: SessionInfo): Request {
        val (sessionId, config) = info
        return Request.Builder()
            .url("$WS_BASE_URL/ws/${sessionId}?platform=mobile&" +
                    "use_search=${config.useSearch}" +
                    "&use_quivr=${config.useQuivr}" +
                    "&language=${config.language.raw}" +
                    "&character_id=${config.characterId}" +
                    "&llm_model=${config.llmModel.raw}")
            .build()
    }

    private val wsListener = object : WebSocketListener() {
        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            if (webSocket != this@WSConnection.webSocket) return
            status.set(Status.DISCONNECTED)

        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            if (webSocket != this@WSConnection.webSocket) return
            status.set(Status.DISCONNECTED)
            RLog.e(TAG, "connection failed for: $response", t)
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            if (webSocket != this@WSConnection.webSocket) return

            // todo notice listeners
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            if (webSocket != this@WSConnection.webSocket) return

            // todo notice listeners
        }

        override fun onOpen(webSocket: WebSocket, response: Response) {
            if (webSocket != this@WSConnection.webSocket) return
            status.set(Status.CONNECTED)
        }
    }

    enum class Status {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
    }
}

private typealias SessionInfo = Pair<String, SessionConfig>
