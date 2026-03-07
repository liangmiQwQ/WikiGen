import { useStorage } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";
import { computed, ref } from "vue";
import type { Conversation, Message, WebsiteFormData } from "../types";

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

  function createConversation(formData: WebsiteFormData): string {
    const id = uuidv4();
    const conversation: Conversation = {
      id,
      title: formData.topic,
      messages: [],
      status: "creating",
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

  function updateConversationStatus(
    conversationId: string,
    status: Conversation["status"],
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (conversation) {
      conversation.status = status;
      conversation.updatedAt = Date.now();
    }
  }

  function setWebsiteData(
    conversationId: string,
    data: {
      name: string;
      description: string;
      html: string;
    },
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    conversation.website = {
      name: data.name,
      description: data.description,
      currentHtml: data.html,
      versions: [
        {
          version: 1,
          html: data.html,
          changeDescription: "Initial generation",
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };
    conversation.status = "completed";
    conversation.updatedAt = Date.now();
  }

  function updateWebsiteHtml(
    conversationId: string,
    html: string,
    changeDescription: string,
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation || !conversation.website) return;

    const newVersion = conversation.website.versions.length + 1;
    conversation.website.versions.push({
      version: newVersion,
      html,
      changeDescription,
      timestamp: Date.now(),
    });
    conversation.website.currentHtml = html;
    conversation.updatedAt = Date.now();
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
    updateConversationStatus,
    setWebsiteData,
    updateWebsiteHtml,
    addMessage,
    updateMessageContent,
    extractHtmlFromMessage,
  };
}
