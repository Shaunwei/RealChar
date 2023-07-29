//
//  InteractiveView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI
import AVFoundation
import CoreHaptics

enum InteractiveMode {
    case voice, text
}

struct InteractiveView: View {
    @EnvironmentObject private var preferenceSettings: PreferenceSettings

    struct Constants {
        static let realOrange500: Color = Color(red: 0.95, green: 0.29, blue: 0.16)
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
        static let greeting: String = "Hi, my friend, what brings you here today?"
        static let serverError: String = "Disconnected, retry by tapping the red button and restart."
    }

    let webSocket: any WebSocket
    let character: CharacterOption
    let openMic: Bool
    let hapticFeedback: Bool
    let onExit: () -> Void
    @Binding var messages: [ChatMessage]
    @State var mode: InteractiveMode = .voice
    @State var voiceState: VoiceState = .idle(streamingEnded: true)
    @State var streamingEnded = true
    @StateObject var audioPlayer = AudioPlayer()
    @State var engine: CHHapticEngine?

    var body: some View {
        VStack(spacing: 0) {

            switch mode {
            case .text:
                ChatMessagesView(messages: $messages,
                                 isExpectingUserInput: .init(get: { voiceState == .idle(streamingEnded: true) }, set: { _ in }),
                                 onSendUserMessage: { message in
                    voiceState = .idle(streamingEnded: false)
                    messages.append(.init(id: UUID(), role: .user, content: message))
                    webSocket.send(message: message)
                    complexSuccess()
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
                    webSocket.send(message: message)
                    simpleSuccess()
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
            prepareHaptics()
            webSocket.send(message: "[!USE_SEARCH]\(preferenceSettings.useSearch)")
            webSocket.onStringReceived = { message in
                guard !(openMic && voiceState == .listeningToUser) else { return }

                if message == "[end]\n" {
                    if case .idle(let streamingEnded) = voiceState, !streamingEnded {
                        voiceState = .idle(streamingEnded: true)
                    }
                    streamingEnded = true
                    simpleSuccess()
                    return
                }

                if messages.last?.role == .assistant {
                    if messages.last?.content != Constants.serverError {
                        messages[messages.count - 1].content += message
                    } else {
                        messages[messages.count - 1].content = message
                    }
                    lightHapticFeedback()
                } else {
                    if mode == .voice {
                        voiceState = .characterSpeaking(characterImageUrl: character.imageUrl)
                    }
                    streamingEnded = false
                    messages.append(ChatMessage(id: UUID(), role: .assistant, content: message))
                    lightHapticFeedback()
                }
            }
            webSocket.onDataReceived = { data in
                if mode == .voice, case .characterSpeaking = voiceState {
                    audioPlayer.playAudio(data: data)
                }
            }
            webSocket.onErrorReceived = { _ in
                if messages.last?.content != Constants.serverError {
                    messages.append(.init(id: UUID(), role: .assistant, content: Constants.serverError))
                    simpleError()
                }
            }
        }
        .onDisappear {
            voiceState = .idle(streamingEnded: true)
            audioPlayer.pauseAudio()
            webSocket.onStringReceived = nil
            webSocket.onDataReceived = nil
            webSocket.onErrorReceived = nil
        }
        .onChange(of: voiceState) { newValue in
            if newValue == .listeningToUser {
                streamingEnded = true
                audioPlayer.pauseAudio()
            }
        }
        .onChange(of: mode) { newValue in
            switch mode {
            case .text:
                voiceState = .idle(streamingEnded: streamingEnded)
                audioPlayer.pauseAudio()
            case .voice:
                if voiceState == .idle(streamingEnded: false) {
                    voiceState = .characterSpeaking(characterImageUrl: character.imageUrl)
                }
            }
        }
        .onChange(of: audioPlayer.isPlaying) { newValue in
            if !newValue && streamingEnded, case .characterSpeaking = voiceState {
                if openMic {
                    voiceState = .listeningToUser
                } else {
                    voiceState = .idle(streamingEnded: true)
                }
            }
        }
    }

    private func simpleSuccess() {
        guard hapticFeedback else { return }
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    private func simpleError() {
        guard hapticFeedback else { return }
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
    }

    private func prepareHaptics() {
        guard hapticFeedback, CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }

        do {
            engine = try CHHapticEngine()
            try engine?.start()
        } catch {
            print("There was an error creating the engine: \(error.localizedDescription)")
        }
    }

    private func complexSuccess() {
        // make sure that the device supports haptics
        guard hapticFeedback, CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        var events = [CHHapticEvent]()

        // create one intense, sharp tap
        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: 1)
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 1)
        let event = CHHapticEvent(eventType: .hapticTransient, parameters: [intensity, sharpness], relativeTime: 0)
        events.append(event)

        // convert those events into a pattern and play it immediately
        do {
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine?.makePlayer(with: pattern)
            try player?.start(atTime: 0)
        } catch {
            print("Failed to play pattern: \(error.localizedDescription).")
        }
    }

    private func lightHapticFeedback() {
        // make sure that the device supports haptics
        guard hapticFeedback, CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        var events = [CHHapticEvent]()

        for i in stride(from: 0, to: 0.2, by: 0.2) {
            let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(0.5))
            let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: Float(0.5))
            let event = CHHapticEvent(eventType: .hapticTransient, parameters: [intensity, sharpness], relativeTime: i)
            events.append(event)
        }

        // convert those events into a pattern and play it immediately
        do {
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine?.makePlayer(with: pattern)
            try player?.start(atTime: 0)
        } catch {
            print("Failed to play pattern: \(error.localizedDescription).")
        }
    }
}

struct InteractiveView_Previews: PreviewProvider {
    static var previews: some View {
        InteractiveView(webSocket: MockWebSocket(),
                        character: .init(id: "id",
                                         name: "Name",
                                         description: "Description",
                                         imageUrl: nil,
                                         authorName: "",
                                         source: "default"),
                        openMic: false,
                        hapticFeedback: false,
                        onExit: {},
                        messages: .constant([]))
    }
}
