import process from 'node:process'
import path from 'node:path'
import type { Linter } from 'eslint'

import { FlatCompat } from '@eslint/eslintrc'
import { glob } from 'glob'
import { ALL_JS } from '../constants'

const compat = new FlatCompat()

/**
 * Process a Next.js root directory glob.
 */
function processRootDir(rootDir: string, cwd?: string): string[] {
  // Ensures we only match folders.
  if (!rootDir.endsWith('/')) {
    rootDir += '/'
  }

  return glob.sync(rootDir, { cwd })
}

export interface GetNextFlatConfigsOptions {
  /**
   * Requires installing:
   * - `@next/eslint-plugin-next`
   *
   * 常规单仓库单项目直接设置为 true 即可，如果是 monorepo 可通过 rootDir 配置相关目录，例如：
   *
   * rootDir: ["demos/with-nextjs"]
   */
  next?: boolean | {
    /**
     * 同 https://nextjs.org/docs/pages/building-your-application/configuring/eslint#rootdir
     *
     * 目前看来疑似并没有校验 app 路由
     */
    rootDir: string | string[]
    /**
     * 已知在开发环境的 monorepo 环境会出现 cwd 路径不符合预期的情况，
     * 特支持自定义 cwd
     */
    cwd?: string
  }
}

export function getNextFlatConfigs(
  options: GetNextFlatConfigsOptions = {},
) {
  const { next } = options

  const rules: Linter.FlatConfig[] = []

  if (!next) {
    return rules
  }

  if (typeof next === 'object') {
    // 使用 compat.config('next') 报错
    rules.push(...compat.plugins('@next/next').map((item) => {
      const { rootDir, cwd } = next

      const mergedCwd = cwd || process.cwd()

      let rootDirs = [mergedCwd]

      if (typeof rootDir === 'string') {
        rootDirs = processRootDir(rootDir, cwd)
      }
      else if (Array.isArray(rootDir)) {
        rootDirs = rootDir
          .map((dir) => (typeof dir === 'string' ? processRootDir(dir, cwd) : []))
          .flat()
      }

      return {
        ...item,
        settings: {
          next: {
            rootDir: rootDirs.map((item) => {
              return path.join(mergedCwd, item)
            }),
          },
        },
        files: rootDirs.map((dirItem) => {
          if (dirItem === '.') {
            return ALL_JS
          }

          return `${dirItem}/${ALL_JS}`
        }),
        // Customized from https://unpkg.com/@next/eslint-plugin-next@14.0.4/dist/index.js
        rules: {
          // warnings
          '@next/next/google-font-display': 'warn',
          '@next/next/google-font-preconnect': 'warn',
          '@next/next/next-script-for-ga': 'warn',
          '@next/next/no-async-client-component': 'warn',
          '@next/next/no-before-interactive-script-outside-document': 'warn',
          '@next/next/no-css-tags': 'warn',
          '@next/next/no-head-element': 'warn',
          // '@next/next/no-html-link-for-pages': 'warn',
          '@next/next/no-img-element': 'warn',
          '@next/next/no-page-custom-font': 'warn',
          '@next/next/no-styled-jsx-in-document': 'warn',
          // '@next/next/no-sync-scripts': 'warn',
          '@next/next/no-title-in-document-head': 'warn',
          '@next/next/no-typos': 'warn',
          '@next/next/no-unwanted-polyfillio': 'warn',
          // errors
          '@next/next/inline-script-id': 'error',
          '@next/next/no-assign-module-variable': 'error',
          '@next/next/no-document-import-in-page': 'error',
          '@next/next/no-duplicate-head': 'error',
          '@next/next/no-head-import-in-document': 'error',
          '@next/next/no-script-component-in-head': 'error',
          // next/core-web-vitals
          '@next/next/no-html-link-for-pages': 'error',
          '@next/next/no-sync-scripts': 'error',

          // Next.js 规范可以导出多个对象
          'react-refresh/only-export-components': 'off',
        } satisfies Linter.RulesRecord,
      }
    }))
    return rules
  }

  return getNextFlatConfigs({
    next: {
      rootDir: '.',
    },
  })
}
