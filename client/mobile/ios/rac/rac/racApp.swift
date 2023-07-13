//
//  racApp.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

@main
struct racApp: App {
    var body: some Scene {
        WindowGroup {
            RootView(webSocketClient: WebSocketClient())
        }
    }
}
