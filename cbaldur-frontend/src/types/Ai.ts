export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 页面上展示的一条消息（含流式状态） */
export interface AiChatItem extends AiChatMessage {
  id: string;
  streaming?: boolean;
  error?: boolean;
}
