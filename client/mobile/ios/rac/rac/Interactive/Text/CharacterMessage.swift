//
//  CharacterMessage.swift
//  rac
//
//  Created by ZongZiWang on 8/12/23.
//

import SwiftUI

struct CharacterMessage: View {
    @EnvironmentObject private var userSettings: UserSettings
    
    let message: ChatMessage
    @State var isShowingCommentSheet = false
    @State var thumbsUp = false
    @State var comment: String = ""
    
    @StateObject var viewModel = CharacterMessageViewModel()

    var body: some View {
        Text(message.content)
          .font(Font.custom("Prompt", size: 20))
          .foregroundColor(.white)
          .frame(maxWidth: .infinity, alignment: .topLeading)
          .if(message.finalized) { view in
              view.contextMenu {
                  if userSettings.userToken != nil {
                      Button {
                          thumbsUp = true
                          isShowingCommentSheet = true
                      } label: {
                          Label("Great response!", systemImage: "hand.thumbsup")
                      }
                      
                      Button {
                          thumbsUp = false
                          isShowingCommentSheet = true
                      } label: {
                          Label("Something's wrong", systemImage: "hand.thumbsdown")
                      }
                  }
                  
                  Divider()
                  
                  Button {
                      UIPasteboard.general.string = message.content
                  } label: {
                      Label("Copy to Clipboard", systemImage: "doc.on.doc")
                  }
              }
          }
          .alert(thumbsUp
                 ? "Thanks for the feedback! Share more comments?"
                 : "Sorry to hear that! Share more comments?",
                 isPresented: $isShowingCommentSheet) {
              // Comment sheet
              VStack {
                  TextField("(Optional) Comments", text: $comment)
                      .tint(.gray)
                      .foregroundColor(.gray)

                  Button("Cancel") {
                      isShowingCommentSheet = false
                  }

                  Button("Submit") {
                      Task {
                          do {
                              try await viewModel.submit(feedback: thumbsUp, comment: comment, messageId: message.id, userToken: userSettings.userToken)
                              comment = ""
                          } catch {
                              print(error.localizedDescription)
                          }
                          isShowingCommentSheet = false
                      }
                  }
              }
              .padding()
          }
    }
}
