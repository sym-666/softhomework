import { Download } from 'lucide-react';
import { Button } from '@/shadcn/components/ui/button';

interface ExportLinkProps {
  href: string;
  label: string;
  className?: string;
}

/** 导出接口用 Cookie 认证且响应带 attachment，普通链接就能下载 */
export function ExportLink({ href, label, className }: ExportLinkProps) {
  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className={`rounded-sm ${className ?? ''}`}
    >
      <a href={href} download>
        <Download />
        {label}
      </a>
    </Button>
  );
}
