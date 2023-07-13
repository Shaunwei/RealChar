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
    private var isPlaying = false

    func playAudio(data: Data) {
        do {
            audioPlayer = try AVAudioPlayer(data: data)
            audioPlayer?.delegate = self
            audioPlayer?.play()
            isPlaying = true
        } catch {
            print("Error playing audio: \(error.localizedDescription)")
        }
    }

    func pauseAudio() {
        audioPlayer?.pause()
        isPlaying = false
    }

    func resumeAudio() {
        audioPlayer?.play()
        isPlaying = true
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
        isPlaying = false
    }
}
