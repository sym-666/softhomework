import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/shadcn/components/ui/button';
import { Badge } from '@/shadcn/components/ui/badge';
import { Input } from '@/shadcn/components/ui/input';
import {
  Terminal,
  Copy,
  Check,
  Download,
  Trash2,
  ArrowDownToLine,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  X,
  Maximize2,
  Minimize2,
  Ban,
  Filter,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CaseLogTerminalProps {
  logs: string[];
  logsByFile?: Record<string, string[]>;
  availableFiles?: string[];
  status:
    | 'idle'
    | 'connecting'
    | 'streaming'
    | 'completed'
    | 'failed'
    | 'disconnected'
    | 'terminated';
  isCompleted?: boolean;
  isSuccess?: boolean;
  isTerminated?: boolean;
  errorMessage?: string | null;
  caseId?: string;
  onClear?: (file?: string) => void;
  onReconnect?: () => void;
  className?: string;
  maxHeight?: string;
  autoScrollDefault?: boolean;
}

export const CaseLogTerminal: React.FC<CaseLogTerminalProps> = ({
  logs,
  logsByFile,
  availableFiles,
  status,
  isCompleted = false,
  isSuccess = true,
  isTerminated = false,
  errorMessage,
  caseId,
  onClear,
  onReconnect,
  className = '',
  maxHeight = 'h-[500px]',
  autoScrollDefault = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(autoScrollDefault);
  const [copied, setCopied] = useState<boolean>(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute tabs
  const tabList = useMemo(() => {
    const list: string[] = ['all'];
    const knownOrder = ['jobxlpt', 'short', 'cbaldur.out', 'pipeline'];
    const otherFiles = new Set<string>();

    if (availableFiles) {
      availableFiles.forEach((f) => {
        if (f && f !== 'all') otherFiles.add(f);
      });
    }
    if (logsByFile) {
      Object.keys(logsByFile).forEach((f) => {
        if (f && f !== 'all') otherFiles.add(f);
      });
    }

    // Add in preferred order first
    for (const k of knownOrder) {
      if (otherFiles.has(k)) {
        list.push(k);
        otherFiles.delete(k);
      }
    }
    // Add any remaining
    otherFiles.forEach((f) => list.push(f));

    return list;
  }, [availableFiles, logsByFile]);

  // Keep activeTab valid if file list changes
  useEffect(() => {
    if (!tabList.includes(activeTab)) {
      setActiveTab('all');
    }
  }, [tabList, activeTab]);

  const activeLogs = useMemo(() => {
    if (activeTab === 'all') {
      return logs;
    }
    return logsByFile?.[activeTab] || [];
  }, [activeTab, logs, logsByFile]);

  const getTabLabel = (tab: string) => {
    if (tab === 'all') return '全部';
    return tab;
  };

  const getTabCount = (tab: string) => {
    if (tab === 'all') return logs.length;
    return logsByFile?.[tab]?.length || 0;
  };

  const ROW_HEIGHT = 22;
  const OVERSCAN = 15;

  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(500);

  // Update viewportHeight on container mount / resize / fullscreen
  useEffect(() => {
    if (scrollContainerRef.current) {
      setViewportHeight(scrollContainerRef.current.clientHeight || 500);
    }
  }, [isFullscreen, maxHeight]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const result: Array<{ line: string; originalIndex: number }> = [];
    for (let i = 0; i < activeLogs.length; i++) {
      const line = activeLogs[i];
      if (line.toLowerCase().includes(q)) {
        result.push({ line, originalIndex: i });
      }
    }
    return result;
  }, [activeLogs, searchQuery]);

  const totalCount = searchMatches ? searchMatches.length : activeLogs.length;
  const totalHeight = totalCount * ROW_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalCount,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );

  const visibleItems = useMemo(() => {
    const items: Array<{ line: string; originalIndex: number }> = [];
    for (let i = startIndex; i < endIndex; i++) {
      if (searchMatches) {
        items.push(searchMatches[i]);
      } else {
        items.push({ line: activeLogs[i], originalIndex: i });
      }
    }
    return items;
  }, [startIndex, endIndex, searchMatches, activeLogs]);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      setIsUserScrolledUp(false);
    }
  }, []);

  // Handle auto-scroll on new logs or tab switch
  useEffect(() => {
    if (autoScroll && !isUserScrolledUp && !searchQuery) {
      scrollToBottom();
    }
  }, [activeLogs.length, autoScroll, isUserScrolledUp, searchQuery, scrollToBottom, activeTab]);

  // Focus search input when toggled
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    setViewportHeight(el.clientHeight);
    const isAtBottom =
      Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 40;
    setIsUserScrolledUp(!isAtBottom);
  };

  const handleCopyLogs = async () => {
    const text = activeLogs.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`已复制 ${getTabLabel(activeTab)} 日志到剪贴板`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownloadLog = () => {
    const text = activeLogs.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filePrefix = activeTab === 'all' ? 'all-logs' : activeTab;
    a.download = `${filePrefix}-${caseId || 'execution'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${getTabLabel(activeTab)} 日志文件已开始下载`);
  };

  const detectedTerminated = useMemo(() => {
    return (
      isTerminated ||
      status === 'terminated' ||
      logs.some((l) => l.includes('主动终止') || l.includes('已被主动终止'))
    );
  }, [isTerminated, status, logs]);

  const renderStatusBadge = () => {
    if (status === 'streaming' || status === 'connecting') {
      return (
        <Badge
          variant="secondary"
          className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1.5 py-0.5 px-2.5 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span className="font-medium text-xs">
            {status === 'connecting' ? '正在连接日志流...' : '计算中 (实时输出)'}
          </span>
        </Badge>
      );
    }

    if (detectedTerminated) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 flex items-center gap-1 py-0.5 px-2.5 shadow-sm font-medium"
        >
          <Ban className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">已主动终止</span>
        </Badge>
      );
    }

    if (status === 'completed' || (isCompleted && isSuccess)) {
      return (
        <Badge
          variant="default"
          className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 py-0.5 px-2.5 shadow-sm font-medium"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">计算完成</span>
        </Badge>
      );
    }

    if (status === 'failed' || (isCompleted && !isSuccess)) {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 py-0.5 px-2.5 shadow-sm font-medium"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">计算失败</span>
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        离线日志
      </Badge>
    );
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const formatLine = (line: string, index: number) => {
    let lineClass = 'text-slate-300';
    let isPipelineHeader = false;

    if (
      line.includes('[Pipeline ERROR]') ||
      line.includes('ERROR') ||
      line.includes('Error')
    ) {
      lineClass = 'text-rose-400 font-semibold bg-rose-950/20 px-1 rounded';
    } else if (
      line.includes('[Pipeline WARNING]') ||
      line.includes('WARNING') ||
      line.includes('主动终止')
    ) {
      lineClass = 'text-amber-300 font-medium bg-amber-950/20 px-1 rounded';
    } else if (line.includes('[Pipeline]') || line.includes('步骤')) {
      lineClass = 'text-sky-300 font-semibold';
      isPipelineHeader = true;
    } else if (
      line.includes('completed') ||
      line.includes('成功') ||
      line.includes('完成！')
    ) {
      lineClass = 'text-emerald-400 font-medium';
    } else if (line.includes('iteration') || line.includes('step')) {
      lineClass = 'text-slate-200';
    }

    return (
      <div
        key={index}
        style={{ height: `${ROW_HEIGHT}px` }}
        className={`flex items-center hover:bg-slate-800/60 px-1 rounded transition-colors group overflow-hidden ${
          isPipelineHeader ? 'bg-sky-950/15' : ''
        }`}
      >
        <span className="w-12 shrink-0 select-none text-right pr-3 text-slate-600 group-hover:text-slate-400 text-xs font-mono">
          {index + 1}
        </span>
        <span className={`break-all whitespace-pre font-mono ${lineClass} flex-1`}>
          {searchQuery ? highlightMatch(line, searchQuery) : line}
        </span>
      </div>
    );
  };

  const fullscreenClasses = isFullscreen
    ? 'fixed inset-4 z-50 shadow-2xl rounded-xl border border-slate-700'
    : `rounded-xl border border-slate-800 shadow-md ${className}`;

  return (
    <div
      className={`flex flex-col bg-slate-950 overflow-hidden text-slate-100 font-mono transition-all ${fullscreenClasses}`}
    >
      {/* Terminal Header */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
              算例运行控制台
            </span>
          </div>
          {renderStatusBadge()}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Search Filter Bar */}
          {showSearch ? (
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-700 rounded-md px-2 py-0.5 h-7">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索日志..."
                className="h-5 w-32 md:w-44 text-xs border-0 bg-transparent p-0 text-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-500 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                title="关闭搜索"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => setShowSearch(true)}
              title="过滤与搜索日志"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              搜索
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs hover:bg-slate-800 text-slate-300 ${
              autoScroll ? 'text-sky-400 bg-slate-800/80 font-medium' : ''
            }`}
            onClick={() => setAutoScroll((prev) => !prev)}
            title={autoScroll ? '已开启自动滚屏' : '已暂停自动滚屏'}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
            {autoScroll ? '自动滚动' : '暂停跟随'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            title="复制全部日志"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            复制
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            onClick={handleDownloadLog}
            disabled={logs.length === 0}
            title="下载 .out 日志文件"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            下载
          </Button>

          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              onClick={() => onClear(activeTab)}
              disabled={activeLogs.length === 0}
              title={`清空 ${getTabLabel(activeTab)} 屏幕`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {onReconnect && status === 'disconnected' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-amber-400 hover:bg-slate-800"
              onClick={onReconnect}
              title="重新连接日志流"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              重连
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? '退出全屏' : '全屏显示'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* File Tabs Bar */}
      {tabList.length > 1 && (
        <div className="bg-slate-900/70 border-b border-slate-800 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto select-none shrink-0">
          {tabList.map((tab) => {
            const isActive = activeTab === tab;
            const count = getTabCount(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>{getTabLabel(tab)}</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-sky-400/25 text-sky-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Terminal Log Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`p-3 font-mono text-xs overflow-y-auto overflow-x-hidden relative select-text leading-relaxed ${
          isFullscreen ? 'flex-1' : maxHeight
        }`}
      >
        {activeLogs.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-slate-500 gap-2">
            {status === 'connecting' ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                <p className="text-xs">正在连接实时日志服务...</p>
              </>
            ) : (
              <>
                <Terminal className="h-8 w-8 text-slate-700" />
                <p className="text-xs">
                  {tabList.length > 1
                    ? `[${getTabLabel(activeTab)}] 暂无日志输出`
                    : '暂无日志输出，等待任务执行...'}
                </p>
              </>
            )}
          </div>
        ) : searchMatches && searchMatches.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-slate-500 gap-2">
            <Filter className="h-6 w-6 text-slate-600" />
            <p className="text-xs">未找到匹配 &quot;{searchQuery}&quot; 的日志行</p>
          </div>
        ) : (
          <div
            style={{
              height: `${totalHeight}px`,
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${startIndex * ROW_HEIGHT}px)`,
              }}
            >
              {visibleItems.map((item) =>
                formatLine(item.line, item.originalIndex),
              )}
            </div>
          </div>
        )}

        {/* Floating scroll to bottom indicator */}
        {isUserScrolledUp && activeLogs.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-6 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-full shadow-xl text-xs flex items-center gap-1.5 transition-all opacity-95 hover:opacity-100 cursor-pointer border border-sky-400/40"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            滚至底部 ({activeLogs.length} 行)
          </button>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="bg-slate-900/90 backdrop-blur border-t border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span>
            当前 Tab: <strong className="text-slate-200">{activeLogs.length}</strong> 行
            {tabList.length > 1 && (
              <span className="text-slate-500 ml-1.5">
                (总计 {logs.length} 行)
              </span>
            )}
            {searchMatches !== null && (
              <span className="text-amber-400 ml-2">
                (已过滤显示 {searchMatches.length} 行)
              </span>
            )}
          </span>
          {errorMessage && (
            <span className="text-rose-400 font-medium truncate max-w-md">
              错误: {errorMessage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status === 'streaming' && (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              实时监听中
            </span>
          )}
          {detectedTerminated && (
            <span className="text-amber-400 font-medium">任务已终止</span>
          )}
          {status === 'completed' && !detectedTerminated && (
            <span className="text-slate-400">日志流已结束</span>
          )}
        </div>
      </div>
    </div>
  );
};
