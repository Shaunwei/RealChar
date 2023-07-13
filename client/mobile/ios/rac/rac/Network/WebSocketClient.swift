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

let serverUrl: URL = URL(string: "http://127.0.0.1:8000/")!

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
        let clientId = Int.random(in: 0...1010000)
        let wsScheme = serverUrl.scheme == "https" ? "wss" : "ws"
        let wsPath = "\(wsScheme)://\(serverUrl.host ?? "")\(serverUrl.port.flatMap { ":\($0)" } ?? "")/ws/\(clientId)"
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
        webSocket = session.webSocketTask(with: URL(string: wsPath)!)
    }

    func connectSession() {
        webSocket.resume()
    }

    func closeSession() {
        webSocket.cancel()
    }

    func receive() {
        webSocket.receive(completionHandler: { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):

                switch message {

                case .data(let data):
                    print("Data received \(data)")
                    if self.onDataReceived == nil {
                        self.lastData = data
                    } else {
                        self.onDataReceived?(data)
                    }

                case .string(let strMessage):
                    print("String received \(strMessage)")
                    if self.onStringReceived == nil {
                        self.lastStrMessage = strMessage
                    } else {
                        self.onStringReceived?(strMessage)
                    }

                default:
                    break
                }

            case .failure(let error):
                print("Error Receiving \(error)")
            }

            // Creates the Recurrsion
            self.receive()
        })
    }

    func send(message: String) {
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
}
