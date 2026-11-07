import logoUrl from '@/assets/logo.svg';

/** PaperPilot 图标：朱砂印章里一张对折成纸飞机的论文页 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img src={logoUrl} alt="" aria-hidden className={`shrink-0 ${className}`} />
  );
}
