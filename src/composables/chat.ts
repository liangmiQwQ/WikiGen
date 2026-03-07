import { useStorage } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";
import { computed, ref } from "vue";
import type { Conversation, Message } from "../types";

export function useChat() {
  const conversations = useStorage<Conversation[]>(
    "wikigen-conversations",
    [],
    localStorage,
  );
  const currentConversationId = ref<string | null>(null);
  const isStreaming = ref(false);

  const currentConversation = computed(() => {
    if (!currentConversationId.value) return null;
    return (
      conversations.value.find((c) => c.id === currentConversationId.value) ||
      null
    );
  });

  function createConversation(): string {
    const id = uuidv4();
    const conversation: Conversation = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    conversations.value.unshift(conversation);
    currentConversationId.value = id;
    return id;
  }

  function selectConversation(id: string) {
    currentConversationId.value = id;
  }

  function deleteConversation(id: string) {
    const index = conversations.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      conversations.value.splice(index, 1);
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value[0]?.id || null;
      }
    }
  }

  function addMessage(
    conversationId: string,
    message: Omit<Message, "id" | "timestamp">,
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    conversation.messages.push(newMessage);
    conversation.updatedAt = Date.now();

    // Update title if first user message
    if (conversation.messages.length === 1 && message.role === "user") {
      conversation.title =
        message.content.slice(0, 30) +
        (message.content.length > 30 ? "..." : "");
    }

    return newMessage;
  }

  function updateMessageContent(
    conversationId: string,
    messageId: string,
    content: string,
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const message = conversation.messages.find((m) => m.id === messageId);
    if (message) {
      message.content = content;
      conversation.updatedAt = Date.now();
    }
  }

  function extractHtmlFromMessage(conversationId: string, messageId: string) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const message = conversation.messages.find((m) => m.id === messageId);
    if (!message) return;

    const htmlMatch = message.content.match(/```html\n?([\s\S]*?)```/);
    if (htmlMatch) {
      message.extractedHtml = htmlMatch[1].trim();
      conversation.updatedAt = Date.now();
      return message.extractedHtml;
    }
    return null;
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    isStreaming,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateMessageContent,
    extractHtmlFromMessage,
  };
}
