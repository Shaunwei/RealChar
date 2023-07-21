//
//  AppleSignInButton.swift
//  rac
//
//  Created by ZongZiWang on 7/20/23.
//

import SwiftUI
import AuthenticationServices
import CryptoKit
import FirebaseAuth

struct AppleSignInButton: View {
    @EnvironmentObject private var userSettings: UserSettings
    @Environment(\.colorScheme) var colorScheme

    var onFirebaseCredentialAndDisplayNameGenerated: (AuthCredential, String?) -> Void

    @State private var currentNonce: String? = nil

    var body: some View {
        if colorScheme == .dark {
            signInButton(SignInWithAppleButton.Style.whiteOutline)
        } else {
            signInButton(SignInWithAppleButton.Style.black)
        }
    }

    func signInButton(_ type: SignInWithAppleButton.Style) -> some View {
        return SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.fullName, .email]
            // Generate nonce for validation after authentication successful
            let nonce = randomNonceString()
            // Set the SHA256 hashed nonce to ASAuthorizationAppleIDRequest
            request.nonce = sha256(nonce)
            self.currentNonce = nonce
        } onCompletion: { result in
            switch result {
            case .success(let authorization):
                print("Sign in with Apple successfully: \(authorization)")
                switch authorization.credential {
                case let appleIdCredential as ASAuthorizationAppleIDCredential:
                    if let _ = appleIdCredential.email, let _ = appleIdCredential.fullName {
                        // Apple has autherized the use with Apple ID and password
                        registerNewUser(credential: appleIdCredential)
                    } else {
                        // User has been already exist with Apple Identity Provider
                        signInExistingUser(credential: appleIdCredential)
                    }
                    break

                case let passwordCredential as ASPasswordCredential:
                    print("\n ** ASPasswordCredential ** \n")
                    signinWithUserNamePassword(credential: passwordCredential)
                    break

                default:
                    break
                }
            case .failure(let error):
                print("Sign in with Apple failed: \(error.localizedDescription)")
            }
        }
        .signInWithAppleButtonStyle(type)
    }

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: Array<Character> =
            Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length

        while remainingLength > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in
                var random: UInt8 = 0
                let errorCode = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                if errorCode != errSecSuccess {
                    fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
                }
                return random
            }

            randoms.forEach { random in
                if remainingLength == 0 {
                    return
                }

                if random < charset.count {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }

        return result
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            return String(format: "%02x", $0)
        }.joined()

        return hashString
    }
}

extension AppleSignInButton {
    private func registerNewUser(credential: ASAuthorizationAppleIDCredential) {
        // API Call - Pass the email, user full name, user identity provided by Apple and other
        userSettings.saveAppleSignIn(userId: credential.user)
        if let firebaseCredential = generateFirebaseCredential(for: credential) {
            onFirebaseCredentialAndDisplayNameGenerated(firebaseCredential, displayName(from: credential.fullName))
        }
    }

    private func signInExistingUser(credential: ASAuthorizationAppleIDCredential) {
        // API Call - Pass the user identity, authorizationCode and identity token
        userSettings.saveAppleSignIn(userId: credential.user)
        if let firebaseCredential = generateFirebaseCredential(for: credential) {
            onFirebaseCredentialAndDisplayNameGenerated(firebaseCredential, displayName(from: credential.fullName))
        }
    }

    private func signinWithUserNamePassword(credential: ASPasswordCredential) {
        // API Call - Sign in with Username and password
        userSettings.saveAppleSignIn(userId: credential.user)
        // TODO: Tell user username and password is not supported
    }

    private func generateFirebaseCredential(for appleIDCredential: ASAuthorizationAppleIDCredential) -> AuthCredential? {
        // Retrieve the secure nonce generated during Apple sign in
        guard let nonce = currentNonce else {
            fatalError("Invalid state: A login callback was received, but no login request was sent.")
        }

        // Retrieve Apple identity token
        guard let appleIDToken = appleIDCredential.identityToken else {
            print("Failed to fetch identity token")
            return nil
        }

        // Convert Apple identity token to string
        guard let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
            print("Failed to decode identity token")
            return nil
        }

        // Initialize a Firebase credential using secure nonce and Apple identity token
        let firebaseCredential = OAuthProvider.credential(withProviderID: "apple.com",
                                                          idToken: idTokenString,
                                                          rawNonce: nonce)
        return firebaseCredential
    }

    private func displayName(from nameComponents: PersonNameComponents?) -> String? {
        guard let nameComponents else { return nil }

        var displayName = ""

        // Check if the givenName is available and not empty
        if let givenName = nameComponents.givenName, !givenName.isEmpty {
            displayName += givenName
        }

        // Check if the middleName is available and not empty
        if let middleName = nameComponents.middleName, !middleName.isEmpty {
            if !displayName.isEmpty {
                displayName += " "
            }
            displayName += middleName
        }

        // Check if the familyName is available and not empty
        if let familyName = nameComponents.familyName, !familyName.isEmpty {
            if !displayName.isEmpty {
                displayName += " "
            }
            displayName += familyName
        }

        // Check if the namePrefix (e.g., Mr., Mrs.) is available and not empty
        if let namePrefix = nameComponents.namePrefix, !namePrefix.isEmpty {
            if !displayName.isEmpty {
                displayName = namePrefix + " " + displayName
            } else {
                displayName = namePrefix
            }
        }

        // Check if the nameSuffix (e.g., Jr., Sr.) is available and not empty
        if let nameSuffix = nameComponents.nameSuffix, !nameSuffix.isEmpty {
            if !displayName.isEmpty {
                displayName += " " + nameSuffix
            } else {
                displayName = nameSuffix
            }
        }

        // Check if the nickname is available and not empty
        if let nickname = nameComponents.nickname, !nickname.isEmpty {
            if !displayName.isEmpty {
                displayName += " (" + nickname + ")"
            } else {
                displayName = nickname
            }
        }

        return displayName.isEmpty ? nil : displayName
    }
}
