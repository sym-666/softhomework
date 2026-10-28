import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { Button } from '@/shadcn/components/ui/button';
import { Badge } from '@/shadcn/components/ui/badge';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import { useInput } from '@/hooks/useInput';
import ReactECharts from 'echarts-for-react';
import { Download, Eye, BarChart3, Send } from 'lucide-react';

const SummaryPage: React.FC = () => {
  const { inputData } = useInput();

  // 生成示例数据用于图表展示
  const generateTimeSeriesData = () => {
    const data = [];
    const { tinit, tmax, dtmax } = inputData.block6 || {};
    const startTime = tinit || 70;
    const endTime = tmax || 120;
    const timeStep = dtmax || 0.5;

    for (let t = startTime; t <= endTime; t += timeStep * 10) {
      data.push({
        time: t,
        temperature:
          3 + Math.sin((t - startTime) * 0.1) * 0.5 + Math.random() * 0.2,
        density:
          2e13 +
          Math.cos((t - startTime) * 0.08) * 0.3e13 +
          Math.random() * 0.1e13,
        pressure:
          1.5 + Math.sin((t - startTime) * 0.12) * 0.3 + Math.random() * 0.1,
      });
    }
    return data;
  };

  const generateRadialData = () => {
    const data = [];
    const nzones = inputData.block6?.nzones || 50;

    for (let i = 0; i < Math.min(nzones, 20); i++) {
      const r = i / Math.min(nzones, 20);
      data.push({
        radius: r,
        temperature: 3 * (1 - r * 0.8) + Math.random() * 0.2,
        density: 2e13 * (1 - r * 0.6) + Math.random() * 0.1e13,
      });
    }
    return data;
  };

  const generateBlockDistribution = () => {
    const blocks = Object.keys(inputData).filter((key) =>
      key.startsWith('block'),
    );
    return blocks.map((block) => ({
      name: `Block ${block.replace('block', '')}`,
      parameters: Object.keys(inputData[block]).length - 1, // 减去namelist字段
      namelist: inputData[block].namelist || 'Unknown',
    }));
  };

  const timeSeriesData = generateTimeSeriesData();
  const radialData = generateRadialData();
  const blockData = generateBlockDistribution();

  // 时间序列图表 ECharts options
  const timeSeriesOption = useMemo(() => {
    const times = timeSeriesData.map((d) => d.time);
    const temperatures = timeSeriesData.map((d) => d.temperature);
    const densities = timeSeriesData.map((d) => d.density / 1e13);

    return {
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['温度 (keV)', '密度 (×10¹³)'] },
      grid: { left: 60, right: 60, top: 40, bottom: 40 },
      xAxis: { type: 'category' as const, name: '时间 (s)', data: times },
      yAxis: [
        {
          type: 'value' as const,
          name: '温度 (keV)',
          position: 'left' as const,
        },
        {
          type: 'value' as const,
          name: '密度 (×10¹³)',
          position: 'right' as const,
        },
      ],
      series: [
        {
          name: '温度 (keV)',
          type: 'line' as const,
          data: temperatures,
          yAxisIndex: 0,
          lineStyle: { color: '#8884d8' },
          itemStyle: { color: '#8884d8' },
        },
        {
          name: '密度 (×10¹³)',
          type: 'line' as const,
          data: densities,
          yAxisIndex: 1,
          lineStyle: { color: '#82ca9d' },
          itemStyle: { color: '#82ca9d' },
        },
      ],
    };
  }, [timeSeriesData]);

  // 径向数据图表 ECharts options
  const radialOption = useMemo(() => {
    const radii = radialData.map((d) => d.radius.toFixed(2));
    const temperatures = radialData.map((d) => d.temperature);
    const densities = radialData.map((d) => d.density / 1e13);

    return {
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['温度 (keV)', '密度 (×10¹³)'] },
      grid: { left: 60, right: 60, top: 40, bottom: 40 },
      xAxis: { type: 'category' as const, name: '归一化半径', data: radii },
      yAxis: [
        {
          type: 'value' as const,
          name: '温度 (keV)',
          position: 'left' as const,
        },
        {
          type: 'value' as const,
          name: '密度 (×10¹³)',
          position: 'right' as const,
        },
      ],
      series: [
        {
          name: '温度 (keV)',
          type: 'line' as const,
          data: temperatures,
          yAxisIndex: 0,
          lineStyle: { color: '#ff7300' },
          itemStyle: { color: '#ff7300' },
        },
        {
          name: '密度 (×10¹³)',
          type: 'line' as const,
          data: densities,
          yAxisIndex: 1,
          lineStyle: { color: '#00ff00' },
          itemStyle: { color: '#00ff00' },
        },
      ],
    };
  }, [radialData]);

  // 配置块分布图表 ECharts options
  const blockOption = useMemo(() => {
    const names = blockData.map((d) => d.name);
    const parameters = blockData.map((d) => d.parameters);

    return {
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['参数数量'] },
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
      xAxis: { type: 'category' as const, name: 'Block', data: names },
      yAxis: { type: 'value' as const, name: '参数数量', minInterval: 1 },
      series: [
        {
          name: '参数数量',
          type: 'line' as const,
          data: parameters,
          lineStyle: { color: '#8884d8' },
          itemStyle: { color: '#8884d8' },
          symbol: 'circle',
          symbolSize: 8,
        },
      ],
    };
  }, [blockData]);

  const handleSaveCase = () => {
    console.log('保存案例:', inputData);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(inputData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'case-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--office-blue-light)] text-[var(--office-blue)] shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-gray-400">
                STATIC
              </div>
              <h2 className="text-sm font-semibold text-gray-900 truncate">
                案例配置总结
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
            <Button onClick={handleSaveCase}>
              <Send className="h-4 w-4 mr-2" />
              提交
            </Button>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-gray-500">查看和分析您的案例配置参数</p>
        </div>
      </div>

      {/* Configuration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StaticParamCard>
          <div className="text-center p-2">
            <div className="text-2xl font-bold text-primary">
              {Object.keys(inputData).length}
            </div>
            <p className="text-sm text-muted-foreground">Block数量</p>
          </div>
        </StaticParamCard>

        <StaticParamCard>
          <div className="text-center p-2">
            <div className="text-2xl font-bold text-primary">
              {inputData.block6?.nzones || 50}
            </div>
            <p className="text-sm text-muted-foreground">信息B</p>
          </div>
        </StaticParamCard>

        <StaticParamCard>
          <div className="text-center p-2">
            <div className="text-2xl font-bold text-primary">
              {(
                (inputData.block6?.tmax || 120) -
                (inputData.block6?.tinit || 70)
              ).toFixed(1)}
              s
            </div>
            <p className="text-sm text-muted-foreground">信息C</p>
          </div>
        </StaticParamCard>
      </div>

      {/* Configuration Blocks */}
      <StaticParamCard title="配置块分布">
        <div style={{ width: '100%', height: '300px' }}>
          <ReactECharts
            option={blockOption}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </StaticParamCard>

      {/* Time Series Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaticParamCard title="AAA" description="description">
          <div style={{ width: '100%', height: '300px' }}>
            <ReactECharts
              option={timeSeriesOption}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </StaticParamCard>

        <StaticParamCard title="BBB" description="description">
          <div style={{ width: '100%', height: '300px' }}>
            <ReactECharts
              option={radialOption}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </StaticParamCard>
      </div>

      {/* Configuration Details */}
      <StaticParamCard title="配置详情">
        <div className="space-y-4">
          {Object.entries(inputData).map(([blockKey, blockData]) => (
            <div key={blockKey} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{blockKey}</Badge>
                <span className="text-sm text-muted-foreground">
                  Namelist: {blockData.namelist || 'Unknown'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                {Object.entries(blockData)
                  .filter(([key]) => key !== 'namelist')
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {typeof value === 'object'
                          ? Array.isArray(value)
                            ? `[${value.length} items]`
                            : JSON.stringify(value).slice(0, 20) + '...'
                          : String(value).slice(0, 20)}
                      </span>
                    </div>
                  ))}
                {Object.keys(blockData).length > 9 && (
                  <div className="text-muted-foreground text-xs">
                    +{Object.keys(blockData).length - 9} 更多参数...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </StaticParamCard>

      {/* Navigation */}
      <StaticParamCard>
        <div className="flex justify-between">
          <Link href="/add-cases">
            <Button variant="outline">返回开始</Button>
          </Link>
          <div className="flex gap-2">
            <Link href="/add-cases/base">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                继续编辑
              </Button>
            </Link>
            <Link href="/cases">
              <Button>前往算例管理</Button>
            </Link>
          </div>
        </div>
      </StaticParamCard>
    </div>
  );
};

export default SummaryPage;
