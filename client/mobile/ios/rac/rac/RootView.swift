//
//  RootView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var userSettings: UserSettings
    @EnvironmentObject private var preferenceSettings: PreferenceSettings

    @State var interactive = false
    @State var welcomeTab: WelcomeView.Tab = .about
    @State var character: CharacterOption? = nil
    @State var options: [CharacterOption] = []
    @State var shouldSendCharacter: Bool = true
    @State var messages: [ChatMessage] = []
    @State var openMic: Bool = false

    let webSocket: any WebSocket

    var body: some View {
        NavigationView {
            VStack {
                if interactive, let character {
                    InteractiveView(webSocket: webSocket,
                                    character: character,
                                    openMic: openMic,
                                    hapticFeedback: preferenceSettings.hapticFeedback,
                                    shouldSendCharacter: $shouldSendCharacter,
                                    onExit: {
                        welcomeTab = .about
                        self.character = nil
                        withAnimation {
                            interactive.toggle()
                        }
                    },
                                    messages: $messages)
                    .transition(.moveAndFade2)
                } else {
                    WelcomeView(webSocket: webSocket,
                                tab: $welcomeTab,
                                character: $character,
                                options: $options,
                                openMic: $openMic,
                                onConfirmConfig: { selected in
                        // TODO: figure out why animation does not work well
//                        withAnimation {
                            interactive.toggle()
//                        }
                    },
                                onWebSocketReconnected: {
                        messages = []
                        shouldSendCharacter = true
                    })
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
        .navigationViewStyle(StackNavigationViewStyle())
        .onAppear {
            userSettings.checkUserLoggedIn() { isUserLoggedIn in
                preferenceSettings.loadSettings(isUserLoggedIn: isUserLoggedIn)
                if !isUserLoggedIn {
                    webSocket.connectSession(llmOption: preferenceSettings.llmOption, userId: nil, token: nil)
                }
            }
        }
        .onDisappear {
            webSocket.closeSession()
        }
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
        RootView(webSocket: MockWebSocket())
    }
}
