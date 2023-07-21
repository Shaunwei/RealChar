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
    @Published var isLoggedIn: Bool = false

    // Function to save user data
    func save(user: User) {
        self.userId = user.uid
        self.userEmail = user.email
        self.userName = user.displayName
        self.isLoggedIn = true
        UserDefaults.standard.set(userId, forKey: Constants.loggedInUserIdKey)
        UserDefaults.standard.set(userEmail, forKey: Constants.loggedInUserEmailKey)
        UserDefaults.standard.set(userName, forKey: Constants.loggedInUserNameKey)
    }

    // Function to check if the user is logged in
    func checkUserLoggedIn() {
        if let userId = UserDefaults.standard.string(forKey: Constants.loggedInUserIdKey) {
            self.userId = userId
            self.userEmail = UserDefaults.standard.string(forKey: Constants.loggedInUserEmailKey)
            self.userName = UserDefaults.standard.string(forKey: Constants.loggedInUserNameKey)
            self.isLoggedIn = true
        }
    }

    // Function to log the user out
    func logoutUser() {
        self.userId = nil
        self.userEmail = nil
        self.userName = nil
        self.isLoggedIn = false
        UserDefaults.standard.removeObject(forKey: Constants.loggedInUserIdKey)
        UserDefaults.standard.removeObject(forKey: Constants.loggedInUserEmailKey)
        UserDefaults.standard.removeObject(forKey: Constants.loggedInUserNameKey)
    }
}
