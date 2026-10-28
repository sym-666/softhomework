import React from 'react';
import { useSelector } from 'react-redux';
import DynamicCaseRouter from '@/components/add-cases/DynamicCaseRouter';
import type { RootState } from '@/redux/store';

const DynamicAddCasePage: React.FC = () => {
  const configs = useSelector((state: RootState) => state.inputs);

  // Show loading state while configs are being loaded
  if (configs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Configuration...</h2>
          <p className="text-muted-foreground">
            Please wait while we load the configuration schemas.
          </p>
        </div>
      </div>
    );
  }

  return <DynamicCaseRouter configs={configs} />;
};

export default DynamicAddCasePage;
