//
//  RootView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct RootView: View {
    @State var interactive = false

    var body: some View {
        NavigationView {
            VStack {
                if interactive {
                    InteractiveView()
                } else {
                    WelcomeView { option in
                        interactive = true
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(leading: LogoView().padding(.leading, 44),
                                trailing: EmptyView())
        }
    }
}

struct LogoView: View {
    var body: some View {
        Image("logo")
            .resizable()
    }
}

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
    }
}
