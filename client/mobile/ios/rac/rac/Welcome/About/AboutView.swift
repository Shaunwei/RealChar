//
//  AboutView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI

struct AboutView: View {

    var body: some View {
        ScrollView {
            VStack(alignment: .leading) {

                Spacer(minLength: 24)

                Text("RealChar")
                    .font(
                        Font.custom("Prompt", size: 16).weight(.semibold)
                    )
                    .foregroundColor(Color(red: 0.4, green: 0.52, blue: 0.83))
                + Text(" is a revolutionary project enabling dynamic audio-visual interactions between humans and AI.\n\nPowered by Language Learning Model (LLM), it offers instant, natural, and context-aware responses, paving the way for a new era of interactive AI experiences.\n\nDisclaimer: Fictional characters for entertainment purposes only.")
                    .font(
                        Font.custom("Prompt", size: 16).weight(.regular)
                    )

                Spacer(minLength: 40)

                Text("Authors")
                    .font(
                        Font.custom("Prompt", size: 16).weight(.semibold)
                    )
                    .foregroundColor(Color(red: 0.4, green: 0.52, blue: 0.83))

                Text("Shaunwei, lynchee-owo, ZongZiWang, pycui")
                    .font(
                        Font.custom("Prompt", size: 16).weight(.regular)
                    )

                Spacer(minLength: 40)

                Text("RealChar is Open Source")
                    .font(
                        Font.custom("Prompt", size: 16).weight(.semibold)
                    )
                    .foregroundColor(Color(red: 0.4, green: 0.52, blue: 0.83))

                Spacer(minLength: 20)

                CtaButton(style: .primary, action: {
                    UIApplication.shared.open(URL(string: "https://github.com/Shaunwei/RealChar")!)
                }, text: "Contribute")
            }
        }
    }
}

struct AboutView_Previews: PreviewProvider {
    static var previews: some View {
        AboutView()
            .frame(width: 310)
    }
}
