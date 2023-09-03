//
//  CharacterMessageViewModel.swift
//  rac
//
//  Created by ZongZiWang on 8/12/23.
//

import SwiftUI

class CharacterMessageViewModel: ObservableObject {

    func submit(feedback thumbsUp: Bool, comment: String, messageId: String, userToken: String?) async throws {
        guard let userToken else {
            print("Missing user token for feedback")
            return
        }

        let url = serverUrl.appending(path: "feedback")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")

        let body = ["message_id": messageId, "feedback": thumbsUp ? "good" : "bad", "comment": comment]
        request.httpBody = try! JSONSerialization.data(withJSONObject: body, options: [])

        // Make async call
        let (data, response) = try await URLSession.shared.data(for: request)

        // Handle result
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
            print("Submit feedback successfully")
        } else {
            throw URLError(.badServerResponse)
        }
    }
}
