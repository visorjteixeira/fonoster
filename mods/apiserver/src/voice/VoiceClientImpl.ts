/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Stream } from "stream";
import { AuthzClient } from "@fonoster/authz";
import {
  GrpcError,
  RecordFormat,
  SayOptions,
  StreamEvent,
  VoiceClientConfig,
  VoiceIn,
  VoiceSessionStreamClient
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AudioSocket } from "@fonoster/streams";
import * as grpc from "@grpc/grpc-js";
import { Bridge, Client } from "ari-client";
import { pickPort } from "pick-port";
import {
  AUTHZ_SERVICE_ENABLED,
  AUTHZ_SERVICE_HOST,
  AUTHZ_SERVICE_PORT
} from "../envs";
import { SpeechResult } from "./stt/types";
import { transcribeOnConnection } from "./transcribeOnConnection";
import {
  AriEvent,
  GRPCClient,
  SpeechToText,
  TextToSpeech,
  VoiceClient
} from "./types";
import { createExternalMediaConfig } from "./utils/createExternalMediaConfig";
import { VoiceServiceClientConstructor } from "./utils/VoiceServiceClientConstructor";
import { awaitForRecordingFinished } from "./handlers/utils/awaitForRecordingFinished";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class VoiceClientImpl implements VoiceClient {
  config: VoiceClientConfig;
  verbsStream: Stream;
  transcriptionsStream: Stream;
  voice: VoiceSessionStreamClient;
  tts: TextToSpeech;
  stt: SpeechToText;
  grpcClient: GRPCClient;
  audioSocket: AudioSocket;
  asStream: Stream;
  ari: Client;
  bridge: Bridge;
  filesServer;

  constructor(
    params: {
      ari: Client;
      config: VoiceClientConfig;
      tts: TextToSpeech;
      stt: SpeechToText;
    },
    filesServer
  ) {
    const { config, tts, stt, ari } = params;
    this.config = config;
    this.verbsStream = new Stream();
    this.transcriptionsStream = new Stream();
    this.tts = tts;
    this.stt = stt;
    this.ari = ari;
    this.filesServer = filesServer;
  }

  async connect() {
    if (AUTHZ_SERVICE_ENABLED) {
      const { sessionRef: channelId } = this.config;
      const { ari } = this;

      try {
        const authz = new AuthzClient(
          `${AUTHZ_SERVICE_HOST}:${AUTHZ_SERVICE_PORT}`
        );
        const authorized = await authz.checkSessionAuthorized({
          accessKeyId: this.config.accessKeyId
        });

        if (!authorized) {
          logger.verbose("rejected unauthorized session", { channelId });

          await ari.channels.answer({ channelId });
          await ari.channels.play({ channelId, media: "sound:unavailable" });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await ari.channels.hangup({ channelId });
          return;
        }
      } catch (e) {
        logger.error("authz service error", e);

        await ari.channels.answer({ channelId });
        await ari.channels.play({ channelId, media: "sound:unavailable" });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await ari.channels.hangup({ channelId });
        return;
      }
    }

    this.grpcClient = new VoiceServiceClientConstructor(
      this.config.endpoint,
      grpc.credentials.createInsecure()
    ) as unknown as GRPCClient;

    const metadata = new grpc.Metadata();
    metadata.add("accessKeyId", this.config.accessKeyId);
    metadata.add("token", this.config.sessionToken);

    this.voice = this.grpcClient.createSession(metadata);

    this.voice.on(StreamEvent.DATA, (data: VoiceIn) => {
      this.verbsStream.emit(data.content, data);
    });

    this.voice.write({ request: this.config });

    this.voice.on(StreamEvent.ERROR, (error: GrpcError) => {
      if (error.code === grpc.status.UNAVAILABLE) {
        // FIXME: This error should be sent back to the user
        logger.error(`voice server not available at "${this.config.endpoint}"`);
        return;
      }
      logger.error(error.message);
    });

    const externalMediaPort = await pickPort({ type: "tcp" });

    this.setupAudioSocket(externalMediaPort);
    await this.setupExternalMedia(externalMediaPort);
  }

  setupAudioSocket(port: number) {
    this.audioSocket = new AudioSocket();

    this.audioSocket.onConnection(
      transcribeOnConnection(this.transcriptionsStream)
    );

    this.audioSocket.listen(port, () => {
      logger.verbose("starting audio socket for voice client", {
        port,
        appRef: this.config.appRef
      });
    });
  }

  on(type: string, callback: (data: VoiceIn) => void) {
    if (!type) return;

    this.verbsStream.on(type.toString(), (data: VoiceIn) => {
      //@ts-ignore
      const text = data.sayRequest?.text;
      if (text) {
        // Get call headers
        if (text.startsWith("Header:")) {
          this.getCallHeaders(
            this.config.sessionRef,
            text.replace("Header:", "").split(";")
          );
          return;
        }

        // Send audio to client
        if (text.startsWith("Stream:")) {
          const streamBase64 = text.replace("Stream:", "");
          this.transcriptionsStream.emit("response_audio", streamBase64);
          this.sendResponse({
            sayResponse: {
              playbackRef: "Done Streaming"
            }
          });
          return;
        }

        // Record audio
        if (text.startsWith("Record:")) {
          const data = JSON.parse(text.replace("Record:", ""));
          this.startRecording(
            this.config.sessionRef,
            data.name,
            data.maxDuration,
            data.maxSilence
          );
          return;
        }
      }
      callback(data[type]);
    });
  }

  private async startRecording(
    sessionRef: string,
    name: string,
    maxDuration: number,
    maxSilence: number
  ) {
    await this.ari.channels.record({
      channelId: sessionRef,
      format: RecordFormat.WAV,
      name,
      beep: false,
      maxDurationSeconds: maxDuration,
      maxSilenceSeconds: maxSilence
    });

    awaitForRecordingFinished(this.ari, name)
      .then(({ duration }) => {
        this.sendResponse({
          sayResponse: {
            playbackRef: JSON.stringify({
              duration,
              name
            })
          }
        });
      })
      .catch(() => {
        this.sendResponse({
          sayResponse: {
            playbackRef: "Recording failed"
          }
        });
      });
  }

  /**
   * Get call headers from the channel
   * @param sessionRef - The session reference
   * @param headers - The headers to get
   */
  private async getCallHeaders(sessionRef: string, headers: string[]) {
    const callHeaders = {};
    for (const header of headers) {
      const channelVar = await this.ari.channels.getChannelVar({
        channelId: sessionRef,
        variable: `PJSIP_HEADER(read,${header})`
      });
      if (channelVar?.value) {
        callHeaders[header] = channelVar?.value;
      }
    }
    this.sendResponse({
      sayResponse: {
        playbackRef: JSON.stringify(callHeaders)
      }
    });
  }

  sendResponse(response: VoiceIn): void {
    this.voice.write(response);
  }

  getTranscriptionsStream() {
    return this.transcriptionsStream;
  }

  async setupExternalMedia(port: number) {
    try {
        // Create bridge
        const bridge = this.ari.Bridge();
        await bridge.create({ type: "mixing" });
        this.bridge = bridge;

        // Create external media channel
        const externalMediaChannel = this.ari.Channel();
        
        // Configure external media with bidirectional audio
        const config = createExternalMediaConfig(port);
        externalMediaChannel.externalMedia(config);

        // Handle channel start
        externalMediaChannel.once(AriEvent.STASIS_START, async (_, extChan) => {
            try {
                console.log(`External media channel started: ${extChan.id}`);
                await bridge.addChannel({ 
                    channel: [this.config.sessionRef, extChan.id] 
                });
                console.log("Channels bridged successfully");
            } catch (error) {
                console.error("Error bridging channels:", error);
                throw error;
            }
        });

        // Handle channel leaving bridge
        externalMediaChannel.once("ChannelLeftBridge", async () => {
            try {
                console.log("Channel left bridge, cleaning up...");
                await bridge.destroy();
            } catch (error) {
                console.error("Error destroying bridge:", error);
            }
        });

        // Optional: Handle channel destruction
        externalMediaChannel.once("ChannelDestroyed", () => {
            console.log("External media channel destroyed");
        });

    } catch (error) {
        console.error("Error in setupExternalMedia:", error);
        throw error;
    }
}

  async synthesize(text: string, options: SayOptions): Promise<string> {
    if (!this.tts) return null;

    const { ref, stream } = this.tts.synthesize(text, options);

    stream.on("error", async (error) => {
      logger.error(`stream error for ref ${ref}: ${error.message}`, {
        errorDetails: error.stack || "No stack trace"
      });
      this.filesServer.removeStream(ref);
    });

    this.filesServer.addStream(ref, stream);
    return ref;
  }

  async transcribe(): Promise<SpeechResult> {
    try {
      if (!this.stt) return {} as unknown as SpeechResult;
      return await this.stt.transcribe(this.transcriptionsStream);
    } catch (e) {
      logger.warn("transcription error", e);
      return {} as unknown as SpeechResult;
    }
  }

  startSpeechGather(
    callback: (stream: { speech: string; responseTime: number }) => void
  ) {
    if (!this.stt) return;

    const out = this.stt.streamTranscribe(this.transcriptionsStream);

    out.on("data", callback);

    out.on("error", async (error) => {
      logger.error("speech recognition error", { error });

      const { sessionRef: channelId } = this.config;
      const { ari } = this;

      ari.channels.hangup({ channelId });
    });
  }

  async startDtmfGather(
    sessionRef: string,
    callback: (event: { digit: string }) => void
  ) {
    const channel = await this.ari.channels.get({ channelId: sessionRef });

    channel.on(AriEvent.CHANNEL_DTMF_RECEIVED, (event) => {
      const { digit } = event;
      callback({ digit });
    });
  }

  // Stops both speech and dtmf gather
  async stopStreamGather() {
    throw new Error("Method 'stopStreamGather' not implemented.");
  }

  async waitForDtmf(params: {
    sessionRef: string;
    finishOnKey: string;
    maxDigits: number;
    timeout: number;
    onDigitReceived: () => void;
  }): Promise<{ digits: string }> {
    const { onDigitReceived, sessionRef, finishOnKey, maxDigits, timeout } =
      params;

    let result = "";
    let timeoutId = null;

    const channel = await this.ari.channels.get({ channelId: sessionRef });

    return new Promise((resolve) => {
      const resetTimer = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          channel.removeListener(AriEvent.CHANNEL_DTMF_RECEIVED, dtmfListener);
          resolve({ digits: result });
        }, timeout);
      };

      const dtmfListener = (event) => {
        const { digit } = event;

        // Stops the global timeout
        onDigitReceived();
        resetTimer();

        if (digit !== finishOnKey) {
          result += digit;
        }

        if (result.length >= maxDigits || digit === finishOnKey) {
          clearTimeout(timeoutId);
          channel.removeListener(AriEvent.CHANNEL_DTMF_RECEIVED, dtmfListener);
          resolve({ digits: result });
        }
      };

      channel.on(AriEvent.CHANNEL_DTMF_RECEIVED, dtmfListener);
      resetTimer(); // Start the initial timeout
    });
  }

  close() {
    try {
      this.voice.end();
      this.grpcClient.close();
      this.audioSocket.close();
    } catch (e) {
      // Do nothing
    }
  }
}

export { VoiceClientImpl };
