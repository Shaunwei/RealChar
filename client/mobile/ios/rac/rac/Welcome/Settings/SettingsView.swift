//
//  SettingsViewView.swift
//  rac
//
//  Created by ZongZiWang on 7/19/23.
//

import SwiftUI

enum LlmOption: RawRepresentable, Hashable, CaseIterable, Identifiable {

    case gpt35, gpt4, claude

    init?(rawValue: String) {
        for option in LlmOption.allCases {
            if rawValue == option.rawValue {
                self = option
            }
        }
        return nil
    }

    var id: String { rawValue }
    var rawValue: String {
        switch self {
        case .gpt35:
            return "gpt-3.5"
        case .gpt4:
            return "gpt-4"
        case .claude:
            return "claude"
        }
    }
}

struct SettingsView: View {

    @Binding var hapticFeedback: Bool
    @Binding var loggedIn: Bool
    @Binding var llmOption: LlmOption
    @State var showAuth: Bool = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("User settings")
                        .font(
                            Font.custom("Prompt", size: 18).weight(.medium)
                        )

                    if !loggedIn {
                        Text("Log in to unblock more power")
                            .font(
                                Font.custom("Prompt", size: 16)
                            )
                            .padding(.horizontal, 2)
                            .foregroundColor(.accentColor)
                            .onTapGesture {
                                showAuth = true
                            }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("System settings")
                        .font(
                            Font.custom("Prompt", size: 18).weight(.medium)
                        )

                    Toggle(isOn: $hapticFeedback) {
                        Text("Haptic feedback?")
                            .font(
                                Font.custom("Prompt", size: 16)
                            )
                    }
                    .tint(.accentColor)
                    .padding(.horizontal, 2)

                    Text("LLM Model?")
                        .font(
                            Font.custom("Prompt", size: 16)
                        )
                        .padding(.horizontal, 2)

                    Picker("LLM Model", selection: $llmOption) {
                        ForEach(LlmOption.allCases) { llmOption in
                            Text(llmOption.rawValue)
                                .font(
                                    Font.custom("Prompt", size: 16)
                                )
                                .tag(llmOption)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                CtaButton(style: .secondary, action: {
                    openMail(emailTo: "realchar-dev@googlegroups.com", subject: "Feedback for RealChar", body: "Hi RealChar team,\n\n\n")
                }, text: "Leave feedback")
            }
        }
        .onChange(of: llmOption) { newValue in
            if newValue != .gpt35 && !loggedIn {
                showAuth = true
            }
        }
        .onChange(of: showAuth) { newValue in
            if !newValue && !loggedIn {
                llmOption = .gpt35
            }
        }
        .sheet(isPresented: $showAuth) {
            AuthView()
        }
    }

    func openMail(emailTo: String, subject: String, body: String) {
        if let url = URL(string: "mailto:\(emailTo)?subject=\(subject.fixToBrowserString())&body=\(body.fixToBrowserString())"),
           UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}

struct AuthView: View {
    var body: some View {
        Text("Log in coming soon")
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView(hapticFeedback: .constant(false),
                     loggedIn: .constant(true),
                     llmOption: .constant(.gpt35))
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
