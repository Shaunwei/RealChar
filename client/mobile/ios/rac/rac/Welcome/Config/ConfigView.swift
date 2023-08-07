//
//  ConfigView.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI
import CachedAsyncImage
import AVFAudio
import Shimmer

struct CharacterOption: Identifiable, Equatable, Codable {
    let id: String
    let name: String
    let description: String?
    let imageUrl: URL?
    let authorName: String
    let source: String

    enum CodingKeys: String, CodingKey {
        case id = "character_id"
        case name
        case description
        case imageUrl = "image_url"
        case authorName = "author_name"
        case source
    }
}

struct ConfigView: View {
    @EnvironmentObject private var preferenceSettings: PreferenceSettings

    let options: [CharacterOption]
    let hapticFeedback: Bool
    @Binding var selectedOption: CharacterOption?
    @Binding var openMic: Bool
    let onConfirmConfig: (CharacterOption) -> Void
    let loadCharacters: () async -> Void

    @State private var showCommunityCharacters = false

    private var displayOptions: [CharacterOption] {
        options.filter({ option in
            option.source != "community" || preferenceSettings.includedCommunityCharacterIds.contains(option.id)
        })
            .sorted(by: { option1, option2 in
                option1.source > option2.source
            })
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(alignment: .leading, spacing: 20) {
                Text("Choose your partner")
                    .font(
                        Font.custom("Prompt", size: 18).weight(.medium)
                    )

                ScrollViewReader { scrollView in
                    List {
                        if !options.isEmpty {
                            ForEach(displayOptions) { option in
                                    CharacterOptionView(option: option,
                                                        selected: option == selectedOption,
                                                        showRemoveButton: option.source == "community",
                                                        onTap: {
                                        withAnimation {
                                            if selectedOption == option {
                                                selectedOption = nil
                                            } else {
                                                selectedOption = option
                                            }
                                        }
                                    },
                                                        onRemove: {
                                        withAnimation {
                                            preferenceSettings.includedCommunityCharacterIds.removeAll(where: { $0 == option.id })
                                            if selectedOption == option {
                                                selectedOption = nil
                                            }
                                        }
                                    })
                                    .listRowBackground(Color.clear)
                                    .listRowSeparator(.hidden)
                                    .padding(2)
                                    .listRowInsets(.init(top: 0, leading: 0, bottom: 20, trailing: 0))
                                }
                        } else {
                            ForEach(0..<6) { id in
                                CharacterOptionView(option: .init(id: String(id),
                                                                  name: "Placeholder",
                                                                  description: "",
                                                                  imageUrl: nil,
                                                                  authorName: "",
                                                                  source: "default"))
                                .redacted(reason: .placeholder)
                                .shimmering()
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                                .padding(2)
                                .listRowInsets(.init(top: 0, leading: 0, bottom: 20, trailing: 0))
                            }
                        }
                    }
                    .scrollIndicators(.hidden)
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .onChange(of: selectedOption) { _ in
                        if let selectedOption {
                            withAnimation {
                                scrollView.scrollTo(selectedOption.id)
                            }
                        }
                    }
                    .onChange(of: preferenceSettings.includedCommunityCharacterIds) { _ in
                        if let selectedOption {
                            withAnimation {
                                scrollView.scrollTo(selectedOption.id)
                            }
                        }
                    }
                    .refreshable {
                        await loadCharacters()
                    }
                }

                if options.contains(where: { $0.source == "community" && !preferenceSettings.includedCommunityCharacterIds.contains($0.id) }) {
                    CharacterOptionView(option: .init(id: UUID().uuidString,
                                                      name: "Select from community",
                                                      description: "",
                                                      imageUrl: URL(string: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Noun_Project_Community_icon_986471.svg/100px-Noun_Project_Community_icon_986471.svg.png")!,
                                                      authorName: "",
                                                      source: "default"),
                                        onTap: {
                        showCommunityCharacters = true
                    })
                }

                Toggle(isOn: $openMic) {
                    Text("Wearing headphone?")
                        .font(
                            Font.custom("Prompt", size: 16)
                        )
                }
                .tint(.accentColor)
                .padding(.trailing, 2)

                CtaButton(style: .primary, action: {
                    guard let selectedOption else { return }
                    onConfirmConfig(selectedOption)
                }, text: "Get started")
                .disabled(selectedOption == nil)
            }
            .padding(.bottom, geometry.safeAreaInsets.bottom > 0 ? 0 : 20)
        }
        .sheet(isPresented: $showCommunityCharacters) {
            NavigationView {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        if !options.isEmpty {
                            ForEach(options.filter({ option in
                                option.source == "community" && !preferenceSettings.includedCommunityCharacterIds.contains(option.id)
                            })) { option in
                                CharacterOptionView(option: option,
                                                    onTap: {
                                    withAnimation {
                                        preferenceSettings.includedCommunityCharacterIds.append(option.id)
                                        showCommunityCharacters = false
                                        selectedOption = option
                                    }
                                })
                            }
                        }
                    }
                    .padding(2)
                }
                .padding(.horizontal, 48)
                .navigationTitle("Select from community")
                .navigationBarTitleDisplayMode(.inline)
            }
            .navigationViewStyle(StackNavigationViewStyle())
        }
        .onAppear {
            openMic = headphoneOrBluetoothDeviceConnected
        }
    }

    var headphoneOrBluetoothDeviceConnected: Bool {
        !AVAudioSession.sharedInstance().currentRoute.outputs.compactMap {
            ($0.portType == .headphones ||
             $0.portType == .headsetMic ||
             $0.portType == .bluetoothA2DP ||
             $0.portType == .bluetoothHFP ||
             $0.portType == .bluetoothLE) ? true : nil
        }.isEmpty
    }
}

struct CharacterOptionView: View {
    @Environment(\.colorScheme) var colorScheme

    let option: CharacterOption
    var selected: Bool = false
    var showRemoveButton: Bool = false
    var onTap: (() -> Void)? = nil
    var onRemove: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            HStack(alignment: .center, spacing: 8) {
                ZStack {
                    Rectangle()
                        .foregroundColor(.clear)
                        .frame(width: 40, height: 40)
                        .background(Color(red: 0.76, green: 0.83, blue: 1))
                        .cornerRadius(20)
                    if let imageUrl = option.imageUrl {
                        CachedAsyncImage(url: imageUrl) { phase in
                            switch phase {
                            case .empty:
                                ProgressView()
                            case .success(let image):
                                image.resizable()
                            default:
                                Image(systemName: "wifi.slash")
                            }
                        }
                        .scaledToFit()
                        .frame(width: 36, height: 36)
                        .cornerRadius(18)
                    }
                }

                Text(option.name)
                    .font(
                        Font.custom("Prompt", size: 16).weight(.medium)
                    )
                    .lineLimit(2)
                    .foregroundColor(colorScheme == .dark ? .white : Color(red: 0.01, green: 0.03, blue: 0.11).opacity(0.8))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if !option.authorName.isEmpty {
                Text("by \(option.authorName)")
                    .font(
                        Font.custom("Prompt", size: 12).weight(.medium)
                    )
                    .lineLimit(2)
                    .multilineTextAlignment(.trailing)
                    .foregroundColor(colorScheme == .dark ? .white: Color(red: 0.4, green: 0.52, blue: 0.83))
                    .frame(alignment: .trailing)
            }

            if showRemoveButton {
                Button {
                    onRemove?()
                } label: {
                    Image(systemName: "xmark.circle")
                }
                .buttonStyle(CustomButtonStyle())
            }
        }
        .padding(.leading, 12)
        .padding(.trailing, 24)
        .padding(.vertical, 10)
        .background(colorScheme == .dark ? (selected ? .white.opacity(0.2) : .white.opacity(0.1)) : (selected ? .white : Color(red: 0.93, green: 0.95, blue: 1)))
        .cornerRadius(40)
        .overlay(
            RoundedRectangle(cornerRadius: 40)
                .stroke((colorScheme == .dark ? Color(red: 0.65, green: 0.75, blue: 1).opacity(selected ? 1 : 0) : Color(red: 0.4, green: 0.52, blue: 0.83).opacity(selected ? 0.6 : 0)), lineWidth: 2)
        )
        .onTapGesture {
            onTap?()
        }
    }
}

struct ConfigView_Previews: PreviewProvider {
    static var previews: some View {
        ConfigView(options: [
            .init(id: "god",
                  name: "Mythical god",
                  description: "Rogue",
                  imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/loki.png")!,
                  authorName: "",
                  source: "default"),
            .init(id: "hero",
                  name: "Anime hero",
                  description: "Noble",
                  imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/raiden.png")!,
                  authorName: "",
                  source: "default"),
            .init(id: "ai",
                  name: "Realtime AI",
                  description: "Kind",
                  imageUrl: URL(string: "https://storage.googleapis.com/assistly/static/realchar/ai_helper.png")!,
                  authorName: "",
                  source: "default")],
                   hapticFeedback: false,
                   selectedOption: .constant(nil),
                   openMic: .constant(false),
                   onConfirmConfig: { _ in },
                   loadCharacters: {})
        .frame(width: 310)
    }
}
