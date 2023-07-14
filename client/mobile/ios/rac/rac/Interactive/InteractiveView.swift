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
    @State var voiceState: VoiceState = .idle
    @StateObject var audioPlayer = AudioPlayer()

    var body: some View {
        VStack(spacing: 0) {

            switch mode {
            case .text:
                ChatMessagesView(messages: $messages,
                                 isExpectingUserInput: .init(get: { voiceState == .idle }, set: { _ in }),
                                 onSendUserMessage: { message in
                    voiceState = .characterSpeaking(characterImageUrl: character?.imageUrl)
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
                                 onUpdateUserMessage: { message in
                    if messages.last?.role == .user {
                        messages[messages.count - 1].content = message
                    } else {
                        messages.append(.init(id: UUID(), role: .user, content: message))
                    }
                },
                                 onSendUserMessage: { message in
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
            // TODO: Allow user to provide first message
            webSocketClient.send(message: "Hi")
            webSocketClient.isInteractiveMode = true
            webSocketClient.onStringReceived = { message in
                if message == "[end]\n" {
                    return
                }
                if messages.last?.role == .assistant {
                    messages[messages.count - 1].content += message
                } else {
                    messages.append(ChatMessage(id: UUID(), role: .assistant, content: message))
                }
                if mode == .voice {
                    voiceState = .characterSpeaking(characterImageUrl: character?.imageUrl)
                }
            }
            webSocketClient.onDataReceived = { data in
                if mode == .voice {
                    voiceState = .characterSpeaking(characterImageUrl: character?.imageUrl)
                    audioPlayer.playAudio(data: data)
                }
            }
        }
        .onDisappear {
            audioPlayer.pauseAudio()
        }
        .onChange(of: voiceState) { newValue in
            if newValue == .listeningToUser {
                audioPlayer.pauseAudio()
            }
        }
        .onChange(of: mode) { newValue in
            if mode == .text {
                audioPlayer.pauseAudio()
                voiceState = .idle
            }
        }
        .onChange(of: audioPlayer.isPlaying) { newValue in
            if !newValue, case .characterSpeaking = voiceState {
                voiceState = .idle
            }
        }
    }
}

struct InteractiveView_Previews: PreviewProvider {
    static var previews: some View {
        InteractiveView(webSocketClient: WebSocketClient(),
                        character: .init(id: 0, name: "Name", description: "Description", imageUrl: nil),
                        onExit: {})
    }
}
