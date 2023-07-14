//
//  InteractiveView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI
import AVFoundation

enum InteractiveMode {
    case voice, text
}

struct InteractiveView: View {

    struct Constants {
        static let realOrange500: Color = Color(red: 0.95, green: 0.29, blue: 0.16)
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
    }

    let webSocketClient: WebSocketClient
    let character: CharacterOption?
    let onExit: () -> Void
    @State var messages: [ChatMessage] = []
    @State var mode: InteractiveMode = .voice
    @State var voiceState: VoiceState = .characterSpeaking(characterImageUrl: URL(string: "TODO"))
    @StateObject var audioPlayer = AudioPlayer()

    var body: some View {
        VStack(spacing: 0) {

            switch mode {
            case .text:
                ChatMessagesView(messages: $messages,
                                 isExpectingUserInput: .init(get: { voiceState == .idle }, set: { _ in }),
                                 onSendUserMessage: { message in
                    voiceState = .characterSpeaking(characterImageUrl: URL(string: "TODO"))
                   messages.append(.init(id: UUID(), role: .user, content: message))
                   webSocketClient.send(message: message)
                }
                )
                    .padding(.horizontal, 48)
                    .preferredColorScheme(.dark)
                    .background(Constants.realBlack)
            case .voice:
                VoiceMessageView(messages: $messages,
                                 state: $voiceState,
                                 onSendUserMessage: { message in
                    messages.append(.init(id: UUID(), role: .user, content: message))
                    webSocketClient.send(message: message)
                },
                                 onTapVoiceButton: {
                    voiceState = voiceState.next
                })
                .padding(.horizontal, 48)
                .preferredColorScheme(.dark)
                .background(Constants.realBlack)
            }

            HStack(alignment: .center, spacing: 28) {
                Button {
                    onExit()
                } label: {
                    Image("power")
                        .tint(.white)
                }
                .padding(12)
                .frame(width: 60, height: 60, alignment: .center)
                .background(Constants.realOrange500)
                .cornerRadius(50)
                .overlay(
                  RoundedRectangle(cornerRadius: 50)
                    .inset(by: -1)
                    .stroke(Constants.realOrange500, lineWidth: 2)
                )

                Button {
                    switch mode {
                    case .text:
                        mode = .voice
                    case .voice:
                        mode = .text
                    }
                } label: {
                    switch mode {
                    case .text:
                        Image("voice")
                            .tint(.white)
                    case .voice:
                        Image("message")
                            .tint(.white)
                    }
                }
                .padding(12)
                .frame(width: 60, height: 60, alignment: .center)
                .background(Color(red: 0.74, green: 0.81, blue: 1).opacity(0.1))
                .cornerRadius(50)
                .overlay(
                  RoundedRectangle(cornerRadius: 50)
                    .inset(by: -1)
                    .stroke(Color(red: 0.74, green: 0.81, blue: 1).opacity(0), lineWidth: 2)
                )
            }
            .padding(.horizontal, 60)
            .padding(.top, 20)
            .padding(.bottom, 40)
            .frame(maxWidth: .infinity)
            .background(Constants.realBlack)
        }
        .background(Constants.realBlack)
        .onAppear {
            // TODO: Always use "2" text chat as we do speech recognition locally.
            webSocketClient.send(message: "2")
            webSocketClient.isInteractiveMode = true
            webSocketClient.onStringReceived = { message in
                if message == "[end]\n" {
                    voiceState = .idle
                    return
                }

                voiceState = .characterSpeaking(characterImageUrl: URL(string: "TODO"))
                if messages.last?.role == .assistant {
                    messages[messages.count - 1].content += message
                } else {
                    messages.append(ChatMessage(id: UUID(), role: .assistant, content: message))
                }
            }
            webSocketClient.onDataReceived = { data in
                // TODO: Currently showing error: The operation couldn’t be completed. (OSStatus error 1954115647.)
                audioPlayer.playAudio(data: data)
            }
        }
        .onChange(of: voiceState) { newValue in
            if newValue == .idle || newValue == .listeningToUser {
                audioPlayer.pauseAudio()
            }
        }
    }
}

struct InteractiveView_Previews: PreviewProvider {
    static var previews: some View {
        InteractiveView(webSocketClient: WebSocketClient(),
                        character: .init(id: 0, name: "Name", description: "Description"),
                        onExit: {})
    }
}
