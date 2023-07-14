//
//  WelcomeView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct WelcomeView: View {
    @ObservedObject var webSocketClient: WebSocketClient
    enum Tab {
        case about, config
    }
    @Binding var tab: WelcomeView.Tab
    @Binding var character: CharacterOption?
    @State var options: [CharacterOption] = []

    let onConfirmConfig: (CharacterOption) -> Void

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                HStack(alignment: .center, spacing: 0) {
                    TabView(text: "About", currentTab: $tab, tab: .about)
                        .onTapGesture {
                            tab = .about
                        }

                    TabView(text: "Try out", currentTab: $tab, tab: .config)
                        .onTapGesture {
                            tab = .config
                        }
                }
                .padding(.horizontal, 32)
                .padding(.top, 24)
                .frame(width: geometry.size.width, alignment: .leading)

                switch tab {
                case .about:
                    AboutView()
                        .padding(.horizontal, 48)
                case .config:
                    ConfigView(options: options,
                               loaded: $webSocketClient.isConnected,
                               selectedOption: $character,
                               onConfirmConfig: onConfirmConfig)
                        .padding(.horizontal, 48)
                }
            }
        }
        .onAppear {
            if webSocketClient.isConnected && webSocketClient.isInteractiveMode {
                webSocketClient.isConnected = false
                webSocketClient.isInteractiveMode = false
                webSocketClient.closeSession()
                webSocketClient.onStringReceived = { message in
                    if let options = self.parsedAsCharacterOptions(message: message) {
                        self.options = options
                    }
                }
                webSocketClient.connectSession()
            } else {
                webSocketClient.onStringReceived = { message in
                    if let options = self.parsedAsCharacterOptions(message: message) {
                        self.options = options
                    }
                }
            }
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
                        options.append(.init(id: options.count + 1, name: String(characterName), description: "", imageUrl: mapCharacterToImageUrl(characterName: String(characterName))))
                    }
                }
            }
        }
        return options.isEmpty ? nil : options
    }

    private func mapCharacterToImageUrl(characterName: String) -> URL? {
        // TODO: Get url from server
        if characterName.contains("Elon") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/elon.png")!
        } else if characterName.contains("Character") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!
        } else if characterName.contains("Loki") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!
        } else if characterName.contains("Pi") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/pi.jpeg")!
        } else if characterName.contains("Raiden") {
            return  URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!
        }
        return nil
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

struct WelcomeView_Previews: PreviewProvider {
    static var previews: some View {
        WelcomeView(webSocketClient: WebSocketClient(),
                    tab: .constant(.about),
                    character: .constant(nil),
                    options: [.init(id: 0, name: "Mythical god", description: "Rogue", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!),
                              .init(id: 1, name: "Anime hero", description: "Noble", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!),
                              .init(id: 2, name: "Realtime AI", description: "Kind", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!)],
                    onConfirmConfig: { _ in }
        )
        WelcomeView(webSocketClient: WebSocketClient(),
                    tab: .constant(.config),
                    character: .constant(nil),
                    options:  [.init(id: 0, name: "Mythical god", description: "Rogue", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!),
                               .init(id: 1, name: "Anime hero", description: "Noble", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!),
                               .init(id: 2, name: "Realtime AI", description: "Kind", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!)],
                    onConfirmConfig: { _ in })
    }
}

struct TabView: View {
    @Environment(\.colorScheme) var colorScheme

    let text: String
    @Binding var currentTab: WelcomeView.Tab
    let tab: WelcomeView.Tab

    var body: some View {
        Text(text)
            .font(Font.custom("Prompt", size: 16))
            .multilineTextAlignment(.center)
            .if(currentTab == tab) { view in
                view.modifier(UnderlineModifier(spacing: 8, thickness: 2))
            }
            .padding(16)
            .foregroundColor(colorScheme == .dark ? .white : Color(red: 0.01, green: 0.03, blue: 0.11))
    }
}

struct UnderlineModifier: ViewModifier {
    let spacing: CGFloat
    let thickness: CGFloat

    func body(content: Content) -> some View {
        content
            .overlay(
                Rectangle()
                    .frame(height: thickness)
                    .padding(.top, spacing)
                    .foregroundColor(.accentColor)
                    .offset(y: contentHeight(content) + spacing)
            )
    }

    private func contentHeight(_ content: Content) -> CGFloat {
        let font = UIFont.systemFont(ofSize: 16)
        let lineHeight = font.lineHeight
        let ascent = font.ascender
        let descent = font.descender
        let leading = lineHeight - ascent + descent
        return leading
    }
}
