//
//  VoiceMessageView.swift
//  rac
//
//  Created by ZongZiWang on 7/10/23.
//

import SwiftUI

enum VoiceState {
    case idle, characterSpeaking, listeningToUser
}

struct VoiceMessageView: View {

    struct Constants {
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
        static let realBlue500: Color = Color(red: 0.4, green: 0.52, blue: 0.83)
    }

    @Binding var messages: [ChatMessage]
    @State var state: VoiceState = .idle

    var body: some View {
        ZStack {
            List {
                if let lastCharacterMessage = messages.last(where: { message in
                    message.role == .assistant
                }) {
                    CharacterMessage(message: lastCharacterMessage.content)
                        .listRowSeparator(.hidden)
                        .listRowBackground(Constants.realBlack)
                }
            }
            .scrollIndicators(.hidden)
            .listStyle(.inset)
            .scrollContentBackground(.hidden)

            VStack(spacing: 24) {
                Image("voice")
                    .tint(.white)
                    .padding(12)
                    .frame(width: 80, height: 80, alignment: .center)
                    .background(Constants.realBlue500)
                    .cornerRadius(50)

                Text(state == .idle ? "Talk to me" : state == .characterSpeaking ? "Talking" : "Listening")
                  .font(Font.custom("Prompt", size: 16))
                  .multilineTextAlignment(.center)
                  .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
            }
        }
        .frame(maxHeight: .infinity)
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
        ]))
        .preferredColorScheme(.dark)
    }
}
