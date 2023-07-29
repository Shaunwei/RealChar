//
//  SettingsViewView.swift
//  rac
//
//  Created by ZongZiWang on 7/19/23.
//

import SwiftUI
import GoogleSignIn
import Firebase

enum LlmOption: RawRepresentable, Hashable, CaseIterable, Identifiable, Codable {

    case gpt35, gpt4, claude

    init?(rawValue: String) {
        for option in LlmOption.allCases {
            if rawValue == option.rawValue {
                self = option
                return
            }
        }
        return nil
    }

    var id: String { rawValue }
    var rawValue: String {
        switch self {
        case .gpt35:
            return "gpt-3.5-turbo-16k"
        case .gpt4:
            return "gpt-4"
        case .claude:
            return "claude-2"
        }
    }

    var displayName: String {
        switch self {
        case .gpt35:
            return "gpt-3.5"
        case .gpt4:
            return "gpt-4"
        case .claude:
            return "claude-2"
        }
    }
}

enum LanguageOption: RawRepresentable, Hashable, CaseIterable, Identifiable, Codable {

    case english, spanish

    init?(rawValue: String) {
        for option in LanguageOption.allCases {
            if rawValue == option.rawValue {
                self = option
                return
            }
        }
        return nil
    }

    var id: String { rawValue }
    var rawValue: String {
        switch self {
        case .english:
            return "en-US"
        case .spanish:
            return "es-ES"
        }
    }

    var displayName: String {
        switch self {
        case .english:
            return "English"
        case .spanish:
            return "Spanish"
        }
    }

    var locale: Locale {
        Locale(identifier: rawValue)
    }
}

struct SettingsView: View {
    @EnvironmentObject private var userSettings: UserSettings
    @EnvironmentObject private var preferenceSettings: PreferenceSettings

    @State var showAuth: Bool = false

    var body: some View {
        GeometryReader { geometry in
            VStack(alignment: .leading, spacing: 20) {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 40) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("User settings")
                                .font(
                                    Font.custom("Prompt", size: 18).weight(.medium)
                                )

                            if !userSettings.isLoggedIn {
                                GoogleSignInButton()
                                    .frame(height: 48)
                                    .onTapGesture {
                                        showAuth = true
                                    }
                            } else {
                                Text("Name: \(userSettings.userName ?? "Name unavailable")")
                                    .font(
                                        Font.custom("Prompt", size: 16)
                                    )

                                Text("Email: \(userSettings.userEmail ?? "Email unavailable")")
                                    .font(
                                        Font.custom("Prompt", size: 16)
                                    )

                                Button(role: .destructive) {
                                    logout()
                                } label: {
                                    Text("Log out")
                                        .font(
                                            Font.custom("Prompt", size: 16)
                                        )
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("System settings")
                                .font(
                                    Font.custom("Prompt", size: 18).weight(.medium)
                                )

                            Text("Conversation Language?")
                                .font(
                                    Font.custom("Prompt", size: 16)
                                )

                            Picker("Conversation Language", selection: $preferenceSettings.languageOption) {
                                ForEach(LanguageOption.allCases) { languageOption in
                                    Text(languageOption.displayName)
                                        .font(
                                            Font.custom("Prompt", size: 16)
                                        )
                                        .tag(languageOption)
                                }
                            }
                            .padding(.bottom, 2)
                            .pickerStyle(.segmented)

                            Text("LLM Model?")
                                .font(
                                    Font.custom("Prompt", size: 16)
                                )

                            Picker("LLM Model", selection: $preferenceSettings.llmOption) {
                                ForEach(LlmOption.allCases) { llmOption in
                                    Text(llmOption.displayName)
                                        .font(
                                            Font.custom("Prompt", size: 16)
                                        )
                                        .tag(llmOption)
                                }
                            }
                            .padding(.bottom, 2)
                            .pickerStyle(.segmented)

                            if UIDevice.current.userInterfaceIdiom == .phone {
                                Toggle(isOn: $preferenceSettings.hapticFeedback) {
                                    Text("Haptic feedback?")
                                        .font(
                                            Font.custom("Prompt", size: 16)
                                        )
                                }
                                .tint(.accentColor)
                                .padding(.trailing, 2)
                            }

                            Toggle(isOn: $preferenceSettings.useSearch) {
                                Text("Enable Google search?")
                                    .font(
                                        Font.custom("Prompt", size: 16)
                                    )
                            }
                            .tint(.accentColor)
                            .padding(.trailing, 2)
                        }
                    }
                }

                CtaButton(style: .secondary, action: {
                    openMail(emailTo: "realchar-dev@googlegroups.com", subject: "Feedback for RealChar", body: "Hi RealChar team,\n\n\n")
                }, text: "Leave Beta feedback")
            }
            .padding(.bottom, geometry.safeAreaInsets.bottom > 0 ? 0 : 20)
        }
        .onChange(of: userSettings.isLoggedIn) { newValue in
            if !newValue {
                preferenceSettings.llmOption = .gpt35
            }
        }
        .onChange(of: preferenceSettings.llmOption) { newValue in
            if newValue != .gpt35 && !userSettings.isLoggedIn {
                showAuth = true
            }
        }
        .onChange(of: showAuth) { newValue in
            if newValue {
                signIn()
            }
            if !newValue && !userSettings.isLoggedIn {
                preferenceSettings.llmOption = .gpt35
            }
        }
    }

    // MARK: - Private

    private func signIn() {
        guard let clientID = FirebaseApp.app()?.options.clientID else { return }

        let configuration = GIDConfiguration(clientID: clientID)

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
        guard let rootViewController = windowScene.windows.first?.rootViewController else { return }

        GIDSignIn.sharedInstance.configuration = configuration
        GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { data, error  in
            authenticateUser(for: data?.user, with: error)
        }
    }

    private func authenticateUser(for user: GIDGoogleUser?, with error: Error?) {
        if let error = error {
            print(error.localizedDescription)
            showAuth = false
            return
        }

        guard let idToken = user?.idToken, let accessToken = user?.accessToken else {
            print("missing user ID token or access token: \(String(describing: user))")
            showAuth = false
            return
        }

        let credential = GoogleAuthProvider.credential(withIDToken: idToken.tokenString,
                                                       accessToken: accessToken.tokenString)

        Auth.auth().signIn(with: credential) { data, error in
            if let error = error {
                // TODO: Show error on auth
                print(error.localizedDescription)
            } else {
                self.userSettings.checkUserLoggedIn() { isUserLoggedIn in
                    if !isUserLoggedIn {
                        // TODO: Show error on auth
                    }
                    self.showAuth = false
                }
            }
        }
    }

    private func logout() {
        GIDSignIn.sharedInstance.signOut()

        do {
            try Auth.auth().signOut()

            userSettings.logoutUser()
        } catch {
            print(error.localizedDescription)
        }
    }

    private func openMail(emailTo: String, subject: String, body: String) {
        if let url = URL(string: "mailto:\(emailTo)?subject=\(subject.fixToBrowserString())&body=\(body.fixToBrowserString())"),
           UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
}

extension String {
    func fixToBrowserString() -> String {
        self.replacingOccurrences(of: ";", with: "%3B")
            .replacingOccurrences(of: "\n", with: "%0D%0A")
            .replacingOccurrences(of: " ", with: "+")
            .replacingOccurrences(of: "!", with: "%21")
            .replacingOccurrences(of: "\"", with: "%22")
            .replacingOccurrences(of: "\\", with: "%5C")
            .replacingOccurrences(of: "/", with: "%2F")
            .replacingOccurrences(of: "‘", with: "%91")
            .replacingOccurrences(of: ",", with: "%2C")
        //more symbols fixes here: https://mykindred.com/htmlspecialchars.php
    }
}
