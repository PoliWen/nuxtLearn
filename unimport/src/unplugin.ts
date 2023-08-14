import { promises as fs } from 'fs'
import { join } from 'pathe'
import { createUnplugin } from 'unplugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import { UnimportOptions } from './types'
import { createUnimport } from './context'
import { scanDirExports } from './scan-dirs'
import { toImports } from './utils'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern
  exclude: FilterPattern
  dts: boolean | string
  /**
   * Enable implicit auto import.
   * Generate global TypeScript definitions.
   *
   * @default true
   */
  autoImport?: boolean
}

export const defaultIncludes = [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/]
export const defaultExcludes = [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]

function toArray<T> (x: T | T[] | undefined | null): T[] {
  return x == null ? [] : Array.isArray(x) ? x : [x]
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options = {}) => {
  const ctx = createUnimport(options)
  const filter = createFilter(
    toArray(options.include as string[] || []).length
      ? options.include
      : defaultIncludes,
    options.exclude || defaultExcludes
  )
  console.log('filter', filter)
  const dts = options.dts === true
    ? 'unimport.d.ts'
    : options.dts

  const {
    autoImport = true
  } = options

  return {
    name: 'unimport',
    enforce: 'post',
    transformInclude (id) {
      return filter(id)
    },
    async transform (code, id) {
      // console.log(222222222)
      // console.log({
      //   code, id
      // })

      const s = new MagicString(code)
      // console.log('autoImport', autoImport)
      await ctx.injectImports(s, id, {
        autoImport
      })

      if (!s.hasChanged()) {
        return
      }

      // console.log(s.toString())

      return {
        code: s.toString(),
        map: s.generateMap()
      }
    },
    async buildStart () {
      // console.log(11111111111111)
      // const dir = join(__dirname, '../playground/composables')
      // const importsResult = await scanDirExports(dir)
      // console.log(importsResult)
      // const toImportResult = toImports(importsResult)
      // console.log('toImportResult', toImportResult)

      await ctx.init()

      if (dts) {
        return fs.writeFile(dts, await ctx.generateTypeDeclarations(), 'utf-8')
      }
    }
  }
})
