//
//  WelcomeView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject private var userSettings: UserSettings
    @EnvironmentObject private var preferenceSettings: PreferenceSettings

    @StateObject var welcomeViewModel = WelcomeViewModel()

    let webSocket: any WebSocket
    @StateObject var webSocketConnectionStatusObserver = WebSocketConnectionStatusObserver(delay: .seconds(0.5))
    @State var invalidAttempts = 0
    enum Tab {
        case about, config, settings
    }
    @Binding var tab: WelcomeView.Tab
    @Binding var character: CharacterOption?
    @Binding var options: [CharacterOption]
    @Binding var openMic: Bool

    let onConfirmConfig: (CharacterOption) -> Void
    let onWebSocketReconnected: () -> Void

    @State private var webSocketReconnectTimer: Timer? = nil

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

                    TabView(text: "Settings", currentTab: $tab, tab: .settings)
                        .onTapGesture {
                            tab = .settings
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
                               hapticFeedback: preferenceSettings.hapticFeedback,
                               selectedOption: $character,
                               openMic: $openMic,
                               onConfirmConfig: { option in
                        if webSocketConnectionStatusObserver.status == .connected {
                            simpleSuccess()
                            onConfirmConfig(option)
                        } else {
                            simpleError()
                            invalidAttempts += 1
                        }
                    })
                        .padding(.horizontal, 48)
                case .settings:
                    SettingsView()
                        .padding(.horizontal, 48)
                }

                if webSocketConnectionStatusObserver.debouncedStatus != .connected {
                    VStack {
                        Button {
                            if webSocketConnectionStatusObserver.status == .disconnected, let characterId = character?.id {
                                webSocket.connectSession(llmOption: preferenceSettings.llmOption,
                                                         characterId: characterId,
                                                         userId: userSettings.userId,
                                                         token: userSettings.userToken)
                            }
                        } label: {
                            Text(webSocketConnectionStatusObserver.debouncedStatus == .disconnected ? "Failed to connect to server, tap to retry" : "Connecting to server...")
                                .foregroundColor(.white)
                                .modifier(ShakeEffect(shakes: invalidAttempts * 2))
                                .animation(Animation.linear, value: invalidAttempts)
                                .padding()
                                .frame(width: geometry.size.width, height: 44)
                                .background(webSocketConnectionStatusObserver.debouncedStatus == .disconnected ? .red : .orange)
                                .padding(.top, 20)
                        }
                    }
                }
            }
        }
        .onAppear {
            webSocketConnectionStatusObserver.update(status: webSocket.status)
            webSocket.onConnectionChanged = { status in
                self.webSocketConnectionStatusObserver.update(status: status)
            }
            Task {
                do {
                    options = try await welcomeViewModel.loadCharacters()
                } catch {
                    print(error)
                }
            }
        }
        .onChange(of: character) { newValue in
            if let characterId = newValue?.id {
                reconnectWebSocket(characterId: characterId)
            }
        }
        .onChange(of: preferenceSettings.llmOption) { newValue in
            if userSettings.isLoggedIn, let characterId = character?.id {
                reconnectWebSocket(characterId: characterId)
            }
        }
        .onChange(of: userSettings.isLoggedIn) { newValue in
            if let characterId = character?.id {
                reconnectWebSocket(characterId: characterId)
            }
        }
    }

    private func reconnectWebSocket(characterId: String) {
        webSocketReconnectTimer?.invalidate()
        webSocketReconnectTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: false) { _ in
            webSocket.status = .disconnected
            webSocket.isInteractiveMode = false
            webSocket.closeSession()
            webSocket.onConnectionChanged = { status in
                self.webSocketConnectionStatusObserver.update(status: webSocket.status)
            }
            webSocket.connectSession(llmOption: preferenceSettings.llmOption,
                                     characterId: characterId,
                                     userId: userSettings.userId,
                                     token: userSettings.userToken)
            onWebSocketReconnected()
        }
    }

    private func simpleSuccess() {
        guard preferenceSettings.hapticFeedback else { return }
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    private func simpleError() {
        guard preferenceSettings.hapticFeedback else { return }
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
    }
}

struct WelcomeView_Previews: PreviewProvider {
    static var previews: some View {
        WelcomeView(webSocket: MockWebSocket(),
                    tab: .constant(.about),
                    character: .constant(nil),
                    options: .constant([
                        .init(id: "god",
                              name: "Mythical god",
                              description: "Rogue",
                              imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!,
                              authorName: "",
                              source: "default"),
                        .init(id: "hero",
                              name: "Anime hero",
                              description: "Noble",
                              imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!,
                              authorName: "",
                              source: "default"),
                        .init(id: "ai",
                              name: "Realtime AI",
                              description: "Kind",
                              imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!,
                              authorName: "",
                              source: "default")]),
                    openMic: .constant(false),
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

class WebSocketConnectionStatusObserver: ObservableObject {
    @Published var debouncedStatus: WebSocketConnectionStatus = .connected
    @Published var status: WebSocketConnectionStatus = .connected

    init(delay: DispatchQueue.SchedulerTimeType.Stride) {
        $status
            .debounce(for: delay, scheduler: DispatchQueue.main)
            .assign(to: &$debouncedStatus)
    }

    func update(status: WebSocketConnectionStatus) {
        DispatchQueue.main.async {
            self.status = status
        }
    }
}

struct ShakeEffect: GeometryEffect {
    func effectValue(size: CGSize) -> ProjectionTransform {
        return ProjectionTransform(CGAffineTransform(translationX: -30 * sin(position * 2 * .pi), y: 0))
    }

    init(shakes: Int) {
        position = CGFloat(shakes)
    }

    var position: CGFloat
    var animatableData: CGFloat {
        get { position }
        set { position = newValue }
    }
}
