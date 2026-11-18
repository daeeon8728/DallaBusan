import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const rawConfig: unknown = JSON.parse(await readFile(new URL('../config/provider-boundaries.json', import.meta.url), 'utf8'));
function readBrandTokens(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || !('forbiddenBrandTokens' in value)
    || !Array.isArray(value.forbiddenBrandTokens)
    || !value.forbiddenBrandTokens.every((token: unknown) => typeof token === 'string')) {
    throw new Error('Invalid provider boundary configuration.');
  }
  return value.forbiddenBrandTokens;
}
const BRAND_TOKENS = readBrandTokens(rawConfig);

export function inspectSource(filePath: string, source: string): string[] {
  const normalized = filePath.replaceAll('\\', '/');
  const errors: string[] = [];
  const isDomain = normalized.startsWith('packages/domain/');
  const isWeb = normalized.startsWith('apps/web/src/');
  const isConfig = normalized.startsWith('apps/server/src/config/');
  const isAdapter = normalized.startsWith('apps/server/src/providers/affiliate/');
  const tree = ts.createSourceFile(normalized, source, ts.ScriptTarget.Latest, true);

  function inspect(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = node.moduleSpecifier.text;
      if (isDomain && (/^(node:|react(?:-dom|-leaflet)?(?:\/|$)|leaflet|pixi\.js|fastify)/.test(target)
        || /apps\/|providers\/|config\/|repositories/.test(target))) {
        errors.push('Domain must not import runtime, UI, provider, or persistence layers.');
      }
      if (isWeb && (/^node:|server\/|providers\/affiliate|config\/providers/.test(target))) {
        errors.push('Web source must not import server or private provider configuration.');
      }
    }
    if (ts.isPropertyAccessExpression(node) && node.getText(tree) === 'process.env' && !isConfig) {
      errors.push('Environment access belongs in the server configuration boundary.');
    }
    if (ts.isPropertyAccessExpression(node) && node.getText(tree).startsWith('import.meta.env') && isWeb) {
      errors.push('Web components must consume public configuration via the API.');
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !isConfig) {
      const value = node.text.toLowerCase();
      if (BRAND_TOKENS.some((token) => value.includes(token.toLowerCase()))) {
        errors.push('Provider brand literals belong in provider configuration.');
      }
      if (/^PROVIDER_[A-Z0-9_]+$/.test(node.text) && !isAdapter) {
        errors.push('Fixed provider IDs must not couple application logic to registry entries.');
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(tree);
  return [...new Set(errors)];
}

async function collect(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => entry.name !== 'node_modules' && entry.name !== 'dist').map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  }));
  return nested.flat();
}

async function main() {
  const sources = (await Promise.all(['apps/web/src', 'apps/server/src', 'packages/domain/src']
    .map((directory) => collect(path.join(ROOT, directory))))).flat();
  const violations: string[] = [];
  for (const source of sources) {
    const relative = path.relative(ROOT, source).replaceAll('\\', '/');
    for (const message of inspectSource(relative, await readFile(source, 'utf8'))) {
      violations.push(relative + ': ' + message);
    }
  }
  if (violations.length > 0) throw new Error(violations.join('\n'));
  console.log('Provider boundaries: ' + sources.length + ' source files passed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Provider boundary check failed.');
    process.exitCode = 1;
  });
}
