//
//  UserMessage.swift
//  rac
//
//  Created by ZongZiWang on 8/12/23.
//

import SwiftUI

struct UserMessage: View {
    let message: String
    var onCancel: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 8) {
            Text(message)
                .font(Font.custom("Prompt", size: 20))
                .multilineTextAlignment(.trailing)
                .foregroundColor(.white)
                .padding(.vertical, 11)
                .padding(.leading, 20)
                .if(onCancel == nil) { view in
                    view.padding(.trailing, 20)
                }

            if let onCancel {
                Button {
                    onCancel()
                } label: {
                    Image(systemName: "xmark.circle")
                        .padding(12)
                }
                .buttonStyle(CustomButtonStyle())
            }
        }
        .background(Color(red: 0.4, green: 0.52, blue: 0.83).opacity(0.25))
        .roundedCorner(20, corners: [.bottomLeft, .topLeft, .topRight])
        .frame(maxWidth: .infinity, alignment: .topTrailing)
    }
}

struct UserInputView: View {
    @Binding var message: String

    var body: some View {
        TextField("Your turn", text: $message, axis: .vertical)
            .textFieldStyle(CustomTextFieldStyle())
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(Font.custom("Prompt", size: 20))
            .multilineTextAlignment(.trailing)
            .lineLimit(...3)
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 11)
            .background(Color(red: 0.4, green: 0.52, blue: 0.83).opacity(0.25))
            .roundedCorner(20, corners: [.bottomLeft, .topLeft, .topRight])
    }
}

extension View {
    func roundedCorner(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners) )
    }

    func onEnter(@Binding of text: String, action: @escaping () -> ()) -> some View {
        onChange(of: text) { newValue in
            if let last = newValue.last, last == "\n" {
                text.removeLast()
                action()
            }
        }
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}
