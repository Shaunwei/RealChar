//
//  ConfigView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct CharacterOption: Identifiable, Equatable {
    let id: Int
    let name: String
    let description: String
}

struct ConfigView: View {

    let options: [CharacterOption]
    @Binding var selectedOption: CharacterOption?
    let onConfirmConfig: (CharacterOption) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Choose your partner")
                  .font(
                    Font.custom("Prompt", size: 18).weight(.medium)
                  )
                  .foregroundColor(.black)

                ForEach(options) { option in
                    CharacterOptionView(option: option, selected: option == selectedOption)
                        .onTapGesture {
                            if selectedOption == option {
                                selectedOption = nil
                            } else {
                                selectedOption = option
                            }
                        }
                        .padding(.horizontal, 2)
                }

                Spacer(minLength: 0)

                CtaButton(action: {
                    guard let selectedOption else { return }
                    onConfirmConfig(selectedOption)
                }, text: "Get started")
                .disabled(selectedOption == nil)
            }
        }
    }
}

struct CharacterOptionView: View {
    let option: CharacterOption
    let selected: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 22) {
            Rectangle()
                .foregroundColor(.clear)
                .frame(width: 40, height: 40)
                .background(Color(red: 0.76, green: 0.83, blue: 1))
                .cornerRadius(43.75)

            Text(option.name)
                .font(
                    Font.custom("Prompt", size: 16).weight(.medium)
                )
                .foregroundColor(Color(red: 0.01, green: 0.03, blue: 0.11).opacity(0.8))
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(option.description)
                .font(
                    Font.custom("Prompt", size: 16).weight(.medium)
                )
                .multilineTextAlignment(.trailing)
                .foregroundColor(Color(red: 0.4, green: 0.52, blue: 0.83))
                .frame(alignment: .trailing)
        }
        .padding(.leading, 12)
        .padding(.trailing, 24)
        .padding(.vertical, 10)
        .background(selected ? .white : Color(red: 0.93, green: 0.95, blue: 1))
        .cornerRadius(40)
        .overlay(
            RoundedRectangle(cornerRadius: 40)
                .stroke(Color(red: 0.4, green: 0.52, blue: 0.83).opacity(selected ? 0.6 : 0), lineWidth: 2)
        )
    }
}

struct ConfigView_Previews: PreviewProvider {
    static var previews: some View {
        ConfigView(options: [.init(id: 0, name: "Mythical god", description: "Rogue"),
                             .init(id: 1, name: "Anime hero", description: "Noble"),
                             .init(id: 2, name: "Realtime AI", description: "Kind")],
                   selectedOption: .constant(nil),
                   onConfirmConfig: { _ in })
        .frame(width: 310)
    }
}
