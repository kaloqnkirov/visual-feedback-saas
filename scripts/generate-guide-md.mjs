import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { transformSync } from 'esbuild'

const root = process.cwd()
const srcPath = path.join(root, 'lib', 'guide-content.ts')
const outDir = path.join(root, 'docs', 'user-guide')
const src = fs.readFileSync(srcPath, 'utf8')
const result = transformSync(src, { loader: 'ts', format: 'cjs' })
const require = createRequire(import.meta.url)
const mod = { exports: {} }
Function('exports', 'module', 'require', result.code)(mod.exports, mod, require)
const { GUIDE_BY_LANG } = mod.exports

fs.mkdirSync(outDir, { recursive: true })

for (const [code, doc] of Object.entries(GUIDE_BY_LANG)) {
  let md = `# ${doc.title}\n\n${doc.intro}\n\n`
  for (const section of doc.sections) {
    md += `## ${section.title}\n\n`
    for (const line of section.body) md += `- ${line}\n`
    md += '\n'
  }
  fs.writeFileSync(path.join(outDir, `${code}.md`), md, 'utf8')
  console.log('wrote', code)
}
