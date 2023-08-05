//
//  racApp.swift
//  rac
//
//  Created by ZongZiWang on 7/9/23.
//

import SwiftUI
//import FirebaseCore
import RealityKit

class AppDelegate: NSObject, UIApplicationDelegate {
  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
//    FirebaseApp.configure()

    return true
  }
}

@main
struct racApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var userSettings = UserSettings()
    @StateObject private var preferenceSettings = PreferenceSettings()
    private let webSocket = WebSocketClient()
    @State private var orbitImmersionStyle: ImmersionStyle = .mixed
    @State private var solarImmersionStyle: ImmersionStyle = .full

    var body: some SwiftUI.Scene {
        WindowGroup {
            RootView(webSocket: webSocket)
                .environmentObject(userSettings)
                .environmentObject(preferenceSettings)
        }
        .windowStyle(.plain)

        WindowGroup(id: "character") {
            ItemView(item: .robot_test)
                .dragRotation(yawLimit: .degrees(45), pitchLimit: .degrees(45))
//                .offset(z: modelDepth)
        }
        .windowStyle(.volumetric)
//        .defaultSize(width: 0.8, height: 0.8, depth: 0.8, in: .meters)

        ImmersiveSpace(id: "playground") {
            ItemView(item: .robot_test)
                .dragRotation(yawLimit: .degrees(45), pitchLimit: .degrees(45))
//                .offset(z: modelDepth)
                .placementGestures(initialPosition: Point3D([475, -1200.0, -1200.0]))
        }
        .immersionStyle(selection: $orbitImmersionStyle, in: .mixed)

        ImmersiveSpace(id: "full") {
            ZStack {
                ItemView(item: .robot_test)
                    .dragRotation(yawLimit: .degrees(45), pitchLimit: .degrees(45))
    //                .offset(z: modelDepth)
                    .placementGestures(initialPosition: Point3D([475, -1200.0, -1200.0]))

                Starfield()
            }
        }
        .immersionStyle(selection: $solarImmersionStyle, in: .full)
    }
}

extension View {
    /// Listens for gestures and places an item based on those inputs.
    func placementGestures(
        initialPosition: Point3D = .zero
    ) -> some View {
        self.modifier(
            PlacementGesturesModifier(
                initialPosition: initialPosition
            )
        )
    }
}

/// A modifier that adds gestures and positioning to a view.
private struct PlacementGesturesModifier: ViewModifier {
    var initialPosition: Point3D

    @State private var scale: Double = 1
    @State private var startScale: Double? = nil
    @State private var position: Point3D = .zero
    @State private var startPosition: Point3D? = nil

    func body(content: Content) -> some View {
        content
            .onAppear {
                position = initialPosition
            }
            .scaleEffect(scale)
            .position(x: position.x, y: position.y)
            .offset(z: position.z)

            // Enable people to move the model anywhere in their space.
            .simultaneousGesture(DragGesture(minimumDistance: 0.0, coordinateSpace: .global)
                .onChanged { value in
                    if let startPosition {
                        let delta = value.location3D - value.startLocation3D
                        position = startPosition + delta
                    } else {
                        startPosition = position
                    }
                }
                .onEnded { _ in
                    startPosition = nil
                }
            )

            // Enable people to scale the model within certain bounds.
            .simultaneousGesture(MagnifyGesture()
                .onChanged { value in
                    if let startScale {
                        scale = max(0.1, min(3, value.magnification * startScale))
                    } else {
                        startScale = scale
                    }
                }
                .onEnded { value in
                    startScale = scale
                }
            )
    }
}

/// A large sphere that has an image of the night sky on its inner surface.
///
/// When centered on the viewer, this entity creates the illusion of floating
/// in space.
struct Starfield: View {
    var body: some View {
        RealityView { content in
            // Create a material with a star field on it.
            guard let url = Bundle.main.url(forResource: "life_of_tree", withExtension: "jpg")
                               else {
                // If the asset isn't available, something is wrong with the app.
                fatalError("Unable to load starfield texture.")
            }

            do {
                let resource = try await TextureResource(contentsOf: url)

                var material = UnlitMaterial()
                material.color = .init(texture: .init(resource))

                // Attach the material to a large sphere.
                let entity = Entity()
                entity.components.set(ModelComponent(
                    mesh: .generateSphere(radius: 1000),
                    materials: [material]
                ))

                // Ensure the texture image points inward at the viewer.
                entity.scale *= .init(x: -1, y: 1, z: 1)

                content.add(entity)
            } catch {
                fatalError(error.localizedDescription)
            }


        }
    }
}
