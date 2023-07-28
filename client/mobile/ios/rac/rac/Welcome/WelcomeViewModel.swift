//
//  ConfigViewModel.swift
//  rac
//
//  Created by ZongZiWang on 7/28/23.
//

import SwiftUI

class WelcomeViewModel: ObservableObject {

    func loadCharacters() async throws -> [CharacterOption] {
        let (data, _) = try await URLSession.shared.data(from: serverUrl.appending(path: "characters"))
        return try JSONDecoder().decode([CharacterOption].self, from: data)
    }
}
