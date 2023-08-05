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
    case characterSpeaking(characterImageUrl: URL?, thinking: Bool)
    case listeningToUser

    var displayText: String {
        switch self {
        case .idle(let streamingEnded):
            return streamingEnded ? "Talk to me" : "Receiving..."
        case .characterSpeaking(_, let thinking):
            return thinking ? "Thinking..." : "Talking"
        case .listeningToUser:
            return "Listening"
        }
    }

    var isSpeaking: Bool {
        switch self {
        case .characterSpeaking(_, let thinking):
            return !thinking
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
        case .characterSpeaking(let characterImageUrl, _):
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

    func next(characterImageUrl: URL?, streamingEnded: Bool) -> VoiceState {
        switch self {
        case .idle(let streamingEnded):
            return streamingEnded ? .listeningToUser : self
        case .listeningToUser:
            return .characterSpeaking(characterImageUrl: characterImageUrl, thinking: true)
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
    let character: CharacterOption
    @Binding var messages: [ChatMessage]
    @Binding var state: VoiceState
    @Binding var audioPlaying: Data?
    @StateObject var speechRecognizer: SpeechRecognizer

    @State private var isInputUpdated: Bool = true
    @State private var timer: Timer? = nil

    let onUpdateUserMessage: (String) -> Void
    let onSendUserMessage: (String) -> Void
    let onTapVoiceButton: () -> Void

    struct ManipulationState: Equatable {
        var translation: Vector3D
        var scale: Size3D
        var rotation: Rotation3D
    }
    var manipulationState: GestureState<ManipulationState> = .init(initialValue: .init(translation: .zero, scale: .one, rotation: .identity))

    // Gesture combining dragging, magnification, and 3D rotation all at once.
    var manipulationGesture: some Gesture<AffineTransform3D> {
        DragGesture()
            .simultaneously(with: MagnifyGesture())
            .simultaneously(with: RotateGesture3D())
            .map { gesture in
                let (translation, scale, rotation) = gesture.components()

                return AffineTransform3D(
                    scale: scale,
                    rotation: rotation,
                    translation: translation
                )
            }
    }

    var body: some View {
        VStack(spacing: 50) {
#if os(xrOS)
            Color.clear
                .overlay {
                    ItemView(item: .robot_test)
                        .dragRotation(yawLimit: .degrees(45), pitchLimit: .degrees(45))
                        .offset(y: 100)
                        .offset(z: modelDepth)
                }
//                .scaleEffect(manipulationState.wrappedValue.scale)
//                .rotation3DEffect(manipulationState.wrappedValue.rotation)
//                .offset(x: manipulationState.wrappedValue.translation.x,
//                        y: manipulationState.wrappedValue.translation.y
//                )
//                .offset(z: manipulationState.wrappedValue.translation.z)
//            //                        .animation(.spring, value: $manipulationState)
//                .gesture(manipulationGesture.updating(manipulationState) { value, state, _ in
//                    state.rotation = value.rotation ?? .zero
//                    state.translation = value.translation
//                    state.scale = value.scale
//                })
//                .offset(z: modelDepth)
#endif

            ScrollViewReader { scrollView in
                List {
                    switch state {
                    case .characterSpeaking(_, true), .idle:
                        if let lastUserMessage = messages.last(where: { message in
                            message.role == .user
                        }) {
                            UserMessage(message: lastUserMessage.content)
                                .listRowSeparator(.hidden)
//                                .listRowBackground(Constants.realBlack)
                                .id(0)
                        }
                        if messages.last?.role == .assistant, let lastCharacterMessage = messages.last {
                            CharacterMessage(message: lastCharacterMessage.content)
                                .listRowSeparator(.hidden)
//                                .listRowBackground(Constants.realBlack)
                                .id(1)
                        }
                    case .listeningToUser, .characterSpeaking(_, false):
                        if let lastCharacterMessage = messages.last(where: { message in
                            message.role == .assistant
                        }) {
                            CharacterMessage(message: lastCharacterMessage.content)
                                .listRowSeparator(.hidden)
//                                .listRowBackground(Constants.realBlack)
                                .id(1)
                        }

                        if messages.last?.role == .user, let lastUserMessage = messages.last {
                            UserMessage(message: lastUserMessage.content)
                                .listRowSeparator(.hidden)
//                                .listRowBackground(Constants.realBlack)
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
//                .if(state.isSpeaking, transform: { view in
//                    view.mask(
//                        LinearGradient(
//                            gradient: Gradient(
//                                colors: [Constants.realBlack, Constants.realBlack, .clear]
//                            ),
//                            startPoint: .top,
//                            endPoint: .bottom
//                        )
//                    )
//                })
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
                        .hoverEffect()
                        .cornerRadius(40)
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
#if os(xrOS)
                .buttonBorderShape(.circle)
#else
                .buttonBorderShape(.roundedRectangle(radius: 40))
#endif

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
                        startSpeechRecognition(audioPlaying: audioPlaying)
                    }
                default:
                    stopSpeechRecognition()
                }
            } else {
                switch newValue {
                case .listeningToUser:
                    startSpeechRecognition(audioPlaying: audioPlaying)
                default:
                    stopSpeechRecognition()
                }
            }
        }
        .onChange(of: audioPlaying) { newValue in
            if let newValue, case .characterSpeaking = state, openMic {
                startSpeechRecognition(audioPlaying: newValue)
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
                state = .characterSpeaking(characterImageUrl: character.imageUrl, thinking: true)
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
            .repeatForever(autoreverses: false)
        ) {
            ripple1Size = 200
            ripple2Size = 200
        }

        withAnimation(
            .easeOut(duration: 0.6)
            .repeatForever(autoreverses: false)
            .delay(0.2)
        ) {
            ripple2Size = 300
        }

        withAnimation(
            .easeIn(duration: 0.6)
            .repeatForever(autoreverses: false)
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

    private func startSpeechRecognition(audioPlaying: Data?) {
        speechRecognizer.startTranscribing(audioPlaying: audioPlaying)
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
                         character: .init(id: "god",
                                          name: "Mythical god",
                                          description: "Rogue",
                                          imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!,
                                          authorName: "",
                                          source: "default"),
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
                         audioPlaying: .constant(nil),
                         speechRecognizer: SpeechRecognizer(),
                         onUpdateUserMessage: { _ in },
                         onSendUserMessage: { _ in },
                         onTapVoiceButton: { })
        .preferredColorScheme(.dark)
        .frame(height: 400)
    }
}

// Helper for extracting translation, magnification, and rotation.
extension SimultaneousGesture<
    SimultaneousGesture<DragGesture, MagnifyGesture>,
    RotateGesture3D>.Value {
    func components() -> (Vector3D, Size3D, Rotation3D) {
        let translation = self.first?.first?.translation3D ?? .zero
        let magnification = self.first?.second?.magnification ?? 1
        let size = Size3D(width: magnification, height: magnification, depth: magnification)
        let rotation = self.second?.rotation ?? .identity
        return (translation, size, rotation)
    }
}
