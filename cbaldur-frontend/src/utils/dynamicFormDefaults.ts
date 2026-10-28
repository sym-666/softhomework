import type { ConfigSchema, Field, LongArray, ShortArray } from '@/types/ConfigSchema';

export type PanelFormData = {
  [panelId: string]: {
    [fieldId: string]: boolean | number | ShortArray | LongArray;
  };
};

/** Default value rules must match `dynamicFormSlice.initializePanel`. */
export function getFieldDefaultValue(
  field: Pick<Field, 'type' | 'default'>,
): boolean | number | ShortArray | LongArray {
  switch (field.type) {
    case 'bool':
      return field.default ?? false;
    case 'number':
      return field.default ?? 0;
    case 'short_array':
      return (field.default as ShortArray | undefined) ?? [];
    case 'long_array':
      return (
        (field.default as LongArray | undefined) ?? { index: [], values: [] }
      );
    default: {
      const _exhaustive: never = field.type;
      void _exhaustive;
      return 0;
    }
  }
}

/** Build a full panel-prototype object from schema defaults (does not touch Redux). */
export function buildDefaultPanelData(schema: ConfigSchema): PanelFormData {
  const data: PanelFormData = {};
  for (const panel of schema.panels) {
    data[panel.id] = {};
    for (const field of panel.fields) {
      data[panel.id][field.id] = getFieldDefaultValue(field);
    }
  }
  return data;
}
