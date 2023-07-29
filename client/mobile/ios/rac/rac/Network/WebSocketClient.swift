//
//  WebSocketClient.swift
//  rac
//
//  Created by ZongZiWang on 7/13/23.
//

import AVFoundation
import Combine
import Foundation
import SwiftUI

//let serverUrl: URL = URL(string: "http://127.0.0.1:8000/")!
let serverUrl: URL = URL(string: "https://api.realchar.ai/")!

enum WebSocketError: Error {
    case disconnected
}

protocol WebSocket: NSObject, ObservableObject {
    var status: WebSocketConnectionStatus { get set }
    var isInteractiveMode: Bool { get set }
    var onConnectionChanged: ((WebSocketConnectionStatus) -> Void)? { get set }
    var onStringReceived: ((String) -> Void)? { get set }
    var onDataReceived: ((Data) -> Void)? { get set }
    var onErrorReceived: ((Error) -> Void)? { get set }
    func connectSession(languageOption: LanguageOption, llmOption: LlmOption, characterId: String, userId: String?, token: String?)
    func reconnectSession()
    func closeSession()
    func send(message: String)
}

enum WebSocketConnectionStatus {
    case disconnected, connecting, connected
}

class WebSocketClient: NSObject, WebSocket, URLSessionWebSocketDelegate {

    private var webSocket: URLSessionWebSocketTask!
    var status: WebSocketConnectionStatus = .connected {
        didSet {
            onConnectionChanged?(status)
        }
    }

    var isInteractiveMode: Bool = false

    private lazy var session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())

    private var lastUsedLanguageOption: LanguageOption = .english
    private var lastUsedLlmOption: LlmOption = .gpt35
    private var lastUsedCharacterId: String = ""
    private var lastUsedUserId: String? = nil
    private var lastUsedToken: String? = nil
    private var lastConnectingDate: Date? = nil

    var onConnectionChanged: ((WebSocketConnectionStatus) -> Void)?

    private var pendingStrMessages: [String] = []
    var onStringReceived: ((String) -> Void)? {
        didSet {
            if !pendingStrMessages.isEmpty, let onStringReceived {
                for stringMessage in pendingStrMessages {
                    onStringReceived(stringMessage)
                }
                pendingStrMessages.removeAll()
            }
        }
    }

    private var pendingData: [Data] = []
    var onDataReceived: ((Data) -> Void)? {
        didSet {
            if !pendingData.isEmpty, let onDataReceived {
                for data in pendingData {
                    onDataReceived(data)
                }
                pendingData.removeAll()
            }
        }
    }

    private var lastError: Error? = nil
    var onErrorReceived: ((Error) -> Void)? = nil

    override init() {
        super.init()
    }

    func connectSession(languageOption: LanguageOption, llmOption: LlmOption, characterId: String, userId: String?, token: String?) {
        lastUsedLanguageOption = languageOption
        lastUsedLlmOption = llmOption
        lastUsedCharacterId = characterId
        // TODO: Use userId once it's ready
        let clientId = String(Int.random(in: 0...1010000000))
        lastUsedUserId = clientId
        lastUsedToken = token
        connectWebSocket(session: session,
                         serverUrl: serverUrl,
                         characterId: characterId,
                         languageOption: languageOption,
                         llmOption: llmOption,
                         clientId: clientId,
                         token: token)
    }

    func reconnectSession() {
        connectWebSocket(session: session,
                         serverUrl: serverUrl,
                         characterId: lastUsedCharacterId,
                         languageOption: lastUsedLanguageOption,
                         llmOption: lastUsedLlmOption,
                         clientId: lastUsedUserId ?? String(Int.random(in: 0...1010000000)),
                         token: lastUsedToken)
    }

    private func connectWebSocket(session: URLSession,
                                  serverUrl: URL,
                                  characterId: String,
                                  languageOption: LanguageOption,
                                  llmOption: LlmOption,
                                  clientId: String,
                                  token: String?) {
        pendingStrMessages.removeAll()
        pendingData.removeAll()
        status = .connecting
        lastConnectingDate = Date()

        let wsScheme = serverUrl.scheme == "https" ? "wss" : "ws"
        let wsPath = "\(wsScheme)://\(serverUrl.host ?? "")\(serverUrl.port.flatMap { ":\($0)" } ?? "")/ws/\(clientId)?platform=mobile&language=\(languageOption.rawValue)&character_id=\(characterId)&llm_model=\(llmOption.rawValue)&token=\(token ?? "")"
        print("Connecting websocket: \(wsPath)")
        webSocket = session.webSocketTask(with: URL(string: wsPath)!)
        webSocket.resume()
        receive()
    }

    func closeSession() {
        webSocket?.cancel()
    }

    func receive() {
        guard let webSocket else {
            onError(WebSocketError.disconnected)
            return
        }

        webSocket.receive(completionHandler: { [weak self] result in
            guard let self else { return }

            var retry = true

            switch result {
            case .success(let message):

                switch message {

                case .data(let data):
                    print("Data received: \(data)")
                    if self.onDataReceived == nil {
                        self.pendingData.append(data)
                    } else {
                        self.onDataReceived?(data)
                    }

                case .string(let strMessage):
                    print("String received: \(strMessage)")
                    if let options = self.parsedAsCharacterOptions(message: strMessage) {
                        // Do not use character options from websocket.
                    } else {
                        if self.onStringReceived == nil {
                            self.pendingStrMessages.append(strMessage)
                        } else {
                            self.onStringReceived?(strMessage)
                        }
                    }

                default:
                    break
                }

            case .failure(let error):
                onError(error)
                retry = false
            }

            if retry {
                // Creates the Recurrsion
                self.receive()
            }
        })
    }

    func send(message: String) {
        print("Send websocket string: \(message)")
        guard let webSocket else {
            onError(WebSocketError.disconnected)
            return
        }

        webSocket.send(.string(message)) { error in
            if let error {
                print(error)
            }
        }
    }

    func urlSession(_ session: URLSession,
                    webSocketTask: URLSessionWebSocketTask,
                    didOpenWithProtocol protocol: String?) {
        print("Connected to server")
        status = .connected
    }

    func urlSession(_ session: URLSession,
                    webSocketTask: URLSessionWebSocketTask,
                    didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
                    reason: Data?) {
        print("Disconnect from Server \(String(describing: reason))")
        status = .disconnected
    }

    // MARK: - Private

    private func parsedAsCharacterOptions(message: String) -> [CharacterOption]? {
        var options: [CharacterOption] = []
        // TODO: Parsing logic relies on loose contract
        if message.contains("Select your character") {
            message.split(separator: "\n").forEach { line in
                if isFirstCharactersNumber(String(line), count: 1) {
                    if let characterName = line.split(separator: "-").last?.trimmingPrefix(" ") {
                        // TODO: ID and description here are temporary
                        options.append(.init(id: String(options.count + 1),
                                             name: String(characterName),
                                             description: "",
                                             imageUrl: mapCharacterToImageUrl(characterName: String(characterName)),
                                             authorName: "",
                                             source: "default"))
                    }
                }
            }
        }
        return options.isEmpty ? nil : options
    }

    private func mapCharacterToImageUrl(characterName: String) -> URL? {
        // TODO: Get url from server
        if characterName.contains("Elon") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/elon.jpeg")!
        } else if characterName.contains("Character") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!
        } else if characterName.contains("Loki") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!
        } else if characterName.contains("Pi") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/pi.jpeg")!
        } else if characterName.contains("Raiden") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!
        }
        return URL(string: "https://storage.googleapis.com/assistly/static/realchar/\(characterName.replacingOccurrences(of: " ", with: "_").lowercased()).jpg")
    }

    private func isFirstCharactersNumber(_ string: String, count: Int) -> Bool {
        guard count > 0 && count <= string.count else {
            return false
        }

        let characterSet = CharacterSet.decimalDigits
        let firstCharacters = string.prefix(count)

        return firstCharacters.allSatisfy { characterSet.contains(UnicodeScalar(String($0))!) }
    }

    private func onError(_ error: Error) {
        print("WebSocket Error: \(error)")
        if self.onErrorReceived == nil {
            self.lastError = error
        } else {
            self.onErrorReceived?(error)
        }
        status = .disconnected

        if let lastConnectingDate, Date().timeIntervalSince(lastConnectingDate) < TimeInterval(60) {
            // If last connecting time is less than 1 min, do no retry automatically.
            return
        } else {
            reconnectSession()
        }
    }
}

class MockWebSocket: NSObject, WebSocket {

    var status: WebSocketConnectionStatus = .disconnected

    var isInteractiveMode: Bool = false

    var onConnectionChanged: ((WebSocketConnectionStatus) -> Void)?

    var onStringReceived: ((String) -> Void)?

    var onDataReceived: ((Data) -> Void)?

    var onErrorReceived: ((Error) -> Void)?

    func connectSession(languageOption: LanguageOption, llmOption: LlmOption, characterId: String, userId: String?, token: String?) {
    }

    func reconnectSession() {
    }

    func closeSession() {
    }

    func send(message: String) {
    }
}
