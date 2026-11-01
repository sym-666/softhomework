/** 留出提问文字的空间，问答接口的单条消息上限是 2000 字 */
export const MAX_SELECTION_CHARS = 1500;

/**
 * PDF 文本层按行输出，选中的文字带有换行和行尾断词。
 * 先接回断开的单词，再把空白合并成一个空格。
 */
export function cleanSelectedText(raw: string): string {
  return raw
    .replace(/([A-Za-z])-\s*\n\s*([a-z])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SELECTION_CHARS);
}
