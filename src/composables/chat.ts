import { useStorage } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";
import { computed, ref } from "vue";
import { DEFAULT_INDEX_HTML } from "../prompts/agent";
import type {
  Conversation,
  Message,
  ToolRunStep,
  WebsiteFormData,
} from "../types";

export function useChat() {
  const conversations = useStorage<Conversation[]>(
    "wikigen-conversations",
    [],
    localStorage,
  );
  const currentConversationId = ref<string | null>(null);

  conversations.value = conversations.value.map((conversation) => ({
    ...conversation,
    workspace: {
      files: {
        "index.html":
          conversation.workspace?.files?.["index.html"] ||
          conversation.website?.currentHtml ||
          DEFAULT_INDEX_HTML,
        ...conversation.workspace?.files,
      },
    },
    htmlSnapshots: conversation.htmlSnapshots || {},
    messages: conversation.messages.map((message) => ({
      ...message,
      kind: message.kind || "text",
    })),
  }));

  const currentConversation = computed(() => {
    if (!currentConversationId.value) return null;
    return (
      conversations.value.find((c) => c.id === currentConversationId.value) ||
      null
    );
  });

  function createConversation(formData: WebsiteFormData): string {
    const id = uuidv4();
    const now = Date.now();
    const conversation: Conversation = {
      id,
      title: formData.topic,
      messages: [],
      workspace: {
        files: {
          "index.html": DEFAULT_INDEX_HTML,
        },
      },
      htmlSnapshots: {},
      initialFormData: {
        ...formData,
        keySections: [...formData.keySections],
      },
      status: "creating",
      createdAt: now,
      updatedAt: now,
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

    conversation.workspace.files["index.html"] = data.html;
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
    delete conversation.initialFormData;
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
    if (!conversation) return;

    conversation.workspace.files["index.html"] = html;

    if (!conversation.website) {
      conversation.website = {
        name: conversation.title,
        description: changeDescription,
        currentHtml: html,
        versions: [
          {
            version: 1,
            html,
            changeDescription,
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
      };
      conversation.updatedAt = Date.now();
      return;
    }

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
      kind: message.kind ?? "text",
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

  function addToolRunMessage(conversationId: string, title: string) {
    return addMessage(conversationId, {
      role: "assistant",
      content: "",
      kind: "tool-run",
      toolRun: {
        id: uuidv4(),
        title,
        status: "running",
        steps: [],
        startedAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  }

  function updateToolRunStep(
    conversationId: string,
    messageId: string,
    step: Omit<ToolRunStep, "id" | "timestamp">,
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const message = conversation.messages.find(
      (m) => m.id === messageId && m.kind === "tool-run",
    );
    if (!message?.toolRun) return;

    message.toolRun.steps.push({
      id: uuidv4(),
      timestamp: Date.now(),
      ...step,
    });
    message.toolRun.updatedAt = Date.now();
    conversation.updatedAt = Date.now();
  }

  function completeToolRun(
    conversationId: string,
    messageId: string,
    status: "done" | "error",
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const message = conversation.messages.find(
      (m) => m.id === messageId && m.kind === "tool-run",
    );
    if (!message?.toolRun) return;

    message.toolRun.status = status;
    message.toolRun.updatedAt = Date.now();
    conversation.updatedAt = Date.now();
  }

  function snapshotForUserMessage(conversationId: string, messageId: string) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    conversation.htmlSnapshots[messageId] = {
      html:
        conversation.workspace.files["index.html"] ||
        conversation.website?.currentHtml ||
        DEFAULT_INDEX_HTML,
      versionCount: conversation.website?.versions.length || 0,
      timestamp: Date.now(),
    };
    conversation.updatedAt = Date.now();
  }

  function truncateAfterMessage(conversationId: string, messageId: string) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const index = conversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    conversation.messages = conversation.messages.slice(0, index + 1);
    conversation.updatedAt = Date.now();
  }

  function restoreFromSnapshot(conversationId: string, messageId: string) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    const snapshot = conversation.htmlSnapshots[messageId];
    if (!snapshot) return;

    conversation.workspace.files["index.html"] = snapshot.html;

    if (conversation.website) {
      const targetCount = Math.max(snapshot.versionCount, 1);
      conversation.website.versions = conversation.website.versions.slice(
        0,
        targetCount,
      );
      const latest = conversation.website.versions.at(-1);
      conversation.website.currentHtml = latest?.html || snapshot.html;
    }

    conversation.updatedAt = Date.now();
  }

  function getWorkspaceFile(conversationId: string, path: string) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return "";
    return conversation.workspace.files[path] || "";
  }

  function setWorkspaceFile(
    conversationId: string,
    path: string,
    content: string,
  ) {
    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return;

    conversation.workspace.files[path] = content;
    conversation.updatedAt = Date.now();
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    updateConversationStatus,
    setWebsiteData,
    updateWebsiteHtml,
    addMessage,
    updateMessageContent,
    addToolRunMessage,
    updateToolRunStep,
    completeToolRun,
    snapshotForUserMessage,
    truncateAfterMessage,
    restoreFromSnapshot,
    getWorkspaceFile,
    setWorkspaceFile,
  };
}
