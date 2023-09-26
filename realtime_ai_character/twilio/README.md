# Twilio Integration
Two endpoints are exposed for twilio integration
1. twilio/voice (REST endpoint) to return a response of a [TwiML](https://www.twilio.com/docs/voice/twiml)
   connect stream to tell twilio to fork a bidirectional stream with the following websocket endpoint.

2. twilio/ws (websocket endpoint) that handles the bidirectional stream with twilio. 


## Quick start guide
* Run the server locally as demonstrated in the main project README.

* Use ngrok to expose your local server, register the ngrok exposed address to twilio console.

* Make the phone call to the number you get from twilio.

Follow twilio [documentation](https://www.twilio.com/docs/voice/quickstart/python)

