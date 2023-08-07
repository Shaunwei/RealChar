//
//  PreferenceSettings.swift
//  rac
//
//  Created by ZongZiWang on 7/20/23.
//

import SwiftUI
import Combine

class PreferenceSettings: ObservableObject {

    struct Constants {
        static let hapticFeedbackKey = "enableHapticFeedback"
        static let useSearch = "useSearch"
        static let llmOptionKey = "largeLanguageModel"
        static let languageOption = "languageOption"
        static let includedCommunityCharacterIds = "includedCommunityCharacterIds"
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
    @Published var llmOption: LlmOption = LlmOption(rawValue: UserDefaults.standard.string(forKey: Constants.llmOptionKey) ?? LlmOption.gpt35.rawValue) ?? .gpt35 {
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

    func loadSettings(isUserLoggedIn: Bool) {
        if !isUserLoggedIn {
            self.llmOption = .gpt35
        }
    }
}
