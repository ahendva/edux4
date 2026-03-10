// global.d.ts — React Native / Expo global declarations
// These are provided at runtime by the RN environment; declare them here for TypeScript.

declare const __DEV__: boolean;
declare const __dirname: string;
declare const __filename: string;

// CommonJS require (available in RN's Metro bundler)
declare function require(module: string): unknown;
declare interface NodeRequire {
  (module: string): unknown;
}

// Node.js process shim — available via Expo's environment variable injection
declare const process: {
  env: Record<string, string | undefined>;
};

// JSX global namespace — tells TypeScript that JSX children between tags are the 'children' prop
declare namespace JSX {
  interface ElementChildrenAttribute {
    children: unknown;
  }
}
