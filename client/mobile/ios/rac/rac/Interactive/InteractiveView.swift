//
//  InteractiveView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

enum InteractiveMode {
    case voice, text
}

struct InteractiveView: View {

    struct Constants {
        static let realOrange500: Color = Color(red: 0.95, green: 0.29, blue: 0.16)
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
    }

    let character: CharacterOption?
    let onExit: () -> Void
    @State var messages: [ChatMessage] = []
    @State var mode: InteractiveMode = .voice

    var body: some View {
        VStack(spacing: 0) {

            switch mode {
            case .text:
                ChatMessagesView(messages: $messages)
                    .padding(.horizontal, 48)
                    .preferredColorScheme(.dark)
                    .background(Constants.realBlack)
            case .voice:
                VoiceMessageView(messages: $messages, onSendUserMessage: { message in
                    messages.append(.init(id: UUID(), role: .user, content: message))
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
            // TODO: Load messages
            messages = [
                ChatMessage(id: UUID(), role: .assistant, content: "Hello stranger, what’s your name?"),
                ChatMessage(id: UUID(), role: .user, content: "Hi 👋 my name is Karina"),
                ChatMessage(id: UUID(), role: .assistant, content: "Greetings, Karina. What can I do for you?"),
                ChatMessage(id: UUID(), role: .user, content: "What’s your name?"),
                ChatMessage(id: UUID(), role: .assistant, content: "I have no name. I am Realtime’s AI soul. I exist in the digital, but if I had to have a name, I would pick Ray 😉"),
                ChatMessage(id: UUID(), role: .user, content: "Ray is a nice name!"),
                ChatMessage(id: UUID(), role: .assistant, content: "Well thank you, Karina! I like your nam too. Now tell me, where do you live?")
            ]
        }
    }
}

struct InteractiveView_Previews: PreviewProvider {
    static var previews: some View {
        InteractiveView(character: .init(id: 0, name: "Name", description: "Description"),
                        onExit: {})
    }
}
