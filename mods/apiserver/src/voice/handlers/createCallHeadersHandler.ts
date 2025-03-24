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
import { CallHeadersRequest, CallHeadersResponse } from "@fonoster/common";
import { Client } from "ari-client";
import { VoiceClient } from "../types";
import { withErrorHandling } from "./utils/withErrorHandling";

function createCallHeadersHandler(ari: Client, voiceClient: VoiceClient) {
  return withErrorHandling(async (request: CallHeadersRequest) => {
    const { sessionRef, headers } = request;

    const callHeaders = {} as CallHeadersResponse["headers"];

    for (const header of headers) {
      try {
        // Initialize the header with an empty string
        callHeaders[header] = "";
        // Get the channel variable
        const channelVar = await ari.channels.getChannelVar({
          channelId: sessionRef,
          variable: `PJSIP_HEADER(read,${header})`
        });
        // If the channel variable exists, set the header value
        if (channelVar?.value) {
          callHeaders[header] = channelVar?.value;
        }
      } catch (_) {}
    }

    // Send the call headers response
    voiceClient.sendResponse({
      callHeadersResponse: {
        sessionRef,
        headers: callHeaders
      }
    });
  });
}

export { createCallHeadersHandler };
