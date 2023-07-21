//
//  racApp.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    FirebaseApp.configure()

    return true
  }
}

@main
struct racApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var userSettings = UserSettings()
    @StateObject private var preferenceSettings = PreferenceSettings()
    private let webSocket = WebSocketClient()

    var body: some Scene {
        WindowGroup {
            RootView(webSocket: webSocket)
                .environmentObject(userSettings)
                .environmentObject(preferenceSettings)
        }
    }
}
