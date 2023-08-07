//
//  UserSettings.swift
//  rac
//
//  Created by ZongZiWang on 7/20/23.
//

import SwiftUI
import Combine
import Firebase
import AuthenticationServices

class UserSettings: ObservableObject {

    struct Constants {
        static let appleAuthorizedUserIdKey = "appleAuthorizedUserIdKey"
    }

    @Published var userId: String? = nil
    @Published var userEmail: String? = nil
    @Published var userName: String? = nil
    @Published var userToken: String? = nil
    @Published var isLoggedIn: Bool = false

    private var lastIdTokenCheckedTime: Date = Date.distantPast

    // Function to check if the user is logged in
    func checkUserLoggedIn(useCache: Bool = true, completion: ((Bool) -> Void)? = nil) {
        if let currentUser = Auth.auth().currentUser {
            // Retrieve user ID saved in UserDefaults
            if currentUser.providerID == "apple.com",
                let userId = UserDefaults.standard.string(forKey: Constants.appleAuthorizedUserIdKey) {
                // Check Apple ID credential state
                ASAuthorizationAppleIDProvider().getCredentialState(forUserID: userId, completion: { [unowned self] credentialState, error in

                    switch(credentialState) {
                    case .authorized:
                        break
                    case .notFound,
                         .transferred,
                         .revoked:
                        // Perform sign out
                        logoutUser()
                        completion?(false)
                        return
                    @unknown default:
                        break
                    }

                    checkIdToken(currentUser: currentUser, useCache: useCache, completion: completion)
                })
            } else {
                checkIdToken(currentUser: currentUser, useCache: useCache, completion: completion)
            }
        } else {
            completion?(false)
        }
    }

    private func checkIdToken(currentUser: User, useCache: Bool = true, completion: ((Bool) -> Void)?) {
        if useCache && isLoggedIn && Date().timeIntervalSince(lastIdTokenCheckedTime) < TimeInterval(60 * 60) {
            completion?(true)
            return
        }
        currentUser.getIDToken() { token, error in
            self.lastIdTokenCheckedTime = Date()
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
    }

    // Function to log the user out
    func logoutUser() {
        self.userId = nil
        self.userEmail = nil
        self.userName = nil
        self.userToken = nil
        self.isLoggedIn = false
        UserDefaults.standard.removeObject(forKey: Constants.appleAuthorizedUserIdKey)
    }

    func saveAppleSignIn(userId: String) {
        UserDefaults.standard.set(userId, forKey: Constants.appleAuthorizedUserIdKey)
    }
}
