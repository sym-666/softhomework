// Types generated to match backend Schemas/config-schema.json

export type ShortArray = number[];

export interface LongArray {
  index: number[];
  values: number[];
}

export type FieldType = 'bool' | 'number' | 'short_array' | 'long_array';

export interface Field {
  id: string;
  type: FieldType;
  namelist: string; // refers to definitions.namelist
  description?: string | null;
  max?: number | null;
  min?: number | null;
  step?: number | null;
  /** For long_array: emit JSON booleans so converter writes .true./.false. */
  elementType?: 'number' | 'bool';
  // default follows the type
  default?: boolean | number | ShortArray | LongArray;
}

export interface Panel {
  id: string;
  description?: string | null;
  fields: Field[];
}

export interface ConfigSchema {
  $schema?: string; // Optional schema URL reference present in the YAML
  name: string; // Support multiple config types, not just 'baldur'
  version: number;
  namelists: string[]; // unique items; at least 1
  panels: Panel[]; // at least 1
}
