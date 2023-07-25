//
//  UserSettings.swift
//  rac
//
//  Created by ZongZiWang on 7/20/23.
//

import SwiftUI
import Combine
import Firebase

class UserSettings: ObservableObject {

    struct Constants {
        static let loggedInUserIdKey = "loggedInUserId"
        static let loggedInUserEmailKey = "loggedInUserEmail"
        static let loggedInUserNameKey = "loggedInUserName"
    }

    @Published var userId: String? = nil
    @Published var userEmail: String? = nil
    @Published var userName: String? = nil
    @Published var userToken: String? = nil
    @Published var isLoggedIn: Bool = false

    // Function to check if the user is logged in
    func checkUserLoggedIn(completion: ((Bool) -> Void)? = nil) {
        if let currentUser = Auth.auth().currentUser {
            currentUser.getIDToken() { token, error in
                if let error {
                    print("Fail to get ID Token from user: \(error.localizedDescription)")
                    completion?(false)
                    return
                }
                self.userId = currentUser.uid
                self.userEmail = currentUser.email
                self.userName = currentUser.displayName
                self.userToken = token
                self.isLoggedIn = true
                completion?(true)
            }
        } else {
            completion?(false)
        }
    }

    // Function to log the user out
    func logoutUser() {
        self.userId = nil
        self.userEmail = nil
        self.userName = nil
        self.userToken = nil
        self.isLoggedIn = false
    }
}
