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
        static let greeting: String = "Hi, my friend, what brings you here today?"
        static let serverError: String = "Disconnected, try again later."
    }

    let webSocketClient: WebSocketClient
    let character: CharacterOption?
    let openMic: Bool
    let onExit: () -> Void
    @Binding var messages: [ChatMessage]
    @State var mode: InteractiveMode = .voice
    @State var voiceState: VoiceState = .idle(streamingEnded: true)
    @State var streamingEnded = true
    @StateObject var audioPlayer = AudioPlayer()

    var body: some View {
        VStack(spacing: 0) {

            switch mode {
            case .text:
                ChatMessagesView(messages: $messages,
                                 isExpectingUserInput: .init(get: { voiceState == .idle(streamingEnded: true) }, set: { _ in }),
                                 onSendUserMessage: { message in
                    voiceState = .idle(streamingEnded: false)
                    messages.append(.init(id: UUID(), role: .user, content: message))
                    webSocketClient.send(message: message)
                })
                    .padding(.horizontal, 48)
                    .preferredColorScheme(.dark)
                    .background(Constants.realBlack)
            case .voice:
                VoiceMessageView(openMic: openMic,
                                 messages: $messages,
                                 state: $voiceState,
                                 onUpdateUserMessage: { message in
                    if messages.last?.role == .user {
                        messages[messages.count - 1].content = message
                    } else {
                        if openMic {
                            voiceState = .listeningToUser
                        }
                        messages.append(.init(id: UUID(), role: .user, content: message))
                    }
                },
                                 onSendUserMessage: { message in
                    webSocketClient.send(message: message)
                },
                                 onTapVoiceButton: {
                    voiceState = voiceState.next(streamingEnded: streamingEnded)
                    if case .idle = voiceState {
                        audioPlayer.pauseAudio()
                    }
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
            if messages.isEmpty {
                // TODO: Allow user to provide first message
                messages.append(.init(id: UUID(), role: .user, content: Constants.greeting))
                webSocketClient.send(message: Constants.greeting)
            }
            webSocketClient.isInteractiveMode = true
            webSocketClient.onStringReceived = { message in
                guard !(openMic && voiceState == .listeningToUser) else { return }

                if message == "[end]\n" {
                    if case .idle(let streamingEnded) = voiceState, !streamingEnded {
                        voiceState = .idle(streamingEnded: true)
                    }
                    streamingEnded = true
                    return
                }

                if messages.last?.role == .assistant {
                    messages[messages.count - 1].content += message
                } else {
                    if mode == .voice {
                        voiceState = .characterSpeaking(characterImageUrl: character?.imageUrl)
                    }
                    streamingEnded = false
                    messages.append(ChatMessage(id: UUID(), role: .assistant, content: message))
                }
            }
            webSocketClient.onDataReceived = { data in
                if mode == .voice, case .characterSpeaking = voiceState {
                    audioPlayer.playAudio(data: data)
                }
            }
            webSocketClient.onCharacterOptionsReceived = { _ in
                if messages.last?.content != Constants.serverError {
                    messages.append(.init(id: UUID(), role: .assistant, content: Constants.serverError))
                }
            }
        }
        .onDisappear {
            audioPlayer.pauseAudio()
        }
        .onChange(of: voiceState) { newValue in
            if newValue == .listeningToUser {
                streamingEnded = true
                audioPlayer.pauseAudio()
            }
        }
        .onChange(of: mode) { newValue in
            if mode == .text {
                voiceState = .idle(streamingEnded: streamingEnded)
                audioPlayer.pauseAudio()
            }
        }
        .onChange(of: audioPlayer.isPlaying) { newValue in
            if !newValue, case .characterSpeaking = voiceState {
                if openMic {
                    voiceState = .listeningToUser
                } else {
                    voiceState = .idle(streamingEnded: true)
                }
            }
        }
    }
}

struct InteractiveView_Previews: PreviewProvider {
    static var previews: some View {
        InteractiveView(webSocketClient: WebSocketClient(),
                        character: .init(id: 0, name: "Name", description: "Description", imageUrl: nil),
                        openMic: false,
                        onExit: {},
                        messages: .constant([]))
    }
}
