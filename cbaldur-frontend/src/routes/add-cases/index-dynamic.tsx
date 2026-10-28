import React from 'react';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card';
import { Button } from '@/shadcn/components/ui/button';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { Settings, Zap, FileText } from 'lucide-react';

const DynamicIndexPage: React.FC = () => {
  const configs = useSelector((state: RootState) => state.inputs);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            动态配置系统
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            基于配置文件自动生成输入页面，支持多种配置类型和动态扩展。
          </p>

          {configs.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无配置</h3>
              <p className="text-muted-foreground">
                请先从后端加载配置文件，然后开始创建案例。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">可用配置类型</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config) => (
                  <Card
                    key={config.name}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold capitalize">
                          {config.name}
                        </h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          v{config.version}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div>面板数量: {config.panels.length}</div>
                        <div>命名列表: {config.namelists.length}</div>
                        <div>
                          总字段:{' '}
                          {config.panels.reduce(
                            (acc, panel) => acc + panel.fields.length,
                            0,
                          )}
                        </div>
                      </div>

                      <Link href={`/add-cases/dynamic/${config.name}/0`}>
                        <Button className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          开始配置
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>传统静态页面</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            保留原有的静态页面逻辑，用于向后兼容。
          </p>
          <Link href="/add-cases/base">
            <Button variant="outline">使用传统页面</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicIndexPage;
