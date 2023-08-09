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
    let id: UUID
    let role: ChatRole
    var content: String
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
                        CharacterMessage(message: message.content)
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
            ChatMessage(id: UUID(), role: .assistant, content: "Hello stranger, what’s your name?"),
            ChatMessage(id: UUID(), role: .user, content: "Hi 👋 my name is Karina"),
            ChatMessage(id: UUID(), role: .assistant, content: "Greetings, Karina. What can I do for you?"),
            ChatMessage(id: UUID(), role: .user, content: "What’s your name?"),
            ChatMessage(id: UUID(), role: .assistant, content: "I have no name. I am Realtime’s AI soul. I exist in the digital, but if I had to have a name, I would pick Ray 😉"),
            ChatMessage(id: UUID(), role: .user, content: "Ray is a nice name!"),
            ChatMessage(id: UUID(), role: .assistant, content: "Well thank you, Karina! I like your nam too. Now tell me, where do you live?")
        ]), isExpectingUserInput: .constant(true), onSendUserMessage: { _ in })
    }
}

struct CharacterMessage: View {
    let message: String
    @State var isShowingCommentSheet = false
    @State var thumbsUp = false
    @State var feedback: String = ""

    var body: some View {
        Text(message)
          .font(Font.custom("Prompt", size: 20))
          .foregroundColor(.white)
          .frame(maxWidth: .infinity, alignment: .topLeading)
          .contextMenu {
              Button {
                  // Handle thumbs up action
                  print("Thumbs up")
                  thumbsUp = true
                  isShowingCommentSheet = true
              } label: {
                  Label("It's great!", systemImage: "hand.thumbsup")
              }

              Button {
                  // Handle thumbs down action
                  print("Thumbs down")
                  thumbsUp = false
                  isShowingCommentSheet = true
              } label: {
                  Label("Something's wrong", systemImage: "hand.thumbsdown")
              }

              Button {
                  // Handle copy to clipboard action
                  print("Copy to clipboard")
                  UIPasteboard.general.string = "This text"
              } label: {
                  Label("Copy to Clipboard", systemImage: "doc.on.doc")
              }
          }
          .alert(thumbsUp
                 ? "Thank you! Share more feedback?"
                 : "Sorry to hear that! Share more feedback?",
                 isPresented: $isShowingCommentSheet) {
              // Comment sheet
              VStack {
                  TextField("(Optional) Feedback", text: $feedback)
                      .foregroundColor(.primary)

                  Button("Cancel") {
                      isShowingCommentSheet = false
                  }

                  Button("Submit") {
                      // Handle submit action along with comment
                      print("Submitted with comment: \(feedback)")
                      isShowingCommentSheet = false
                  }
              }
              .padding()
          }
    }
}

struct UserMessage: View {
    let message: String
    var onCancel: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 8) {
            Text(message)
                .font(Font.custom("Prompt", size: 20))
                .multilineTextAlignment(.trailing)
                .foregroundColor(.white)
                .padding(.vertical, 11)
                .padding(.leading, 20)
                .if(onCancel == nil) { view in
                    view.padding(.trailing, 20)
                }

            if let onCancel {
                Button {
                    onCancel()
                } label: {
                    Image(systemName: "xmark.circle")
                        .padding(12)
                }
                .buttonStyle(CustomButtonStyle())
            }
        }
        .background(Color(red: 0.4, green: 0.52, blue: 0.83).opacity(0.25))
        .roundedCorner(20, corners: [.bottomLeft, .topLeft, .topRight])
        .frame(maxWidth: .infinity, alignment: .topTrailing)
    }
}

struct UserInputView: View {
    @Binding var message: String

    var body: some View {
        TextField("Your turn", text: $message, axis: .vertical)
            .textFieldStyle(CustomTextFieldStyle())
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(Font.custom("Prompt", size: 20))
            .multilineTextAlignment(.trailing)
            .lineLimit(...3)
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 11)
            .background(Color(red: 0.4, green: 0.52, blue: 0.83).opacity(0.25))
            .roundedCorner(20, corners: [.bottomLeft, .topLeft, .topRight])
    }
}

extension View {
    func roundedCorner(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners) )
    }

    func onEnter(@Binding of text: String, action: @escaping () -> ()) -> some View {
        onChange(of: text) { newValue in
            if let last = newValue.last, last == "\n" {
                text.removeLast()
                action()
            }
        }
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

