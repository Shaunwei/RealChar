//
//  VoiceMessageView.swift
//  rac
//
//  Created by ZongZiWang on 7/10/23.
//

import SwiftUI
import CachedAsyncImage

enum VoiceState: Equatable {
    case idle(streamingEnded: Bool)
    case characterSpeaking(characterImageUrl: URL?)
    case listeningToUser

    var displayText: String {
        switch self {
        case .idle(let streamingEnded):
            return streamingEnded ? "Talk to me" : "Receiving..."
        case .characterSpeaking:
            return "Talking"
        case .listeningToUser:
            return "Listening"
        }
    }

    var isSpeaking: Bool {
        switch self {
        case .characterSpeaking:
            return true
        default:
            return false
        }
    }

    var isDisabled: Bool {
        return self == .idle(streamingEnded: false)
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

    func next(streamingEnded: Bool) -> VoiceState {
        switch self {
        case .idle(let streamingEnded):
            return streamingEnded ? .listeningToUser : self
        case .listeningToUser:
            return .idle(streamingEnded: true)
        case .characterSpeaking:
            return .idle(streamingEnded: streamingEnded)
        }
    }
}

struct VoiceMessageView: View {

    struct Constants {
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
        static let realBlue500: Color = Color(red: 0.4, green: 0.52, blue: 0.83)
    }

    let openMic: Bool
    @Binding var messages: [ChatMessage]
    @Binding var state: VoiceState
    @StateObject var speechRecognizer: SpeechRecognizer

    @State private var isInputUpdated: Bool = true
    @State private var timer: Timer? = nil

    let onUpdateUserMessage: (String) -> Void
    let onSendUserMessage: (String) -> Void
    let onTapVoiceButton: () -> Void

    var body: some View {
        VStack(spacing: 50) {
            ScrollViewReader { scrollView in
                List {
                    switch state {
                    case .characterSpeaking, .idle:
                        if let lastUserMessage = messages.last(where: { message in
                            message.role == .user
                        }) {
                            UserMessage(message: lastUserMessage.content)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Constants.realBlack)
                                .id(0)
                        }
                        if messages.last?.role == .assistant, let lastCharacterMessage = messages.last {
                            CharacterMessage(message: lastCharacterMessage.content)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Constants.realBlack)
                                .id(1)
                        }
                    case .listeningToUser:
                        if let lastCharacterMessage = messages.last(where: { message in
                            message.role == .assistant
                        }) {
                            CharacterMessage(message: lastCharacterMessage.content)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Constants.realBlack)
                                .id(1)
                        }

                        if messages.last?.role == .user, let lastUserMessage = messages.last {
                            UserMessage(message: lastUserMessage.content)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Constants.realBlack)
                                .id(0)
                        }
                    }
                }
                .scrollIndicators(.hidden)
                .listStyle(.inset)
                .scrollContentBackground(.hidden)
                .onAppear {
                    scrollView.scrollTo(messages.last?.role == .user ? 0 : 1, anchor: .bottomTrailing)
                }
                .onChange(of: messages.last?.content) { newValue in
                    // TODO: Debounce the onChange call
                    withAnimation {
                        scrollView.scrollTo(messages.last?.role == .user ? 0 : 1, anchor: .bottomTrailing)
                    }
                }
                .onChange(of: state) { newValue in
                    withAnimation {
                        scrollView.scrollTo(messages.last?.role == .user ? 0 : 1, anchor: .bottomTrailing)
                    }
                }
                .if(state.isSpeaking, transform: { view in
                    view.mask(
                        LinearGradient(
                            gradient: Gradient(
                                colors: [Constants.realBlack, Constants.realBlack, .clear]
                            ),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                })
            }

            VStack(spacing: 24) {
                Button {
                    onTapVoiceButton()
                } label: {
                    state.image
                        .tint(.white)
                        .padding(12)
                        .frame(width: 80, height: 80, alignment: .center)
                        .background(Constants.realBlue500)
                        .opacity(state.isDisabled ? 0.25 : 1.0)
                        .disabled(state.isDisabled)
                        .cornerRadius(50)
                        .onTapGesture(perform: onTapVoiceButton)
                        .background {
                            if state.isSpeaking || state == .listeningToUser {
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
                }

                Text(state.displayText)
                    .font(Font.custom("Prompt", size: 16))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
            }
            .padding(.bottom, 25)
        }
        .frame(maxHeight: .infinity)
        .onChange(of: state) { [oldValue = state] newValue in
            print("DEBUG: voiceState: \(state)")
            if openMic {
                switch newValue {
                case .characterSpeaking, .listeningToUser:
                    if !oldValue.isSpeaking {
                        startSpeechRecognition()
                    }
                default:
                    stopSpeechRecognition()
                }
            } else {
                switch newValue {
                case .listeningToUser:
                    startSpeechRecognition()
                default:
                    stopSpeechRecognition()
                }
            }
        }
        .onChange(of: speechRecognizer.transcript) { newValue in
            if !newValue.isEmpty {
                print("DEBUG: onUpdateUserMessage \(newValue)")
                onUpdateUserMessage(newValue)
                if openMic {
                    isInputUpdated = true
                    startTimer()
                }
            }
        }
        .onChange(of: isInputUpdated) { newValue in
            if openMic && state == .listeningToUser && !newValue {
                state = .idle(streamingEnded: true)
                stopSpeechRecognition()
            }
        }
        .onAppear {
            if openMic {
                startTimer()
                SpeechRecognizer.defaultToSpeaker = false
            }
        }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: false) { _ in
            isInputUpdated = false
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
        ripple2Size = 100
    }

    private func startSpeechRecognition() {
        speechRecognizer.startTranscribing()
    }

    private func stopSpeechRecognition() {
        speechRecognizer.stopTranscribing()
        if !speechRecognizer.transcript.isEmpty {
            print("DEBUG: onSendUserMessage \(speechRecognizer.transcript)")
            onSendUserMessage(speechRecognizer.transcript)
            speechRecognizer.transcript = ""
            speechRecognizer.resetTranscript()
        }
    }
}

struct VoiceMessageView_Previews: PreviewProvider {
    static var previews: some View {
        VoiceMessageView(openMic: false,
                         messages: .constant([
            ChatMessage(id: UUID(), role: .assistant, content: "Hello stranger, what’s your name?"),
            ChatMessage(id: UUID(), role: .user, content: "Hi 👋 my name is Karina"),
            ChatMessage(id: UUID(), role: .assistant, content: "Greetings, Karina. What can I do for you?"),
            ChatMessage(id: UUID(), role: .user, content: "What’s your name?"),
            ChatMessage(id: UUID(), role: .assistant, content: "I have no name. I am Realtime’s AI soul. I exist in the digital, but if I had to have a name, I would pick Ray 😉"),
            ChatMessage(id: UUID(), role: .user, content: "Ray is a nice name!"),
            ChatMessage(id: UUID(), role: .assistant, content: "Well thank you, Karina! I like your nam too. Now tell me, where do you live?")
        ]),
                         state: .constant(.idle(streamingEnded: true)),
                         speechRecognizer: SpeechRecognizer(),
                         onUpdateUserMessage: { _ in },
                         onSendUserMessage: { _ in },
                         onTapVoiceButton: { })
        .preferredColorScheme(.dark)
        .frame(height: 400)
    }
}
