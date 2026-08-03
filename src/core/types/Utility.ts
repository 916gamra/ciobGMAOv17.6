// Readonly - prevent modification
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// DeepPartial - Make all nested properties optional
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// NonNullable - Remove null and undefined
export type NonNullableProps<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

// Extract functions from a type
export type FunctionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

// Extract properties from a type that are NOT functions
export type DataProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

// A custom Dictionary type (Record)
export type Dictionary<T> = Record<string, T>;
