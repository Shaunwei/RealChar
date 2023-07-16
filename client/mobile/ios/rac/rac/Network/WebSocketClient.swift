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
let serverUrl: URL = URL(string: "https://realchar.ai/")!

class WebSocketClient: NSObject, URLSessionWebSocketDelegate, ObservableObject {

    private var webSocket: URLSessionWebSocketTask!
    @Published var isConnected: Bool = false
    @Published var isInteractiveMode: Bool = false

    var lastStrMessage: String? = nil
    var onStringReceived: ((String) -> Void)? {
        didSet {
            if let lastStrMessage, let onStringReceived {
                onStringReceived(lastStrMessage)
                self.lastStrMessage = nil
            }
        }
    }

    var lastCharacterOptions: [CharacterOption]? = nil
    var onCharacterOptionsReceived: (([CharacterOption]) -> Void)? {
        didSet {
            if let lastCharacterOptions, let onCharacterOptionsReceived {
                onCharacterOptionsReceived(lastCharacterOptions)
                self.lastCharacterOptions = nil
            }
        }
    }

    var lastData: Data? = nil
    var onDataReceived: ((Data) -> Void)? {
        didSet {
            if let lastData, let onDataReceived {
                onDataReceived(lastData)
                self.lastData = nil
            }
        }
    }

    override init() {
        super.init()
    }

    func connectSession() {
        let clientId = Int.random(in: 0...1010000)
        let wsScheme = serverUrl.scheme == "https" ? "wss" : "ws"
        let wsPath = "\(wsScheme)://\(serverUrl.host ?? "")\(serverUrl.port.flatMap { ":\($0)" } ?? "")/ws/\(clientId)"
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
        webSocket = session.webSocketTask(with: URL(string: wsPath)!)
        webSocket.resume()
    }

    func closeSession() {
        webSocket.cancel()
    }

    func receive() {
        webSocket.receive(completionHandler: { [weak self] result in
            guard let self else { return }

            var retry = true

            switch result {
            case .success(let message):

                switch message {

                case .data(let data):
                    print("Data received: \(data)")
                    if self.onDataReceived == nil {
                        self.lastData = data
                    } else {
                        self.onDataReceived?(data)
                    }

                case .string(let strMessage):
                    print("String received: \(strMessage)")
                    if let options = self.parsedAsCharacterOptions(message: strMessage) {
                        if self.onCharacterOptionsReceived == nil {
                            self.lastCharacterOptions = options
                        } else {
                            self.onCharacterOptionsReceived?(options)
                        }
                    } else {
                        if self.onStringReceived == nil {
                            self.lastStrMessage = strMessage
                        } else {
                            self.onStringReceived?(strMessage)
                        }
                    }

                default:
                    break
                }

            case .failure(let error):
                print("Error Receiving \(error)")
                retry = false
                self.connectSession()
            }

            if retry {
                // Creates the Recurrsion
                self.receive()
            }
        })
    }

    func send(message: String) {
        print("Send websocket string: \(message)")
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
        DispatchQueue.main.async {
            self.isConnected = true
        }
        receive()
        send(message: "mobile")
    }

    func urlSession(_ session: URLSession,
                    webSocketTask: URLSessionWebSocketTask,
                    didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
                    reason: Data?) {
        print("Disconnect from Server \(String(describing: reason))")
        DispatchQueue.main.async {
            self.isConnected = false
        }
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
                        options.append(.init(id: options.count + 1, name: String(characterName), description: "", imageUrl: mapCharacterToImageUrl(characterName: String(characterName))))
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
}
