//
//  PreferenceSettings.swift
//  rac
//
//  Created by ZongZiWang on 7/20/23.
//

import SwiftUI
import Combine

struct QuivrMeta: Equatable {
    let apiKey: String
    let brainId: String
    let brainName: String
}

class PreferenceSettings: ObservableObject {

    struct Constants {
        static let hapticFeedbackKey = "enableHapticFeedback"
        static let useSearch = "useSearch"
        static let llmOptionKey = "largeLanguageModel"
        static let languageOption = "languageOption"
        static let includedCommunityCharacterIds = "includedCommunityCharacterIds"
        static let quivrApiKey = "quivrApiKey"
        static let quivrBrainId = "quivrBrainId"
        static let quivrBrainName = "quivrBrainName"
    }

    @Published var hapticFeedback: Bool = UserDefaults.standard.bool(forKey: Constants.hapticFeedbackKey) {
        didSet {
            guard hapticFeedback != oldValue else { return }
            UserDefaults.standard.set(hapticFeedback, forKey: Constants.hapticFeedbackKey)
            print("Saved haptic feedback preference: \(hapticFeedback)")
        }
    }
    @Published var useSearch: Bool = UserDefaults.standard.bool(forKey: Constants.useSearch) {
        didSet {
            guard useSearch != oldValue else { return }
            UserDefaults.standard.set(useSearch, forKey: Constants.useSearch)
            print("Saved use search preference: \(useSearch)")
        }
    }
    @Published var llmOption: LlmOption = LlmOption(rawValue: UserDefaults.standard.string(forKey: Constants.llmOptionKey) ?? LlmOption.rebyte.rawValue) ?? .rebyte {
        didSet {
            guard llmOption != oldValue else { return }
            UserDefaults.standard.set(llmOption.rawValue, forKey: Constants.llmOptionKey)
            print("Saved large language model preference: \(llmOption.displayName)")
        }
    }
    @Published var languageOption: LanguageOption = LanguageOption(rawValue: UserDefaults.standard.string(forKey: Constants.languageOption) ?? "en-US") ?? .english {
        didSet {
            guard languageOption != oldValue else { return }
            UserDefaults.standard.set(languageOption.rawValue, forKey: Constants.languageOption)
            print("Saved language preference: \(languageOption.displayName)")
        }
    }
    @Published var includedCommunityCharacterIds: [String] = (UserDefaults.standard.string(forKey: Constants.includedCommunityCharacterIds) ?? "").split(separator: ",").map { String($0) } {
        didSet {
            guard includedCommunityCharacterIds != oldValue else { return }
            UserDefaults.standard.set(includedCommunityCharacterIds.joined(separator: ","), forKey: Constants.includedCommunityCharacterIds)
            print("Saved included community character IDs: \(includedCommunityCharacterIds)")
        }
    }
    @Published var quivrMeta: QuivrMeta =
        .init(apiKey: UserDefaults.standard.string(forKey: Constants.quivrApiKey) ?? "",
              brainId: UserDefaults.standard.string(forKey: Constants.quivrBrainId) ?? "",
              brainName: UserDefaults.standard.string(forKey: Constants.quivrBrainName) ?? "") {
            didSet {
                guard quivrMeta != oldValue else { return }
                UserDefaults.standard.set(quivrMeta.apiKey, forKey: Constants.quivrApiKey)
                UserDefaults.standard.set(quivrMeta.brainId, forKey: Constants.quivrBrainId)
                UserDefaults.standard.set(quivrMeta.brainName, forKey: Constants.quivrBrainName)
                print("Saved quivr metadata: \(quivrMeta)")

            }
        }

    func loadSettings(isUserLoggedIn: Bool) {
        if !isUserLoggedIn {
            self.llmOption = .rebyte
        }
    }
}
