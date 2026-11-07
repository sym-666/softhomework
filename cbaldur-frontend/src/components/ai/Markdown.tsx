import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { normalizeMathDelimiters } from '@/utils/math';

// errorColor 沿用文字颜色：流式输出时公式可能只写了一半，不要闪红
const KATEX_OPTIONS = { strict: false, errorColor: 'inherit' };

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
    >
      {normalizeMathDelimiters(children)}
    </ReactMarkdown>
  );
}
