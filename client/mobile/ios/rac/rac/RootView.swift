//
//  RootView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct RootView: View {
    @State var interactive = false
    @State var welcomeTab: WelcomeView.Tab = .about
    @State var options: [CharacterOption] = []
    @State var character: CharacterOption? = nil

    let webSocketClient: WebSocketClient

    var body: some View {
        NavigationView {
            VStack {
                if interactive {
                    InteractiveView(webSocketClient: webSocketClient,
                                    character: character) {
                        welcomeTab = .about
                        character = nil
                        withAnimation {
                            interactive.toggle()
                        }
                    }
                    .transition(.moveAndFade2)
                } else {
                    WelcomeView(webSocketClient: webSocketClient,
                                tab: $welcomeTab,
                                character: $character,
                                options: $options) { selected in
                        character = selected
                        webSocketClient.send(message: String(selected.id))
                        // TODO: figure out why animation does not work well
//                        withAnimation {
                            interactive.toggle()
//                        }
                    }
                    .transition(.moveAndFade)
                }
            }
            .toolbar {
                if interactive {
                    ToolbarItem(placement: .principal) {
                        Image("logo")
                            .preferredColorScheme(.dark)
                    }

                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            withAnimation {
                                interactive.toggle()
                            }
                        } label: {
                            Image("menu")
                                .tint(.white)
                                .padding(12)
                                .padding(.trailing, 20)
                        }

                    }
                } else {
                    ToolbarItemGroup(placement: .navigation) {
                            Image("logo")
                                .resizable()
                                .padding(.leading, 32)
                    }
                }
            }
        }
        .onAppear {
            webSocketClient.connectSession()
            webSocketClient.onStringReceived = { message in
                if let options = self.parsedAsCharacterOptions(message: message) {
                    self.options = options
                }
            }
        }
        .onDisappear {
            webSocketClient.closeSession()
        }
    }

    private func parsedAsCharacterOptions(message: String) -> [CharacterOption]? {
        var options: [CharacterOption] = []
        // TODO: Parsing logic relies on loose contract
        if message.contains("Select your character") {
            message.split(separator: "\n").forEach { line in
                if isFirstCharactersNumber(String(line), count: 1) {
                    if let characterName = line.split(separator: "-").last?.trimmingPrefix(" ") {
                        // TODO: ID and description here are temporary
                        options.append(.init(id: options.count + 1, name: String(characterName), description: ""))
                    }
                }
            }
        }
        return options.isEmpty ? nil : options
    }

    private func isFirstCharactersNumber(_ string: String, count: Int) -> Bool {
        guard count > 0 && count <= string.count else {
            return false
        }

        let characterSet = CharacterSet.decimalDigits
        let firstCharacters = string.prefix(count)

        return firstCharacters.allSatisfy { characterSet.contains(UnicodeScalar(String($0))!) }
    }
}

extension AnyTransition {
    static var moveAndFade: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .top).combined(with: .opacity),
            removal: .move(edge: .bottom).combined(with: .opacity)
        )
    }

    static var moveAndFade2: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .bottom).combined(with: .opacity),
            removal: .move(edge: .top).combined(with: .opacity)
        )
    }
}

struct LogoView: View {
    var body: some View {
        Image("logo")
            .resizable()
    }
}

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView(webSocketClient: WebSocketClient())
    }
}
