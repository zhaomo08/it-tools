type SamplePayload = Record<string, unknown>;

export function getSampleValue(variable: string): string {
  const normalized = variable.toLowerCase();

  if (normalized.includes('max') || normalized.includes('count') || normalized.includes('num') || normalized.includes('words')) {
    return '120';
  }
  if (normalized.includes('date') || normalized.includes('time')) {
    return '2026-06-15';
  }
  if (normalized.includes('language') || normalized.includes('locale')) {
    return 'zh-CN';
  }
  if (normalized.includes('role')) {
    return 'Senior Product Marketing Manager';
  }
  if (normalized.includes('tone') || normalized.includes('style')) {
    return 'clear and confident';
  }

  return 'example-value';
}

export function buildNestedSamplePayload(variables: string[]): SamplePayload {
  return variables.reduce<SamplePayload>((payload, variable) => {
    const path = variable.split('.').filter(Boolean);
    let current = payload;

    path.forEach((part, index) => {
      const isLeaf = index === path.length - 1;

      if (isLeaf) {
        current[part] = getSampleValue(variable);
        return;
      }

      if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
        current[part] = {};
      }

      current = current[part] as SamplePayload;
    });

    return payload;
  }, {});
}
