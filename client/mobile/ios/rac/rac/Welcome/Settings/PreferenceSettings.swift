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
        static let llmOptionKey = "largeLanguageModel"
    }

    @Published var hapticFeedback: Bool = true {
        didSet {
            guard hapticFeedback != oldValue else { return }
            UserDefaults.standard.set(hapticFeedback, forKey: Constants.hapticFeedbackKey)
            print("Saved haptic feedback preference: \(hapticFeedback)")
        }
    }
    @Published var llmOption: LlmOption = .gpt35 {
        didSet {
            guard llmOption != oldValue else { return }
            UserDefaults.standard.set(llmOption.rawValue, forKey: Constants.llmOptionKey)
            print("Saved large language model preference: \(llmOption.displayName)")
        }
    }

    func loadSettings(isUserLoggedIn: Bool) {
        self.hapticFeedback = UserDefaults.standard.bool(forKey: Constants.hapticFeedbackKey)
        let llmOptionRawValue = UserDefaults.standard.string(forKey: Constants.llmOptionKey) ?? LlmOption.gpt35.rawValue
        self.llmOption = LlmOption(rawValue: llmOptionRawValue) ?? .gpt35
        if !isUserLoggedIn {
            self.llmOption = .gpt35
        }
    }
}
