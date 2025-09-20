import { z } from "zod";

const MirrorMessage = z.object({
  consensus_timestamp: z.string(),
  message: z.string(),
  running_hash: z.string(),
  running_hash_version: z.number(),
  sequence_number: z.number(),
  topic_id: z.string(),
});

const MirrorMessagesResponse = z.object({
  messages: z.array(MirrorMessage),
  links: z.object({
    next: z.string().nullable(),
  }),
});

/**
 * Fetches topic messages from the Hedera Mirror Node REST API.
 *
 * @param topicId - The topic ID to fetch messages from.
 * @param fromTs - The starting timestamp (nanoseconds).
 * @returns A promise that resolves to the list of messages.
 */
export async function fetchTopicMessages({
  topicId,
  fromTs,
}: {
  topicId: string;
  fromTs?: string;
}) {
  const params = new URLSearchParams();
  params.append("order", "asc");
  if (fromTs) {
    params.append("timestamp", `gt:${fromTs}`);
  }

  const url = `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const { messages } = MirrorMessagesResponse.parse(data);

    return messages.map(
      ({
        consensus_timestamp,
        sequence_number,
        running_hash,
        message,
      }) => ({
        consensusTime: consensus_timestamp,
        sequenceNumber: sequence_number,
        runningHash: running_hash,
        message: Buffer.from(message, "base64").toString("utf8"),
      })
    );
  } catch (error) {
    console.error("Failed to fetch topic messages:", error);
    return [];
  }
}