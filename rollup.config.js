import { uglify } from "rollup-plugin-uglify";
export default {
    input: 'src/main.js',
    output: {
      file: 'apng-canvas-typescript.min.js',
      format: 'es'
    },
    plugins:[
        uglify()
    ],
  };