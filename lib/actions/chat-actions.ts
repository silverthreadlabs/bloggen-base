"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import {
	deleteMessagesAfter,
	getChatById,
	getMessage,
} from "@/lib/db/chat-queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * Server action to delete a message and all messages after it
 * Used for regenerate and edit message functionality
 * @param id - The message ID to delete from (inclusive)
 * @returns Object with success status and chatId
 */
export async function deleteTrailingMessages({ id }: { id: string }) {
	try {
		const headersList = await headers();
		const session = await auth.api.getSession({
			headers: headersList,
		});

		if (!session?.user?.id) {
			throw new ChatSDKError("unauthorized:chat");
		}

		// Get the message to find its chat and timestamp
		const message = await getMessage(id);
		if (!message) {
			throw new ChatSDKError("not_found:chat", "Message not found");
		}

		// Verify the user owns this chat
		const chat = await getChatById(message.chatId);
		if (!chat) {
			throw new ChatSDKError("not_found:chat", "Chat not found");
		}
		if (chat.userId !== session.user.id) {
			throw new ChatSDKError("forbidden:chat");
		}

		// Delete the message and all messages after it
		await deleteMessagesAfter(chat.id, message.id);

		return { success: true, chatId: chat.id };
	} catch (error) {
		if (error instanceof ChatSDKError) {
			throw error;
		}
		console.error("Error in deleteTrailingMessages:", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete trailing messages",
		);
	}
}

/**
 * Server action to verify user has access to a chat
 * Reusable authorization check
 */
export async function verifyChatAccess(chatId: string, userId: string) {
	const chat = await getChatById(chatId);
	
	if (!chat) {
		throw new ChatSDKError("not_found:chat");
	}
	
	if (chat.userId !== userId) {
		throw new ChatSDKError("forbidden:chat");
	}
	
	return chat;
}

/**
 * Server action to get authenticated user session
 * Reusable authentication check
 */
export async function getAuthenticatedUser() {
	const headersList = await headers();
	const session = await auth.api.getSession({
		headers: headersList,
	});

	if (!session?.user?.id) {
		throw new ChatSDKError("unauthorized:chat");
	}

	return session.user;
}
