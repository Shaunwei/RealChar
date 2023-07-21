//
//  AudioPlayer.swift
//  rac
//
//  Created by ZongZiWang on 7/13/23.
//

import Foundation
import AVFoundation

class AudioPlayer: NSObject, ObservableObject {
    private var audioPlayer: AVAudioPlayer?
    @Published var isPlaying = false

    private var pendingData: [Data] = []

    func playAudio(data: Data, checkPlaying: Bool = true) {
        if checkPlaying && isPlaying {
            pendingData.append(data)
            return
        }

        do {
            audioPlayer = try AVAudioPlayer(data: data)
            audioPlayer?.delegate = self
            audioPlayer?.play()
            DispatchQueue.main.async {
                self.isPlaying = true
            }
        } catch {
            print("Error playing audio: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.isPlaying = false
            }
        }
    }

    func pauseAudio() {
        audioPlayer?.pause()
        pendingData.removeAll()
        DispatchQueue.main.async {
            self.isPlaying = false
        }
    }

    func resumeAudio() {
        audioPlayer?.play()
        DispatchQueue.main.async {
            self.isPlaying = true
        }
    }

    func togglePlayback() {
        if isPlaying {
            pauseAudio()
        } else {
            resumeAudio()
        }
    }
}

extension AudioPlayer: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if let nextAudioToPlay = pendingData.first {
            playAudio(data: nextAudioToPlay, checkPlaying: false)
            pendingData.remove(at: 0)
        } else {
            DispatchQueue.main.async {
                self.isPlaying = false
            }
        }
    }
}
