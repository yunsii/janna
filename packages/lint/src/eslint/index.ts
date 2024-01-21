import antfu from '@antfu/eslint-config'

import { getNextFlatConfigs } from './rules/next'
import { getTailwindFlatConfigs } from './rules/tailwind'

import type { Awaitable, FlatConfigItem, OptionsConfig, UserConfigItem } from '@antfu/eslint-config'
import type { GetTailwindFlatConfigsOptions } from './rules/tailwind'
import type { GetNextFlatConfigsOptions } from './rules/next'

export interface JannaOptions extends GetNextFlatConfigsOptions, GetTailwindFlatConfigsOptions {
  prettier?: boolean
}

// 基于 @antfu/eslint-config 定制功能
// 旨在使得代码具备更好的交互性
export default async function janna(
  options: OptionsConfig & FlatConfigItem & JannaOptions = {},
  ...userConfigs: Awaitable<UserConfigItem | UserConfigItem[]>[]
) {
  const { next, tailwind, prettier = false, ...antfuOptions } = options

  const result = await antfu(
    {
      stylistic: prettier
        ? false
        : {
            overrides: {
              curly: ['error', 'all'],
            },
          },
      react: {
        overrides: {
          'react/prop-types': 'off',
        },
      },
      vue: false,
      formatters: prettier
        ? false
        : {
          // 如果项目不启用 prettier，内部通过 eslint-plugin-format 格式化 CSS HTML 和 Markdown
          // 同时 VS Code 开启 eslint 校验以下格式，使得保存时能够自动格式化处理
            /**
             * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
             * By default uses Prettier
             */
            css: true,
            /**
             * Format HTML files
             * By default uses Prettier
             */
            html: true,
            /**
             * Format Markdown files
             * Supports Prettier and dprint
             * By default uses Prettier
             */
            markdown: 'prettier',
          },
      ...antfuOptions,
    },
    getNextFlatConfigs({ next }),
    getTailwindFlatConfigs({ tailwind }),
    {
      // 交互优化
      rules: {
        // 重写
        // 总是添加小括号，方便扩展入参，后续不用手动添加小括号
        'style/arrow-parens': ['error', 'always'],
        // 能使用单引号的地方都使用单引号
        'style/jsx-quotes': ['error', 'prefer-single'],
        // 关闭变量未使用校验，方便后续使用时还得去除前缀，如果保留前缀来使用也很奇怪
        'unused-imports/no-unused-vars': 'off',

        // 新增
        // https://github.com/prettier/prettier/issues/8207
        'unicorn/template-indent': ['warn', { tags: [], functions: [], selectors: ['TemplateLiteral'] }],
        'unicorn/no-lonely-if': 'warn',
        'unicorn/custom-error-definition': 'warn',
        'react/self-closing-comp': 'warn',
        'react/destructuring-assignment': 'error',
        'import/order': [
          'warn',
          {
            'groups': [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
              'type',
            ],
            'newlines-between': 'always',
          },
        ],
      },
    },
    ...userConfigs,
  )
  return result
}
