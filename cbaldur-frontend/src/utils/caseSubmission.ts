import type { ConfigSchema, Field, Panel } from '@/types/ConfigSchema';

/** Default matches namelist template header (exactly 4 comment lines after F 0 0 0) */
export const DEFAULT_CASE_COMMENT = `iter058f ITER
T_edge = 1.00, n_e_edge/ne-bar = 0.75, <n_e20> = 1.1
100 MW NBI, 90-150 sec, Bt = 5.7T, Ip = 24MA
D + T w/ Carbon + Helium, Zeff = 1.5`;

/** Force comment to exactly 4 lines for JsonToNmlConverter / namelist header. */
export function normalizeCommentToFourLines(raw: string): string {
  let lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '' && /\n$/.test(raw)) {
    lines = lines.slice(0, -1);
  }
  while (lines.length < 4) {
    lines.push('');
  }
  if (lines.length > 4) {
    lines = [lines[0], lines[1], lines[2], lines.slice(3).join('')];
  }
  return lines.join('\n');
}

export function countCommentLines(raw: string): number {
  let lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '' && /\n$/.test(raw)) {
    lines = lines.slice(0, -1);
  }
  return lines.length;
}

/**
 * Transform panel-organized prototype data into namelist-keyed CaseJson shape.
 * Byte-level semantics must match the former DynamicCommentPage inline transform.
 */
export function transformPanelDataForSubmission(
  schema: ConfigSchema,
  panelData: Record<string, Record<string, unknown>> | undefined | null,
): { [namelist: string]: { [key: string]: unknown } } {
  const transformed: { [namelist: string]: { [key: string]: unknown } } = {};
  if (!panelData) return {};

  schema.namelists.forEach((namelist: string) => {
    transformed[namelist] = {};
  });

  const getFieldSchema = (
    panelId: string,
    fieldId: string,
  ): Field | undefined => {
    const panel = schema.panels.find((p: Panel) => p.id === panelId);
    return panel?.fields.find((f: Field) => f.id === fieldId);
  };

  const panelsData = panelData as Record<string, Record<string, unknown>>;

  for (const panelId in panelsData) {
    const fields = panelsData[panelId];
    for (const fieldId in fields) {
      const value = fields[fieldId];
      const fieldSchema = getFieldSchema(panelId, fieldId);

      if (!fieldSchema || value === null || value === undefined) continue;

      const { namelist, type } = fieldSchema;
      if (!namelist || !transformed[namelist]) continue;

      let key = fieldId;

      switch (type) {
        case 'long_array':
          if (
            typeof value === 'object' &&
            value !== null &&
            'index' in value &&
            'values' in value
          ) {
            const indices = (value as { index?: number[] }).index;
            const values = (value as { values?: number[] }).values;
            if (namelist.startsWith('nmread')) {
              key = key.slice(0, -1);
            }
            if (Array.isArray(indices) && Array.isArray(values)) {
              const asLogical = fieldSchema.elementType === 'bool';
              indices.forEach((idx, i) => {
                if (values[i] !== undefined) {
                  // Fortran LOGICAL namelist rejects 0/1; converter needs JSON booleans
                  transformed[namelist][`${key}(${idx})`] = asLogical
                    ? Boolean(values[i])
                    : values[i];
                }
              });
            }
          }
          break;
        case 'bool':
        case 'number':
        case 'short_array':
        default:
          if (namelist.startsWith('nmread')) {
            key = key.slice(0, -1);
          }
          if (type === 'bool') {
            transformed[namelist][key] = Boolean(value);
          } else if (type === 'number') {
            transformed[namelist][key] = Number(value);
          } else if (type === 'short_array') {
            if (typeof value === 'string') {
              transformed[namelist][key] = value
                .split(/\s+/)
                .filter(Boolean)
                .map(Number);
            } else if (Array.isArray(value)) {
              transformed[namelist][key] = value.map(Number);
            }
          } else {
            transformed[namelist][key] = value;
          }
          break;
      }
    }
  }

  return transformed;
}
