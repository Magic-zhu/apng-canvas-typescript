import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'build/apng-canvas-typescript-iife.js',
      format: 'iife'
    },
    {
      file: 'build/apng-canvas-typescript-es.js',
      format: 'esm'
    }
  ],
  plugins: [
    typescript(),
  ],
};