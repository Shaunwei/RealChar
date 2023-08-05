//
//  ItemVIew.swift
//  rac
//
//  Created by ZongZiWang on 8/2/23.
//

import SwiftUI
#if os(xrOS)
import RealityKit

let modelDepth: Double = 200

/// The list of 3D models to display in the winow.
enum Item: String, CaseIterable, Identifiable {
    case batman, robot, test, robot_test
    var id: Self { self }
    var name: String { rawValue }
}

struct ItemView: View {
    var item: Item
    var orientation: SIMD3<Double> = .zero

    var body: some View {
        RealityView { content in
            // Add the initial RealityKit content
            if let scene = try? await Entity(named: item.name) {
                content.add(scene)
//                scene.transform.scale = [0.001, 0.001, 0.001]
                if !scene.availableAnimations.isEmpty {
                    scene.playAnimation(scene.availableAnimations[0].repeat(), transitionDuration: 0, startsPaused: false)
                }
            }
        } update: {  _ in
        }
//        Model3D(named: item.name) { model in
//            model.resizable()
//                .scaledToFit()
//                .rotation3DEffect(
//                    Rotation3D(
//                        eulerAngles: .init(angles: orientation, order: .xyz)
//                    )
//                )
//                .frame(depth: modelDepth)
//                .offset(z: -modelDepth / 2)
//        } placeholder: {
//            ProgressView()
//                .offset(z: -modelDepth * 0.75)
//        }
    }
}

extension View {
    /// Enables people to drag an entity to rotate it, with optional limitations
    /// on the rotation in yaw and pitch.
    func dragRotation(
        yawLimit: Angle? = nil,
        pitchLimit: Angle? = nil,
        sensitivity: Double = 10
    ) -> some View {
        self.modifier(
            DragRotationModifier(
                yawLimit: yawLimit,
                pitchLimit: pitchLimit,
                sensitivity: sensitivity
            )
        )
    }
}

/// A modifier converts drag gestures into entity rotation.
private struct DragRotationModifier: ViewModifier {
    var yawLimit: Angle?
    var pitchLimit: Angle?
    var sensitivity: Double

    @State private var baseYaw: Double = 0
    @State private var yaw: Double = 0
    @State private var basePitch: Double = 0
    @State private var pitch: Double = 0

    func body(content: Content) -> some View {
        content
            .rotation3DEffect(.radians(yaw == 0 ? 0.01 : yaw), axis: .y)
            .rotation3DEffect(.radians(pitch == 0 ? 0.01 : pitch), axis: .x)
            .gesture(DragGesture(minimumDistance: 0.0)
                .targetedToAnyEntity()
                .onChanged { value in
                    // Find the current linear displacement.
                    let location3D = value.convert(value.location3D, from: .local, to: .scene)
                    let startLocation3D = value.convert(value.startLocation3D, from: .local, to: .scene)
                    let delta = location3D - startLocation3D

                    // Use an interactive spring animation that becomes
                    // a spring animation when the gesture ends below.
                    withAnimation(.interactiveSpring) {
                        yaw = spin(displacement: Double(delta.x), base: baseYaw, limit: yawLimit)
                        pitch = spin(displacement: Double(delta.y), base: basePitch, limit: pitchLimit)
                    }
                }
                .onEnded { value in
                    // Find the current and predicted final linear displacements.
                    let location3D = value.convert(value.location3D, from: .local, to: .scene)
                    let startLocation3D = value.convert(value.startLocation3D, from: .local, to: .scene)
                    let predictedEndLocation3D = value.convert(value.predictedEndLocation3D, from: .local, to: .scene)
                    let delta = location3D - startLocation3D
                    let predictedDelta = predictedEndLocation3D - location3D

                    // Set the final spin value using a spring animation.
                    withAnimation(.spring) {
                        yaw = finalSpin(
                            displacement: Double(delta.x),
                            predictedDisplacement: Double(predictedDelta.x),
                            base: baseYaw,
                            limit: yawLimit)
                        pitch = finalSpin(
                            displacement: Double(delta.y),
                            predictedDisplacement: Double(predictedDelta.y),
                            base: basePitch,
                            limit: pitchLimit)
                    }

                    // Store the last value for use by the next gesture.
                    baseYaw = yaw
                    basePitch = pitch
                }
            )
    }

    /// Finds the spin for the specified linear displacement, subject to an
    /// optional limit.
    private func spin(
        displacement: Double,
        base: Double,
        limit: Angle?
    ) -> Double {
        if let limit {
            return atan(displacement * sensitivity) * (limit.degrees / 90)
        } else {
            return base + displacement * sensitivity
        }
    }

    /// Finds the final spin given the current and predicted final linear
    /// displacements, or zero when the spin is restricted.
    private func finalSpin(
        displacement: Double,
        predictedDisplacement: Double,
        base: Double,
        limit: Angle?
    ) -> Double {
        // If there is a spin limit, always return to zero spin at the end.
        guard limit == nil else { return 0 }

        // Find the projected final linear displacement, capped at 1 more revolution.
        let cap = .pi * 2.0 / sensitivity
        let delta = displacement + max(-cap, min(cap, predictedDisplacement))

        // Find the final spin.
        return base + delta * sensitivity
    }
}

/// Rotation information for an entity.
struct RotationComponent: Component {
    var speed: Float
    var axis: SIMD3<Float>

    init(speed: Float = 1.0, axis: SIMD3<Float> = [0, 1, 0]) {
        self.speed = speed
        self.axis = axis
    }
}

/// A system that rotates entities with a rotation component.
struct RotationSystem: System {
    static let query = EntityQuery(where: .has(RotationComponent.self))

    init(scene: RealityKit.Scene) {}

    func update(context: SceneUpdateContext) {
        for entity in context.entities(matching: Self.query, when: .rendering) {
            guard let component: RotationComponent = entity.components[RotationComponent.self] else { continue }
            entity.setOrientation(.init(angle: component.speed * Float(context.deltaTime), axis: component.axis), relativeTo: entity)
        }
    }
}
#endif
