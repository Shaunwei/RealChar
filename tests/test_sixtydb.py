import ast
import asyncio
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from contextlib import ExitStack, nullcontext
from pathlib import Path
from typing import cast
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import yaml

from realtime_ai_character.audio.text_to_speech import get_text_to_speech
from realtime_ai_character.audio.text_to_speech import sixtydb as module
from realtime_ai_character.utils import Character, Singleton


# Real mono 24 kHz MP3 silence encoded with libmp3lame (32 kbps).
MP3 = base64.b64decode(
    "//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
    "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExFMAAANIAAAAAFVVVVVVVVVVVVVV"
    "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
    "VVVVVVVVVVVVVVVV//NExKYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
    "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
)


class AudioStream(httpx.AsyncByteStream):
    def __init__(self, chunks, started=None, release=None, error=None):
        self.chunks = chunks
        self.started = started
        self.release = release
        self.error = error
        self.closed = False

    async def __aiter__(self):
        if self.started is not None:
            self.started.set()
        if self.release is not None:
            await self.release.wait()
        for chunk in self.chunks:
            yield chunk
            await asyncio.sleep(0)
        if self.error is not None:
            raise self.error

    async def aclose(self):
        self.closed = True


class SixtyDBTests(unittest.IsolatedAsyncioTestCase):
    def client(self, handler):
        original = httpx.AsyncClient
        clients = []

        def make_client(**kwargs):
            client = original(transport=httpx.MockTransport(handler), **kwargs)
            clients.append(client)
            return client

        return patch.object(module.httpx, "AsyncClient", side_effect=make_client), clients

    def provider(self, **kwargs):
        return module.SixtyDB(api_key="test-key", **kwargs)

    @unittest.skipUnless(shutil.which("ffmpeg"), "project audio setup requires ffmpeg")
    async def test_mp3_fixture_decodes_with_project_audio_tool(self):
        decoded = subprocess.run(
            ["ffmpeg", "-v", "error", "-f", "mp3", "-i", "pipe:0", "-f", "s16le", "pipe:1"],
            input=MP3,
            capture_output=True,
            check=True,
        )
        self.assertTrue(decoded.stdout)

    async def test_binary_mp3_contract_buffers_complete_asset(self):
        requests = []
        body = AudioStream([MP3[:50], MP3[50:]])

        def handler(request):
            requests.append(request)
            return httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, stream=body)

        context, clients = self.client(handler)
        websocket = types.SimpleNamespace(send_bytes=AsyncMock(), send_json=AsyncMock())
        with context:
            await self.provider(model="60db-fast-v01", speed=1.5).stream(
                "Hello", websocket, asyncio.Event(), voice_id="workspace-id", language="hi-IN"
            )
        websocket.send_bytes.assert_awaited_once_with(MP3)
        websocket.send_json.assert_not_called()
        request = requests[0]
        self.assertEqual(str(request.url), "https://api.60db.ai/tts-synthesize")
        self.assertEqual(request.headers["Authorization"], "Bearer test-key")
        self.assertEqual(
            json.loads(request.content),
            {
                "text": "Hello",
                "voice_id": "workspace-id",
                "speed": 1.5,
                "output_format": "mp3",
                "target_language": "hi",
                "model_id": "60db-fast-v01",
            },
        )
        self.assertTrue(body.closed)
        self.assertTrue(clients[0].is_closed)

    async def test_documented_json_envelopes_and_default_voice(self):
        encoded = base64.b64encode(MP3).decode()
        for record in [
            {"success": True, "audio_base64": encoded, "encoding": "mp3", "output_format": "mp3"},
            {
                "success": True,
                "backendResponse": {"success": True, "audio_base64": encoded, "encoding": "mp3"},
            },
        ]:
            with self.subTest(record=record):

                def handler(request):
                    self.assertEqual(
                        json.loads(request.content)["voice_id"], "default-workspace-id"
                    )
                    return httpx.Response(200, json=record)

                context, _ = self.client(handler)
                with context:
                    audio = await self.provider(voice_id="default-workspace-id").generate_audio(
                        "Hello"
                    )
                self.assertEqual(audio, MP3)

    async def test_failed_or_incompatible_responses_never_send_audio(self):
        responses = [
            httpx.Response(401, text="sensitive-provider-error"),
            httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, content=b""),
            httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, content=b"RIFFwav"),
            httpx.Response(
                200,
                headers={"Content-Type": "audio/mpeg", "X-Audio-Encoding": "LINEAR16"},
                content=MP3,
            ),
            httpx.Response(200, headers={"Content-Type": "audio/pcm"}, content=b"\x00\x00"),
            httpx.Response(
                200, headers={"Content-Type": "application/x-ndjson"}, content=b'{"result":{}}'
            ),
            httpx.Response(200, json={"success": False}),
            httpx.Response(200, json={"backendResponse": {"success": False}}),
            httpx.Response(200, json={"audio_base64": "bad!"}),
            httpx.Response(
                200, json={"audio_base64": base64.b64encode(MP3).decode(), "encoding": "LINEAR16"}
            ),
            httpx.Response(200, json={"type": "error"}),
            httpx.Response(200, json=[]),
            httpx.Response(200, json={}),
            httpx.Response(200, json={"audio_base64": base64.b64encode(b"ID3").decode()}),
        ]
        for response in responses:
            with self.subTest(response=response):
                context, _ = self.client(lambda request: response)
                websocket = types.SimpleNamespace(send_bytes=AsyncMock())
                with context, self.assertRaises((ValueError, KeyError, httpx.HTTPStatusError)):
                    await self.provider().stream("Hello", websocket, asyncio.Event(), voice_id="id")
                websocket.send_bytes.assert_not_called()
                self.assertTrue(response.is_closed)

    async def test_failed_partial_read_never_sends_audio(self):
        body = AudioStream([MP3[:50]], error=httpx.ReadError("connection failed"))
        context, _ = self.client(
            lambda request: httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, stream=body)
        )
        websocket = types.SimpleNamespace(send_bytes=AsyncMock())
        with context, self.assertRaises(httpx.ReadError):
            await self.provider().stream("Hello", websocket, asyncio.Event(), voice_id="id")
        websocket.send_bytes.assert_not_called()
        self.assertTrue(body.closed)

    async def test_task_cancellation_closes_active_async_response(self):
        started, release = asyncio.Event(), asyncio.Event()
        body = AudioStream([MP3], started, release)
        context, clients = self.client(
            lambda request: httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, stream=body)
        )
        websocket = types.SimpleNamespace(send_bytes=AsyncMock())
        with context:
            task = asyncio.create_task(
                self.provider().stream("Hello", websocket, asyncio.Event(), voice_id="id")
            )
            await asyncio.wait_for(started.wait(), 2)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
        websocket.send_bytes.assert_not_called()
        self.assertTrue(body.closed)
        self.assertTrue(clients[0].is_closed)

    async def test_event_cancellation_drops_buffered_audio(self):
        started, release, event = asyncio.Event(), asyncio.Event(), asyncio.Event()
        body = AudioStream([MP3], started, release)
        context, _ = self.client(
            lambda request: httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, stream=body)
        )
        websocket = types.SimpleNamespace(send_bytes=AsyncMock())
        with context:
            task = asyncio.create_task(
                self.provider().stream("Hello", websocket, event, voice_id="id")
            )
            await asyncio.wait_for(started.wait(), 2)
            event.set()
            release.set()
            await task
        websocket.send_bytes.assert_not_called()
        self.assertTrue(body.closed)

    async def test_missing_voice_validation_twilio_and_pre_cancel_do_not_request(self):
        with patch.object(module.httpx, "AsyncClient") as client:
            provider = self.provider()
            for text, voice in [("Hello", ""), (" ", "id"), ("x" * 5001, "id")]:
                with self.assertRaises(ValueError):
                    await provider.generate_audio(text, voice_id=voice)
            with self.assertRaises(ValueError):
                await provider.stream(
                    "Hello", None, asyncio.Event(), voice_id="id", platform="twilio"
                )
            event = asyncio.Event()
            event.set()
            await provider.stream("Hello", None, event, voice_id="id")
            client.assert_not_called()
        for speed in [0.4, 2.1, True, float("nan"), float("inf")]:
            with self.assertRaises(ValueError):
                self.provider(speed=speed)
        for timeout in [0, True, float("nan")]:
            with self.assertRaises(ValueError):
                self.provider(timeout=timeout)

    async def test_factory_uses_server_environment_and_preserves_explicit_voice(self):
        with patch.dict(
            os.environ,
            {
                "SIXTYDB_API_KEY": "env-key",
                "SIXTYDB_VOICE_ID": "env-voice",
                "SIXTYDB_MODEL": "60db-fast-v01",
            },
            clear=True,
        ), patch.dict(Singleton._instances, {}, clear=True):
            provider = get_text_to_speech("SIXTYDB")
            self.assertIs(provider, get_text_to_speech("SIXTYDB"))
            self.assertIsInstance(provider, module.SixtyDB)
            self.assertEqual(provider.api_key, "env-key")
            self.assertEqual(provider.voice_id, "env-voice")

            def handler(request):
                self.assertEqual(
                    json.loads(request.content)["voice_id"], "character-workspace-voice"
                )
                return httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, content=MP3)

            context, _ = self.client(handler)
            with context:
                self.assertEqual(
                    await provider.generate_audio("Hello", voice_id="character-workspace-voice"),
                    MP3,
                )
        with patch.dict(os.environ, {}, clear=True), patch.dict(
            Singleton._instances, {}, clear=True
        ):
            with self.assertRaisesRegex(ValueError, "SIXTYDB_API_KEY"):
                get_text_to_speech("SIXTYDB")
            with self.assertRaises(NotImplementedError):
                get_text_to_speech("UNKNOWN_PROVIDER")

    async def test_existing_factory_defaults_and_missing_optional_keys_remain_edge(self):
        edge = types.ModuleType("realtime_ai_character.audio.text_to_speech.edge_tts")
        edge.EdgeTTS = MagicMock()
        with patch.dict(sys.modules, {edge.__name__: edge}), patch.dict(os.environ, {}, clear=True):
            for selection in [None, "", "EDGE_TTS", "ELEVEN_LABS", "GOOGLE_TTS", "XTTS"]:
                with self.subTest(selection=selection):
                    self.assertIs(
                        get_text_to_speech(selection), edge.EdgeTTS.get_instance.return_value
                    )
            self.assertEqual(edge.EdgeTTS.initialize.call_count, 6)

    async def test_http_failure_does_not_expose_provider_body_or_key(self):
        context, _ = self.client(lambda request: httpx.Response(403, text="sensitive-body"))
        with context, self.assertRaises(httpx.HTTPStatusError) as caught:
            await self.provider().generate_audio("Hello", voice_id="id")
        self.assertNotIn("sensitive-body", str(caught.exception))
        self.assertNotIn("test-key", str(caught.exception))

    async def test_real_catalog_yaml_load_and_factory_path(self):
        # Execute the unchanged catalog loader without booting Firebase/Chroma.
        # The complete application's optional database dependencies are not
        # required for this voice/provider configuration contract check.
        root = Path(__file__).resolve().parents[1]
        source = ast.parse(
            (root / "realtime_ai_character/character_catalog/catalog_manager.py").read_text()
        )
        catalog = next(
            node
            for node in source.body
            if isinstance(node, ast.ClassDef) and node.name == "CatalogManager"
        )
        method = next(
            node
            for node in catalog.body
            if isinstance(node, ast.FunctionDef) and node.name == "load_character"
        )
        namespace = {
            "ExitStack": ExitStack,
            "cast": cast,
            "yaml": yaml,
            "os": os,
            "Character": Character,
            "Path": Path,
        }
        exec(
            compile(
                ast.Module(body=[method], type_ignores=[]),
                str(root / "realtime_ai_character/character_catalog/catalog_manager.py"),
                "exec",
            ),
            namespace,
        )
        manager = types.SimpleNamespace(
            sql_load_lock=types.SimpleNamespace(gen_rlock=nullcontext), characters={}
        )
        fixture = {
            "character_id": "test_narrator",
            "character_name": "Narrator",
            "system": "Speak clearly",
            "user": "{query}",
            "voice_id": "yaml-workspace-voice",
            "text_to_speech_use": "SIXTYDB",
            "rebyte_api_project_id": None,
            "rebyte_api_agent_id": None,
        }
        with tempfile.TemporaryDirectory() as directory, patch.dict(
            os.environ,
            {"SIXTYDB_API_KEY": "env-key", "TEST_NARRATOR_VOICE_ID": "override-workspace-voice"},
            clear=True,
        ), patch.dict(Singleton._instances, {}, clear=True):
            path = Path(directory)
            (path / "config.yaml").write_text(yaml.safe_dump(fixture))
            namespace["load_character"](manager, path, "default")
            character = manager.characters["test_narrator"]
            self.assertEqual(character.tts, "SIXTYDB")
            self.assertEqual(character.voice_id, "override-workspace-voice")
            provider = get_text_to_speech(character.tts)

            def handler(request):
                self.assertEqual(json.loads(request.content)["voice_id"], character.voice_id)
                return httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, content=MP3)

            context, _ = self.client(handler)
            websocket = types.SimpleNamespace(send_bytes=AsyncMock())
            with context:
                await provider.stream(
                    "Hello", websocket, asyncio.Event(), voice_id=character.voice_id
                )
            websocket.send_bytes.assert_awaited_once_with(MP3)


if __name__ == "__main__":
    unittest.main()
