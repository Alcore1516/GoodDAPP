import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import dynamicImports from 'vite-plugin-dynamic-import';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'path';
import fs from 'fs/promises'
import graphqlLoader from "vite-plugin-graphql-loader";
import svgLoader from 'vite-plugin-svgr'
import { cjsInterop } from "vite-plugin-cjs-interop";
import { includes } from 'lodash';
import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';
import {flowPlugin, esbuildFlowPlugin} from '@bunchtogether/vite-plugin-flow'
import babel from "vite-plugin-babel";

const extensions = [
  ".web.tsx",
  ".tsx",
  ".web.ts",
  ".web.jsx",
  ".web.js",
  ".ts",
  ".jsx",
  ".js",
  ".css",
  ".json",
  ".mjs",
];

const jsxTransform = (matchers: RegExp[]) => ({
  name: 'js-in-jsx',
  load(id: string) {
    if (
      matchers.some((matcher) => matcher.test(id)) &&
      id.endsWith('.js')
    ) {
      const file = readFileSync(id, { encoding: 'utf-8' });
      return esbuild.transformSync(file, { loader: 'jsx', jsx: 'automatic' });
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({  
  server:
  {
    port: 3000,
  },
  envPrefix: ['REACT_APP_'],
  define: {
    // https://github.com/bevacqua/dragula/issues/602#issuecomment-1296313369
    "global":"globalThis",
  },  
  plugins: [svgLoader({include:"**/*.svg"}),flowPlugin(),react({
    babel: {
      // babel-macro is needed for lingui
      plugins: ['macros'],
    },
  }), dynamicImports(),nodePolyfills({
       globals: {
         Buffer: true,
         global: true,
         process: true,
       },
     }),graphqlLoader()],
  resolve: {
    extensions,
    alias: {
      'react-native': 'react-native-web',
      'lottie-react-native': 'react-native-web-lottie',
      'react-native-svg': 'react-native-svg-web',
      'react-native-webview': 'react-native-web-webview',
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
      jsbi: path.resolve(__dirname, '..', 'node_modules', 'jsbi', 'dist', 'jsbi-cjs.js'),
    },
    dedupe: ['react', 'ethers', 'react-dom', 'native-base'],
  },
  build: {
    commonjsOptions: {   
      // exclude:[],
      include:["promisify-file-reader","buffer"],
      // include:['react-native-card-flip','react-native-switch'],  
      // exclude:['@gooddollar/react-native-facetec','styleq','react-native-web','react-native-device-info'],
      transformMixedEsModules: true, //handle deps that use "require" and "module.exports"
    },
    rollupOptions: {
      plugins:[jsxTransform([/react-native-/])],
      // external:['react-native-device-info']
      // external: ['@react-stately/combobox', '@react-stately/checkbox'], // exclude these deps from the bundle
    },
  },
  optimizeDeps: {      
    include:["react-native-animatable","react-native-switch","react-native-card-flip","promisify-file-reader","buffer"],
    exclude:[],  
    esbuildOptions: {         
      plugins:[esbuildFlowPlugin()],
      resolveExtensions:extensions,      
      loader: {
        '.js': 'jsx',
        '.html': 'text', // allow import or require of html files
      },
    },
  },
});
