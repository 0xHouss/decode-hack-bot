export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const hasDuplicates = (arr: any[]) => new Set(arr).size !== arr.length;