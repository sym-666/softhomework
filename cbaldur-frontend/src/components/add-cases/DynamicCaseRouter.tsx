import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import DynamicPanelPage from './DynamicPanelPage';
import DynamicCommentPage from './DynamicCommentPage';
import type { RootState } from '@/redux/store';
import {
  setCurrentConfig,
  setCurrentPanelIndex,
} from '@/redux/slices/navigationSlice';
import type { ConfigSchema } from '@/types/ConfigSchema';
import { useGetCurrentUserQuery } from '@/redux/api/user';
import { useGetAiStatusQuery } from '@/redux/api/ai';
import ParameterAssistant from '@/components/ai/ParameterAssistant';
import { Bot } from 'lucide-react';
import { useIntl } from 'react-intl';

interface DynamicCaseRouterProps {
  configs: ConfigSchema[];
}

const DynamicCaseRouter: React.FC<DynamicCaseRouterProps> = ({ configs }) => {
  const [selectedSupercomputer, setSelectedSupercomputer] = useState<
    string | undefined
  >();
  const dispatch = useDispatch();
  const [location, setLocation] = useLocation();
  const navigation = useSelector((state: RootState) => state.navigation);
  const { data: currentUser } = useGetCurrentUserQuery();
  const intl = useIntl();
  const { data: aiStatus } = useGetAiStatusQuery();
  const [aiOpen, setAiOpen] = useState(false);

  // 调参助手侧边栏放在 Router 层，切换 panel 时对话不丢失
  const withAssistant = (content: React.ReactNode) => {
    if (!aiStatus?.enabled) return content;
    return (
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">{content}</div>
        {aiOpen ? (
          <aside className="sticky top-0 h-[calc(100vh-160px)] w-[380px] shrink-0">
            <ParameterAssistant
              configName={navigation.currentConfigName}
              onClose={() => setAiOpen(false)}
            />
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="fixed right-6 bottom-12 z-40 flex items-center gap-1.5 rounded-full bg-[var(--office-blue)] px-4 py-2 text-sm text-white shadow-lg hover:opacity-90"
          >
            <Bot className="h-4 w-4" />
            {intl.formatMessage({ id: 'ai.param.title' })}
          </button>
        )}
      </div>
    );
  };

  // Find current config
  const currentConfig = configs.find(
    (config) => config.name === navigation.currentConfigName,
  );

  useEffect(() => {
    // Initialize with first config if available
    if (configs.length > 0 && !currentConfig) {
      const firstConfig = configs[0];
      dispatch(
        setCurrentConfig({
          name: firstConfig.name,
          totalPanels: firstConfig.panels.length + 1, // +1 for comment page
        }),
      );
    }
  }, [configs, currentConfig, dispatch]);

  useEffect(() => {
    // Update total panels when config changes
    if (
      currentConfig &&
      navigation.totalPanels !== currentConfig.panels.length + 1
    ) {
      dispatch(
        setCurrentConfig({
          name: currentConfig.name,
          totalPanels: currentConfig.panels.length + 1,
        }),
      );
    }
  }, [currentConfig, navigation.totalPanels, dispatch]);

  const handlePanelSelect = (index: number) => {
    if (!currentConfig) return;

    if (index >= currentConfig.panels.length) {
      setLocation(
        `/add-cases/dynamic/${navigation.currentConfigName}/${currentConfig.panels.length}`,
      );
    } else {
      setLocation(
        `/add-cases/dynamic/${navigation.currentConfigName}/${index}`,
      );
    }
  };

  const handleNext = () => {
    if (navigation.currentPanelIndex >= navigation.totalPanels - 1) {
      // Go to confirmation page
      setLocation('/add-cases/comment');
    } else {
      const nextIndex = navigation.currentPanelIndex + 1;
      setLocation(
        `/add-cases/dynamic/${navigation.currentConfigName}/${nextIndex}`,
      );
    }
  };

  const handlePrevious = () => {
    if (navigation.currentPanelIndex > 0) {
      const prevIndex = navigation.currentPanelIndex - 1;
      setLocation(
        `/add-cases/dynamic/${navigation.currentConfigName}/${prevIndex}`,
      );
    }
  };

  // Initialize URL-based navigation only once
  useEffect(() => {
    const path = location.split('/');
    if (
      path[1] === 'add-cases' &&
      path[2] === 'dynamic' &&
      path[3] &&
      path[4]
    ) {
      const configName = path[3];
      const panelIndex = parseInt(path[4]) || 0;

      if (configName !== navigation.currentConfigName) {
        const config = configs.find((c) => c.name === configName);
        if (config) {
          dispatch(
            setCurrentConfig({
              name: config.name,
              totalPanels: config.panels.length,
            }),
          );
          dispatch(setCurrentPanelIndex(panelIndex));
        }
      } else if (panelIndex !== navigation.currentPanelIndex) {
        dispatch(setCurrentPanelIndex(panelIndex));
      }
    }
  }, [location]); // Only depend on location to avoid loops

  const handleSupercomputerChange = (value: string) => {
    setSelectedSupercomputer(value);
  };

  if (!currentConfig) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            No Configuration Available
          </h2>
          <p className="text-muted-foreground">
            Please load a configuration schema to continue.
          </p>
        </div>
      </div>
    );
  }

  // Show comment page if we've reached the end of all panels
  if (navigation.currentPanelIndex >= currentConfig.panels.length) {
    return withAssistant(
      <DynamicCommentPage
        configName={navigation.currentConfigName}
        schema={currentConfig}
        onBack={handlePrevious}
        onSubmit={(createdId) => {
          if (createdId && currentUser?.id) {
            setLocation(`/cases/${currentUser.id}/${createdId}`);
          } else {
            setLocation('/cases');
          }
        }}
        panels={currentConfig.panels}
        currentIndex={navigation.currentPanelIndex}
        totalPanels={navigation.totalPanels}
        onPanelSelect={handlePanelSelect}
        selectedSupercomputer={selectedSupercomputer}
        onSupercomputerChange={handleSupercomputerChange}
      />,
    );
  }

  const currentPanel = currentConfig.panels[navigation.currentPanelIndex];

  if (!currentPanel) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Panel Not Found</h2>
          <p className="text-muted-foreground">
            The requested panel does not exist.
          </p>
        </div>
      </div>
    );
  }

  return withAssistant(
    <DynamicPanelPage
      key={currentPanel.id} // Add key to ensure component re-mounts
      configName={navigation.currentConfigName}
      panel={currentPanel}
      panels={currentConfig.panels}
      currentIndex={navigation.currentPanelIndex}
      totalPanels={navigation.totalPanels}
      onPanelSelect={handlePanelSelect}
      onNext={handleNext}
      onPrevious={handlePrevious}
      canGoPrevious={navigation.currentPanelIndex > 0}
      selectedSupercomputer={selectedSupercomputer}
      onSupercomputerChange={handleSupercomputerChange}
    />,
  );
};

export default DynamicCaseRouter;
