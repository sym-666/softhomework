import React from 'react';
import DynamicField from './DynamicField';
import type { Panel } from '@/types/ConfigSchema';

interface DynamicInputProps {
  panel: Panel;
  configName: string;
}

const DynamicInput: React.FC<DynamicInputProps> = ({ panel, configName }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {panel.fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          configName={configName}
          panelId={panel.id}
        />
      ))}
    </div>
  );
};

export default DynamicInput;
