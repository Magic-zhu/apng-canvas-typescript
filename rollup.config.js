import typescript from 'rollup-plugin-typescript2';
 
export default {
  input: 'src/index.ts',
  output: {
    file: 'build/apng-canvas-du.js',
    format: 'esm'
  },
  plugins: [
    typescript({
      libs:[
        
      ]
    }),
  ],
};