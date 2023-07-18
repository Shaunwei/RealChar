//
//  CtaButton.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct CtaButton: View {
    enum Style {
        case primary, secondary
    }

    @Environment(\.colorScheme) var colorScheme

    let style: Style
    let action: () -> Void
    let text: String

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(
                    Font.custom("Prompt", size: 18)
                        .weight(.medium)
                )
                .foregroundColor(style == .primary ? (colorScheme == .dark ? .black : .white) : (colorScheme == .dark ? .white : .black))
                .padding(.horizontal, 20)
                .padding(.vertical, 9)
                .frame(maxWidth: .infinity, minHeight: 52, maxHeight: 52, alignment: .center)
                .background(style == .primary ? (colorScheme == .dark ? .white : Color(red: 0.01, green: 0.03, blue: 0.11)) : (colorScheme == .dark ? Color(red: 0.01, green: 0.03, blue: 0.11) : .white))
                .cornerRadius(4)
        }
        .buttonStyle(CustomButtonStyle())
    }
}

struct CustomButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) var isEnabled: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(!isEnabled ? 0.25 : configuration.isPressed ? 0.8 : 1.0)
    }
}

struct CtaButton_Previews: PreviewProvider {
    static var previews: some View {
        CtaButton(style: .primary, action: { }, text: "Contribute")
            .padding(20)

        CtaButton(style: .primary, action: { }, text: "Contribute")
            .disabled(true)
            .padding(20)

        CtaButton(style: .primary, action: { }, text: "Contribute")
            .preferredColorScheme(.dark)
            .padding(20)

        CtaButton(style: .primary, action: { }, text: "Contribute")
            .preferredColorScheme(.dark)
            .disabled(true)
            .padding(20)
    }
}
