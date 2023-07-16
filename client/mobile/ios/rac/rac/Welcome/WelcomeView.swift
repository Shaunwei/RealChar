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
    @Binding var options: [CharacterOption]
    @Binding var openMic: Bool
    @Binding var hapticFeedback: Bool

    let onConfirmConfig: (CharacterOption) -> Void
    let onWebSocketReconnected: () -> Void

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
                               openMic: $openMic,
                               hapticFeedback: $hapticFeedback,
                               onConfirmConfig: onConfirmConfig)
                        .padding(.horizontal, 48)
                }
            }
        }
        .onAppear {
            webSocketClient.onCharacterOptionsReceived = { options in
                self.options = options
            }
        }
        .onChange(of: character) { newValue in
            if webSocketClient.isConnected && webSocketClient.isInteractiveMode {
                webSocketClient.isConnected = false
                webSocketClient.isInteractiveMode = false
                webSocketClient.closeSession()
                webSocketClient.onCharacterOptionsReceived = { options in
                    self.options = options
                }
                webSocketClient.connectSession()
                onWebSocketReconnected()
            }
        }
    }
}

struct WelcomeView_Previews: PreviewProvider {
    static var previews: some View {
        WelcomeView(webSocketClient: WebSocketClient(),
                    tab: .constant(.about),
                    character: .constant(nil),
                    options: .constant([.init(id: 0, name: "Mythical god", description: "Rogue", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!),
                              .init(id: 1, name: "Anime hero", description: "Noble", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!),
                              .init(id: 2, name: "Realtime AI", description: "Kind", imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!)]),
                    openMic: .constant(false),
                    hapticFeedback: .constant(false),
                    onConfirmConfig: { _ in },
                    onWebSocketReconnected: { }
        )
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
