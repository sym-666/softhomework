export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** AI 回答依据的论文片段 */
export interface Citation {
  page: number;
  snippet: string;
}

/** 页面上展示的一条消息（含流式状态和引用来源） */
export interface AiChatItem extends AiChatMessage {
  id: string;
  streaming?: boolean;
  error?: boolean;
  citations?: Citation[];
}
