//
//  VoiceMessageView.swift
//  rac
//
//  Created by ZongZiWang on 7/10/23.
//

import SwiftUI
import CachedAsyncImage

enum VoiceState: Equatable {
    case idle
    case characterSpeaking(characterImageUrl: URL?)
    case listeningToUser

    var displayText: String {
        switch self {
        case .idle:
            return "Talk to me"
        case .characterSpeaking:
            return "Talking"
        case .listeningToUser:
            return "Listening"
        }
    }

    var image: some View {
        switch self {
        case .idle:
            return AnyView(Image("voice"))
        case .characterSpeaking(let characterImageUrl):
            return AnyView(CachedAsyncImage(url: characterImageUrl) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                case .success(let image):
                    image.resizable()
                default:
                    Image(systemName: "wifi.slash")
                }
            }
                .scaledToFit()
                .frame(width: 80, height: 80)
            )
        case .listeningToUser:
            return AnyView(Image("stop"))
        }
    }

    var next: VoiceState {
        switch self {
        case .idle:
            return .listeningToUser
        case .listeningToUser:
            return .idle
        case .characterSpeaking:
            return .idle
        }
    }
}

struct VoiceMessageView: View {

    struct Constants {
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
        static let realBlue500: Color = Color(red: 0.4, green: 0.52, blue: 0.83)
    }

    @Binding var messages: [ChatMessage]
    @Binding var state: VoiceState
    @StateObject var speechRecognizer = SpeechRecognizer()

    let onUpdateUserMessage: (String) -> Void
    let onSendUserMessage: (String) -> Void
    let onTapVoiceButton: () -> Void

    var body: some View {
        VStack(spacing: 50) {
            List {
                switch state {
                case .characterSpeaking, .idle:
                    if let lastUserMessage = messages.last(where: { message in
                        message.role == .user
                    }) {
                        UserMessage(message: lastUserMessage.content)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Constants.realBlack)
                    }
                    if messages.last?.role == .assistant, let lastCharacterMessage = messages.last {
                        CharacterMessage(message: lastCharacterMessage.content)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Constants.realBlack)
                    }
                case .listeningToUser:
                    if let lastCharacterMessage = messages.last(where: { message in
                        message.role == .assistant
                    }) {
                        CharacterMessage(message: lastCharacterMessage.content)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Constants.realBlack)
                    }

                    if messages.last?.role == .user, let lastUserMessage = messages.last {
                        UserMessage(message: lastUserMessage.content)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Constants.realBlack)
                    }
                }
            }
            .scrollIndicators(.hidden)
            .listStyle(.inset)
            .scrollContentBackground(.hidden)
            .mask(
                LinearGradient(
                    gradient: Gradient(
                        colors: [Constants.realBlack, Constants.realBlack, .clear]
                    ),
                    startPoint: .top,
                    endPoint: .bottom
                )
            )

            VStack(spacing: 24) {
                state.image
                    .tint(.white)
                    .padding(12)
                    .frame(width: 80, height: 80, alignment: .center)
                    .background(Constants.realBlue500)
                    .cornerRadius(50)
                    .onTapGesture(perform: onTapVoiceButton)
                    .background {
                        if state != .idle {
                            Rectangle()
                                .foregroundColor(.clear)
                                .frame(width: ripple2Size, height: ripple2Size)
                                .background(Constants.realBlue500.opacity(0.3))
                                .cornerRadius(ripple2Size / 2)
                                .onAppear {
                                    animate()
                                }
                                .onDisappear() {
                                    disableAnimation()
                                }

                            Rectangle()
                                .foregroundColor(.clear)
                                .frame(width: ripple1Size, height: ripple1Size)
                                .background(Constants.realBlue500.opacity(0.3))
                                .cornerRadius(ripple1Size / 2)

                            Rectangle()
                                .foregroundColor(.clear)
                                .frame(width: 100, height: 100)
                                .background(Constants.realBlue500)
                                .cornerRadius(50)
                        }
                    }

                Text(state.displayText)
                    .font(Font.custom("Prompt", size: 16))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
            }
            .padding(.bottom, 50)
        }
        .frame(maxHeight: .infinity)
        .onChange(of: state) { newValue in
            switch newValue {
            case .listeningToUser:
                speechRecognizer.resetTranscript()
                speechRecognizer.startTranscribing()
            default:
                speechRecognizer.stopTranscribing()
                if !speechRecognizer.transcript.isEmpty {
                    onSendUserMessage(speechRecognizer.transcript)
                    speechRecognizer.resetTranscript()
                }
            }
        }
        .onChange(of: speechRecognizer.transcript) { newValue in
            if !newValue.isEmpty {
                onUpdateUserMessage(newValue)
            }
        }
    }

    @State var ripple1Size: CGFloat = 100
    @State var ripple2Size: CGFloat = 100

    private func animate() {
        withAnimation(
            .linear(duration: 0.6)
            .repeatForever()
        ) {
            ripple1Size = 200
            ripple2Size = 200
        }

        withAnimation(
            .easeOut(duration: 0.6)
            .repeatForever()
            .delay(0.2)
        ) {
            ripple2Size = 300
        }

        withAnimation(
            .easeIn(duration: 0.6)
            .repeatForever()
            .delay(0.4)
        ) {
            ripple1Size = 100
            ripple2Size = 100
        }
    }

    private func disableAnimation() {
        ripple1Size = 100
        ripple2Size = 200
    }
}

struct VoiceMessageView_Previews: PreviewProvider {
    static var previews: some View {
        VoiceMessageView(messages: .constant([
            ChatMessage(id: UUID(), role: .assistant, content: "Hello stranger, what’s your name?"),
            ChatMessage(id: UUID(), role: .user, content: "Hi 👋 my name is Karina"),
            ChatMessage(id: UUID(), role: .assistant, content: "Greetings, Karina. What can I do for you?"),
            ChatMessage(id: UUID(), role: .user, content: "What’s your name?"),
            ChatMessage(id: UUID(), role: .assistant, content: "I have no name. I am Realtime’s AI soul. I exist in the digital, but if I had to have a name, I would pick Ray 😉"),
            ChatMessage(id: UUID(), role: .user, content: "Ray is a nice name!"),
            ChatMessage(id: UUID(), role: .assistant, content: "Well thank you, Karina! I like your nam too. Now tell me, where do you live?")
        ]),
                         state: .constant(.idle),
                         onUpdateUserMessage: { _ in },
                         onSendUserMessage: { _ in },
                         onTapVoiceButton: { })
        .preferredColorScheme(.dark)
        .frame(height: 400)
    }
}
