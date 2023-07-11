//
//  WelcomeView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct WelcomeView: View {
    enum Tab {
        case about, config
    }
    @State var tab = Tab.about

    let onConfirmConfig: (CharacterOption) -> Void

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                HStack(alignment: .center, spacing: 0) {
                    TabView(text: "About", currentTab: $tab, tab: .about)
                        .onTapGesture {
                            tab = .about
                        }

                    TabView(text: "Try out", currentTab: $tab, tab: .config)
                        .onTapGesture {
                            tab = .config
                        }
                }
                .padding(.horizontal, 44)
                .padding(.top, 24)
                .frame(width: geometry.size.width, alignment: .leading)

                switch tab {
                case .about:
                    AboutView()
                        .padding(.horizontal, 60)
                case .config:
                    // TODO: Load characters from server
                    ConfigView(options: [.init(id: 0, name: "Mythical god", description: "Rogue"),
                                         .init(id: 1, name: "Anime hero", description: "Noble"),
                                         .init(id: 2, name: "Realtime AI", description: "Kind")],
                               onConfirmConfig: onConfirmConfig)
                        .padding(.horizontal, 60)
                }
            }
        }
    }
}

struct WelcomeView_Previews: PreviewProvider {
    static var previews: some View {
        WelcomeView(onConfirmConfig: { _ in })
    }
}

struct TabView: View {
    let text: String
    @Binding var currentTab: WelcomeView.Tab
    let tab: WelcomeView.Tab

    var body: some View {
        Text(text)
            .font(Font.custom("Prompt", size: 16))
            .multilineTextAlignment(.center)
            .if(currentTab == tab) { view in
                view.modifier(UnderlineModifier(spacing: 8, thickness: 2))
            }
            .padding(16)
            .foregroundColor(Color(red: 0.01, green: 0.03, blue: 0.11))
    }
}

struct UnderlineModifier: ViewModifier {
    let spacing: CGFloat
    let thickness: CGFloat

    func body(content: Content) -> some View {
        content
            .overlay(
                Rectangle()
                    .frame(height: thickness)
                    .padding(.top, spacing)
                    .foregroundColor(.accentColor)
                    .offset(y: contentHeight(content) + spacing)
            )
    }

    private func contentHeight(_ content: Content) -> CGFloat {
        let font = UIFont.systemFont(ofSize: 16)
        let lineHeight = font.lineHeight
        let ascent = font.ascender
        let descent = font.descender
        let leading = lineHeight - ascent + descent
        return leading
    }
}
