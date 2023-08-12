//
//  ChatMessagesView.swift
//  rac
//
//  Created by ZongZiWang on 7/10/23.
//

import SwiftUI

enum ChatRole {
    case user, assistant
}

struct ChatMessage: Identifiable {
    var id: String
    let role: ChatRole
    var content: String
    var finalized: Bool = false
}

struct ChatMessagesView: View {

    struct Constants {
        static let realBlack: Color = Color(red: 0.01, green: 0.03, blue: 0.11)
    }

    @Binding var messages: [ChatMessage]
    @Binding var isExpectingUserInput: Bool
    @State var userInput: String = ""

    let onSendUserMessage: (String) -> Void

    var body: some View {
        ScrollViewReader { scrollView in
            List {
                ForEach(messages) { message in
                    switch message.role {
                    case .assistant:
                        CharacterMessage(message: message)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Constants.realBlack)
                            .id(messages.firstIndex(where: { $0.id == message.id}))
                    case .user:
                        UserMessage(message: message.content)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Constants.realBlack)
                            .id(messages.firstIndex(where: { $0.id == message.id}))
                    }
                }
                if isExpectingUserInput {
                    UserInputView(message: $userInput)
                        .listRowSeparator(.hidden)
                        .listRowBackground(Constants.realBlack)
                        .onSubmit {
                            doSubmit()
                        }
                        .onEnter($of: $userInput, action: doSubmit)
                        .submitLabel(.send)
                        .id(messages.count)
                }
            }
            .scrollIndicators(.hidden)
            .listStyle(.inset)
            .scrollContentBackground(.hidden)
            .onAppear {
                scrollView.scrollTo(isExpectingUserInput ? messages.count : messages.count - 1, anchor: .bottomTrailing)
            }
            .onChange(of: messages.last?.content) { _ in
                // TODO: Debounce the onChange call
                withAnimation {
                    scrollView.scrollTo(isExpectingUserInput ? messages.count : messages.count - 1, anchor: .bottomTrailing)
                }
            }
            .onChange(of: isExpectingUserInput) { _ in
                withAnimation {
                    scrollView.scrollTo(isExpectingUserInput ? messages.count : messages.count - 1, anchor: .bottomTrailing)
                }
            }
            .onChange(of: userInput) { newValue in
                // TODO: Debounce the onChange call
                withAnimation {
                    scrollView.scrollTo(isExpectingUserInput ? messages.count : messages.count - 1, anchor: .bottomTrailing)
                }
            }
        }
    }

    private func doSubmit() {
        onSendUserMessage(userInput)
        userInput = ""
    }
}

struct ChatMessagesView_Previews: PreviewProvider {
    static var previews: some View {
        ChatMessagesView(messages: .constant([
            ChatMessage(id: UUID().uuidString, role: .assistant, content: "Hello stranger, what’s your name?"),
            ChatMessage(id: UUID().uuidString, role: .user, content: "Hi 👋 my name is Karina"),
            ChatMessage(id: UUID().uuidString, role: .assistant, content: "Greetings, Karina. What can I do for you?"),
            ChatMessage(id: UUID().uuidString, role: .user, content: "What’s your name?"),
            ChatMessage(id: UUID().uuidString, role: .assistant, content: "I have no name. I am Realtime’s AI soul. I exist in the digital, but if I had to have a name, I would pick Ray 😉"),
            ChatMessage(id: UUID().uuidString, role: .user, content: "Ray is a nice name!"),
            ChatMessage(id: UUID().uuidString, role: .assistant, content: "Well thank you, Karina! I like your nam too. Now tell me, where do you live?")
        ]), isExpectingUserInput: .constant(true), onSendUserMessage: { _ in })
    }
}
