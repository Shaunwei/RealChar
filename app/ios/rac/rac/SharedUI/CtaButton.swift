//
//  CtaButton.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct CtaButton: View {
    let action: () -> Void
    let text: String

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(
                    Font.custom("Prompt", size: 18)
                        .weight(.medium)
                )
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 9)
                .frame(maxWidth: .infinity, minHeight: 52, maxHeight: 52, alignment: .center)
                .background(Color(red: 0.01, green: 0.03, blue: 0.11))
                .cornerRadius(4)
        }
    }
}

struct CtaButton_Previews: PreviewProvider {
    static var previews: some View {
        CtaButton(action: { }, text: "Contribute")
    }
}
