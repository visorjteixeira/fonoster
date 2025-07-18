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
import { CALL_CONTEXT, CALL_EXTENSION } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import ariClient from "ari-client";
import { connect } from "nats";
import {
  ASTERISK_SYSTEM_DOMAIN,
  ASTERISK_TRUNK,
  CALLS_CREATE_SUBJECT,
  DEFAULT_NATS_QUEUE_GROUP
} from "../envs";
import { CreateCallRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type CallManagerConfig = {
  natsUrl: string;
  ariProxyUrl: string;
  ariUsername: string;
  ariPassword: string;
};

async function createCreateCallSubscriber(config: CallManagerConfig) {
  const { natsUrl, ariProxyUrl, ariUsername, ariPassword } = config;

  try {
    logger.verbose("connecting to nats", { natsUrl });

    const nc = await connect({ servers: natsUrl, maxReconnectAttempts: -1 });

    logger.verbose("subscribing to call create subject", {
      subject: CALLS_CREATE_SUBJECT
    });

    const subscription = nc.subscribe(CALLS_CREATE_SUBJECT, {
      queue: DEFAULT_NATS_QUEUE_GROUP
    });

    logger.verbose("connecting to ari", { ariProxyUrl });

    const ariConn = await ariClient.connect(
      ariProxyUrl,
      ariUsername,
      ariPassword
    );

    subscription.callback = async (err, msg) => {
      if (err) {
        logger.error(err);
      }

      const { ref, from, to, appRef, accessKeyId, timeout, metadata } =
        msg.json() as CreateCallRequest & {
          ref: string;
          accessKeyId: string;
        };

      logger.verbose("received a new call request", {
        ...msg.json()
      });

      if (!to) {
        logger.error("to is required", { to });
        return;
      }

      const [sipAddress, uriParams] = to.split("?");
      if (!sipAddress) {
        logger.error("sip address is required", { to });
        return;
      }

      const [address, port = "5060"] = sipAddress.split(":");
      if (!address) {
        logger.error("address is required", { to });
        return;
      }

      const [number, uri] = address.split("@");
      if (!number) {
        logger.error("number is required", { to });
        return;
      }
      if (!uri) {
        logger.error("uri is required", { to });
        return;
      }

      // Gather all uri params
      const uriParamsMap: Record<string, string> = {};
      let transport = "UDP";
      uriParams?.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        if (key === "transport") {
          transport = value.toUpperCase();
        } else {
          uriParamsMap[`PJSIP_HEADER(add,${key})`] = value;
        }
      });

      console.log("START OUTGOING CALL", {
        number,
        uri,
        transport,
        port,
        from,
        uriParamsMap,
      });

      await ariConn.channels.originate({
        context: CALL_CONTEXT,
        extension: CALL_EXTENSION,
        endpoint: `PJSIP/${ASTERISK_TRUNK}/sip:${number}@${ASTERISK_SYSTEM_DOMAIN}`,
        timeout,
        variables: {
          "PJSIP_HEADER(add,X-Call-Ref)": ref,
          "PJSIP_HEADER(add,X-Dod-Number)": from,
          "PJSIP_HEADER(add,X-Access-Key-Id)": accessKeyId,
          "PJSIP_HEADER(add,X-Is-Api-Originated-Type)": "true",
          "PJSIP_HEADER(add,X-DOD-URI)": uri || "N/A",
          "PJSIP_HEADER(add,X-DOD-TRANSPORT)": transport,
          "PJSIP_HEADER(add,X-DOD-PORT)": port,
          "PJSIP_HEADER(add,X-DOD-FROM)": from,
          "PJSIP_HEADER(add,X-DOD-TO)": to,
          "PJSIP_HEADER(add,X-DOD-DIRECTION)": "outbound",
          ...uriParamsMap,
          CALL_DIRECTION: "peer-to-pstn",
          INGRESS_NUMBER: from,
          APP_REF: appRef,
          METADATA: JSON.stringify(metadata)
        }
      });
    };
  } catch (e) {
    logger.error("error connecting to ari", e);
  }
}

export { createCreateCallSubscriber };
