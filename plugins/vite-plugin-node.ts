import { VitePluginNode } from "vite-plugin-node";

export const vitePluginNode = () =>
  VitePluginNode({
    // Nodejs native Request adapter
    // currently this plugin support 'express', 'nest', 'koa' and 'fastify' out of box,
    // you can also pass a function if you are using other frameworks, see Custom Adapter section
    adapter: "fastify",

    // tell the plugin where is your project entry
    appPath: "./src/index.ts",

    // Optional, default: 'viteNodeApp'
    // the name of named export of you app from the appPath file
    exportName: "viteNodeApp",

    outputFormat: "esm",

    // Optional, default: false
    // if you want to init your app on boot, set this to true
    initAppOnBoot: false,

    // Optional, default: 'esbuild'
    // The TypeScript compiler you want to use
    // by default this plugin is using vite default ts compiler which is esbuild
    // 'swc' compiler is supported to use as well for frameworks
    // like Nestjs (esbuild dont support 'emitDecoratorMetadata' yet)
    // you need to INSTALL `@swc/core` as dev dependency if you want to use swc
    tsCompiler: "esbuild",

    // Optional, default: {
    // jsc: {
    //   target: 'es2019',
    //   parser: {
    //     syntax: 'typescript',
    //     decorators: true
    //   },
    //  transform: {
    //     legacyDecorator: true,
    //     decoratorMetadata: true
    //   }
    // }
    // }
    // swc configs, see [swc doc](https://swc.rs/docs/configuration/swcrc)
    swcOptions: {
      minify: true,
      jsc: {
        target: "esnext",
        minify: {
          compress: true,
        },
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    },
  });
