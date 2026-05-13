import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Maps VITE_* and REACT_APP_* from .env to process.env.REACT_APP_* for existing source. */
function buildReactAppEnvDefines(mode) {
  const env = loadEnv(mode, __dirname, ['VITE_', 'REACT_APP_']);
  const define = {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  };
  for (const [key, value] of Object.entries(env)) {
    const reactKey = key.startsWith('VITE_') ? `REACT_APP_${key.slice(5)}` : key;
    if (reactKey.startsWith('REACT_APP_')) {
      define[`process.env.${reactKey}`] = JSON.stringify(value);
    }
  }
  return define;
}

function apiProxyTarget(env) {
  const raw =
    env.VITE_API_URL ||
    env.REACT_APP_API_URL ||
    env.VITE_BACKEND_URL ||
    env.REACT_APP_BACKEND_URL ||
    'http://localhost:4002';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:4002';
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, ['VITE_', 'REACT_APP_']);
  return {
    plugins: [
      {
        name: 'load-js-files-as-jsx',
        async transform(code, id) {
          if (!id.includes('node_modules') && /src\/.*\.js$/.test(id)) {
            return transformWithEsbuild(code, id, {
              loader: 'jsx',
              jsx: 'automatic',
            });
          }
          return null;
        },
      },
      react(),
    ],
    define: buildReactAppEnvDefines(mode),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget(env),
          changeOrigin: true,
        },
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.js$/,
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      environment: 'node',
      globals: true,
    },
  };
});
