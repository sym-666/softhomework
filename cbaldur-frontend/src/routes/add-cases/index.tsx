import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { Button } from '@/shadcn/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import {
  FileText,
  Code,
  List,
  Settings,
  ArrowRight,
  Layers,
  CheckCircle2,
  Lightbulb,
  FilePlus2,
  Upload,
  Sparkles,
} from 'lucide-react';

const AddCasesIndex: React.FC = () => {
  const configs = useSelector((state: RootState) => state.inputs);
  const [selectedConfig, setSelectedConfig] = useState<string>('');

  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      setSelectedConfig(configs[0].name);
    }
  }, [configs, selectedConfig]);

  const activeConfig = configs.find((c) => c.name === selectedConfig);

  const options = [
    {
      key: 'dynamic',
      title: '逐步输入',
      description:
        '通过分步表单逐项填写参数，带有字段校验与说明，适合不熟悉配置结构的用户。',
      basePath: '/add-cases/dynamic',
      fallbackPath: '/add-cases/base',
      icon: List,
      accent: 'bg-[var(--office-blue)]',
      tagIcon: Sparkles,
      tagText: '推荐',
      features: ['分步引导表单', '实时字段校验', '参数说明提示'],
    },
    {
      key: 'json',
      title: '从 JSON 输入',
      description:
        '直接粘贴或编辑 JSON 格式的配置内容创建案例，适合熟悉配置结构的高级用户。',
      basePath: '/add-cases',
      fallbackPath: '/add-cases/json/baldur',
      icon: Code,
      accent: 'bg-emerald-500',
      tagIcon: FilePlus2,
      tagText: '快捷',
      features: ['完整结构控制', '可复制粘贴', '快速批量编辑'],
    },
    {
      key: 'namelist',
      title: '从 Namelist 创建',
      description:
        '导入已有的 Namelist 文件并解析为案例配置，便于迁移既有的模拟输入。',
      basePath: '/add-cases',
      fallbackPath: '/add-cases/namelist',
      icon: FileText,
      accent: 'bg-amber-500',
      tagIcon: Upload,
      tagText: '导入',
      features: ['兼容现有文件', '自动解析参数', '保留原始格式'],
    },
  ];

  const getNavigationPath = (option: (typeof options)[number]) => {
    if (!selectedConfig) return option.fallbackPath;
    if (option.key === 'dynamic') {
      return `${option.basePath}/${selectedConfig}/0`;
    }
    if (option.key === 'json') {
      return `/add-cases/json/${selectedConfig}`;
    }
    return option.fallbackPath;
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Page header */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--office-blue-light)] text-[var(--office-blue)]">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">创建新案例</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              选择一个配置类型，并挑选下方任意一种方式开始构建你的模拟案例。
            </p>
          </div>
        </div>
      </div>

      {/* Configuration selector */}
      {configs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">选择配置</h3>
          </div>
          <div className="p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5 w-full md:max-w-md">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                配置类型
              </label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择配置..." />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.name} value={config.name}>
                      {config.name} (v{config.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeConfig && (
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-sm px-3 py-2">
                  <Layers className="w-4 h-4 text-[var(--office-blue)]" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-gray-900">
                      {activeConfig.panels.length}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                      面板
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-sm px-3 py-2">
                  <List className="w-4 h-4 text-[var(--office-blue)]" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-gray-900">
                      {activeConfig.namelists.length}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Namelist
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-sm px-3 py-2">
                  <FileText className="w-4 h-4 text-[var(--office-blue)]" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-gray-900">
                      v{activeConfig.version}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                      版本
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Method cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => {
          const IconComponent = option.icon;
          const TagIcon = option.tagIcon;
          const navigationPath = getNavigationPath(option);
          const isDisabled =
            configs.length > 0 && !selectedConfig && option.key === 'dynamic';

          return (
            <div
              key={option.key}
              className={`group relative flex flex-col bg-white border border-gray-200 rounded-sm overflow-hidden transition-all duration-200 ${
                isDisabled
                  ? 'opacity-50'
                  : 'hover:border-[var(--office-blue)] hover:shadow-md'
              }`}
            >
              <span
                className={`absolute top-0 left-0 h-1 w-full ${option.accent}`}
              />

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-sm text-white ${option.accent}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    <TagIcon className="h-3 w-3" />
                    {option.tagText}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-gray-900">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 flex-1">
                  {option.description}
                </p>

                <ul className="mt-4 space-y-1.5">
                  {option.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--office-blue)] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-5 pb-5">
                {isDisabled ? (
                  <Button variant="outline" className="w-full" disabled>
                    请先选择配置
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)] text-white"
                  >
                    <Link href={navigationPath}>
                      开始创建
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper tips */}
      <div className="bg-[var(--office-blue-light)]/40 border border-[var(--office-blue-light)] rounded-sm p-4">
        <div className="flex gap-3">
          <Lightbulb className="h-4 w-4 text-[var(--office-blue)] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">如何选择创建方式？</p>
            <p>
              首次创建建议使用「逐步输入」，表单会引导你填写每一项参数；如果已经有完整的配置内容，可直接使用「从
              JSON 输入」；若需迁移既有的模拟输入，请选择「从 Namelist 创建」。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCasesIndex;
