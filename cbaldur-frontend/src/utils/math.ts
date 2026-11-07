/**
 * 模型有时用 \( \) 和 \[ \] 包裹公式，remark-math 只识别 $ 和 $$。
 * 不转换的话，Markdown 会把反斜杠当作转义去掉，页面上显示出原始的 LaTeX。
 */
export function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_match, body: string) => `$$${body}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_match, body: string) => `$${body}$`);
}
