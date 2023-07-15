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
    @State var character: CharacterOption? = nil
    @State var options: [CharacterOption] = []
    @State var shouldSendCharacter: Bool = true
    @State var messages: [ChatMessage] = []
    @State var openMic: Bool = false
    @State var hapticFeedback: Bool = true

    let webSocketClient: WebSocketClient

    var body: some View {
        NavigationView {
            VStack {
                if interactive {
                    InteractiveView(webSocketClient: webSocketClient,
                                    character: character,
                                    openMic: openMic,
                                    hapticFeedback: hapticFeedback,
                                    onExit: {
                        welcomeTab = .about
                        character = nil
                        withAnimation {
                            interactive.toggle()
                        }
                    },
                                    messages: $messages)
                    .transition(.moveAndFade2)
                } else {
                    WelcomeView(webSocketClient: webSocketClient,
                                tab: $welcomeTab,
                                character: $character,
                                options: $options,
                                openMic: $openMic,
                                hapticFeedback: $hapticFeedback,
                                onConfirmConfig: { selected in
                        if shouldSendCharacter {
                            shouldSendCharacter = false
                            webSocketClient.send(message: String(selected.id))
                        }
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
            webSocketClient.connectSession()
        }
        .onDisappear {
            webSocketClient.closeSession()
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
        RootView(webSocketClient: WebSocketClient())
    }
}
