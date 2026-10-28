import nerdamer from 'nerdamer-prime';

export type ExpressionVariable = {
  alias: string;
  header: string;
};

export type ParsedExpression = {
  expression: string;
  variableNames: string[];
  variableHeaders: string[];
};

export type ExpressionEvaluationError = 'missing-value' | 'non-finite-result';

export function buildExpressionVariables(
  headers: string[] | undefined,
  xHeader: string | undefined,
  yHeader: string | undefined,
): ExpressionVariable[] {
  // Number auxiliary columns sequentially as v1..vn (skip x/y), not by raw header index.
  let aliasIndex = 0;
  return (headers ?? []).flatMap((header) => {
    if (header === xHeader || header === yHeader) return [];
    aliasIndex += 1;
    return [{ alias: `v${aliasIndex}`, header }];
  });
}

export function parseExpression(
  expression: string,
  variables: ExpressionVariable[],
): ParsedExpression {
  const parsed = nerdamer(expression);
  const variableNames = parsed.variables();
  const supportedNames = new Set([
    'x',
    'y',
    ...variables.map((variable) => variable.alias),
  ]);
  const unsupportedNames = variableNames.filter(
    (name) => !supportedNames.has(name),
  );
  if (unsupportedNames.length > 0) {
    throw new Error(`Unsupported variables: ${unsupportedNames.join(', ')}`);
  }

  const variablesByAlias = new Map(
    variables.map((variable) => [variable.alias, variable.header]),
  );
  return {
    expression,
    variableNames,
    variableHeaders: variableNames.flatMap((name) => {
      const header = variablesByAlias.get(name);
      return header ? [header] : [];
    }),
  };
}

export function hydrateExpressionVariables(
  data: Record<string, unknown>[],
  variables: ExpressionVariable[],
): Record<string, unknown>[] {
  if (variables.length === 0) return data;
  return data.map((item) => {
    const sourceValues = item.variables;
    if (!sourceValues || typeof sourceValues !== 'object') return item;
    const hydrated = { ...item };
    for (const variable of variables) {
      hydrated[variable.alias] = (sourceValues as Record<string, unknown>)[
        variable.header
      ];
    }
    return hydrated;
  });
}

export function evaluateExpression(
  data: Record<string, unknown>[],
  parsedExpression: ParsedExpression,
  xKey: string,
  yKey: string,
): { data: Record<string, unknown>[]; error?: ExpressionEvaluationError } {
  const fn = nerdamer(parsedExpression.expression).buildFunction(
    parsedExpression.variableNames,
  );
  let error: ExpressionEvaluationError | undefined;
  const evaluated = data.map((item) => {
    const values = parsedExpression.variableNames.map((name) => {
      const value =
        name === 'x' ? item[xKey] : name === 'y' ? item[yKey] : item[name];
      const numeric = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(numeric) ? numeric : undefined;
    });
    if (values.some((value) => value === undefined)) {
      error ??= 'missing-value';
      return item;
    }
    const result = fn(...(values as number[]));
    if (!Number.isFinite(result)) {
      error ??= 'non-finite-result';
      return item;
    }
    return { ...item, [yKey]: result };
  });
  return { data: evaluated, error };
}
