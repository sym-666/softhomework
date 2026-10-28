import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'wouter';
import { useDynamicForm } from '@/hooks/useDynamicForm';
import DynamicInput from './DynamicInput';
import DynamicCaseHeader from './DynamicCaseHeader';
import ParamChartEditorDialog from './ParamChartEditorDialog';
import { Input } from '@/shadcn/components/ui/input';
import { Button } from '@/shadcn/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shadcn/components/ui/tabs';
import { LineChart, List, Search, SlidersHorizontal } from 'lucide-react';
import type { Field, Panel } from '@/types/ConfigSchema';

interface SearchMatch {
  panelIndex: number;
  panelId: string;
  field: Field;
}

interface DynamicPanelPageProps {
  panel: Panel;
  panels: Panel[];
  configName: string;
  currentIndex: number;
  totalPanels: number;
  selectedSupercomputer?: string;
  onPanelSelect: (index: number) => void;
  onSupercomputerChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
}

const SEARCH_PARAM = 'search';

const fieldMatches = (field: Field, query: string): boolean => {
  const q = query.toLowerCase();
  const idMatch = field.id.toLowerCase().includes(q);
  const descriptionMatch = field.description
    ? field.description.toLowerCase().includes(q)
    : false;
  return idMatch || descriptionMatch;
};

const DynamicPanelPage: React.FC<DynamicPanelPageProps> = ({
  configName,
  panel,
  panels,
  currentIndex,
  totalPanels,
  selectedSupercomputer,
  onPanelSelect,
  onSupercomputerChange,
  onNext,
  onPrevious,
  canGoPrevious,
}) => {
  const { initializePanel } = useDynamicForm(configName, panel.id);
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get(SEARCH_PARAM) ?? '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialQuery ? 'search' : 'all');
  const [chartEditorOpen, setChartEditorOpen] = useState(false);

  useEffect(() => {
    initializePanel(panel.fields);
  }, [initializePanel, panel.fields]);

  const filteredFields = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return panel.fields;
    }
    return panel.fields.filter((field) => fieldMatches(field, query));
  }, [panel.fields, searchQuery]);

  const filteredPanel: Panel = useMemo(
    () => ({ ...panel, fields: filteredFields }),
    [panel, filteredFields],
  );

  const crossPanelMatches = useMemo<SearchMatch[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const matches: SearchMatch[] = [];
    panels.forEach((p, panelIndex) => {
      p.fields.forEach((field) => {
        if (fieldMatches(field, query)) {
          matches.push({ panelIndex, panelId: p.id, field });
        }
      });
    });
    return matches;
  }, [panels, searchQuery]);

  const groupedMatches = useMemo(() => {
    const groups = new Map<number, SearchMatch[]>();
    crossPanelMatches.forEach((match) => {
      const existing = groups.get(match.panelIndex) ?? [];
      existing.push(match);
      groups.set(match.panelIndex, existing);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [crossPanelMatches]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const navigateToMatch = (panelIndex: number) => {
    const query = searchQuery.trim();
    const queryString = query
      ? `?${SEARCH_PARAM}=${encodeURIComponent(query)}`
      : '';
    setLocation(`/add-cases/dynamic/${configName}/${panelIndex}${queryString}`);
  };

  return (
    <div className="space-y-4 pb-6">
      <DynamicCaseHeader
        configName={configName}
        currentIndex={currentIndex}
        totalPanels={totalPanels}
        panels={panels}
        onPanelSelect={onPanelSelect}
        onNext={onNext}
        onPrevious={onPrevious}
        canGoPrevious={canGoPrevious}
        selectedSupercomputer={selectedSupercomputer}
        onSupercomputerChange={onSupercomputerChange}
      />

      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">参数配置</h3>
          </div>
          <span className="text-xs text-gray-400">
            {activeTab === 'search' && searchQuery.trim()
              ? `${filteredFields.length} / ${panel.fields.length} 个参数`
              : `${panel.fields.length} 个参数`}
          </span>
        </div>
        {panel.description && (
          <div className="px-4 pt-3 text-sm text-gray-500">
            {panel.description}
          </div>
        )}
        <div className="p-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <TabsList>
                <TabsTrigger value="all">
                  <List className="h-4 w-4 mr-1.5" />
                  全部参数
                </TabsTrigger>
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-1.5" />
                  搜索参数
                </TabsTrigger>
              </TabsList>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setChartEditorOpen(true)}
                className="h-9"
              >
                <LineChart className="h-4 w-4 mr-1.5" />
                参数关系图
              </Button>
            </div>

            <TabsContent value="all">
              <DynamicInput panel={panel} configName={configName} />
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="跨 Block 搜索参数名或参数描述..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              {!searchQuery.trim() && (
                <div className="text-sm text-gray-500">
                  输入参数名或描述，即可在所有 Block 中搜索并快速跳转。
                </div>
              )}

              {searchQuery.trim() && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前 Block 匹配结果
                  </div>
                  {filteredFields.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      当前 Block 无匹配
                    </div>
                  ) : (
                    <DynamicInput
                      panel={filteredPanel}
                      configName={configName}
                    />
                  )}

                  {groupedMatches.length > 0 && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        所有 Block 匹配结果
                      </div>
                      <div className="space-y-3">
                        {groupedMatches.map(([panelIndex, matches]) => (
                          <div
                            key={panelIndex}
                            className="rounded-sm border border-gray-200 bg-gray-50/50 overflow-hidden"
                          >
                            <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-700">
                              {panelIndex + 1}. {matches[0].panelId}
                            </div>
                            <div className="divide-y divide-gray-100">
                              {matches.map((match) => (
                                <button
                                  key={`${match.panelIndex}-${match.field.id}`}
                                  type="button"
                                  onClick={() =>
                                    navigateToMatch(match.panelIndex)
                                  }
                                  className="w-full px-3 py-2 text-left hover:bg-[var(--office-blue-light)]/40 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-[var(--office-blue)]">
                                      {match.field.id}
                                    </span>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      点击跳转
                                    </span>
                                  </div>
                                  {match.field.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                      {match.field.description}
                                    </p>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {groupedMatches.length === 0 &&
                    filteredFields.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500">
                        未找到匹配 “{searchQuery}” 的参数
                      </div>
                    )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ParamChartEditorDialog
        open={chartEditorOpen}
        onOpenChange={setChartEditorOpen}
        panel={panel}
        configName={configName}
      />
    </div>
  );
};

export default DynamicPanelPage;
