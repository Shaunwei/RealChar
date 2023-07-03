import replicate

# sample image and audio
image_path = "../../training_data/raiden2.jpeg"
audio_path = "../../training_data/1.mp3"

output = replicate.run(
    "devxpy/cog-wav2lip:8d65e3f4f4298520e079198b493c25adfc43c058ffec924f2aefc8010ed25eef",
    input={"face": open(image_path, "rb"),
           "audio": open(audio_path, "rb")}
)

print(output)