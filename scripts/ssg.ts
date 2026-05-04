import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INSTITUTIONS,
  getCatalogMetadata,
  searchInstitutionsByName,
  type InstitutionEntry,
} from '@thiagoprazeres/ispb-participants';
import { guides } from '../src/content.js';
import type { OwnershipMapping, SearchDocument } from '../src/types.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const base = '/ispb.app';

const ownership = JSON.parse(
  await readFile(path.join(root, 'data', 'ownership-curated.json'), 'utf8')
) as OwnershipMapping[];
const confirmedOwnership = ownership.filter(item => item.reviewStatus === 'confirmed');
const institutions = Object.values(INSTITUTIONS) as InstitutionEntry[];
const metadata = getCatalogMetadata();

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function page(title: string, body: string, search: SearchDocument[] = []) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | ispb.app</title>
  <meta name="description" content="Catálogo amigável de participantes Pix/SPI e empresas por trás de bancos, carteiras e fintechs.">
  <link rel="stylesheet" href="${base}/assets/styles.css">
  <script>window.ISPB_SEARCH=${JSON.stringify(search).replaceAll('<', '\\u003c')};</script>
  <script type="module" src="${base}/assets/app.js"></script>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="${base}/"><span class="brand-mark">I</span><span>ispb.app</span></a>
    <nav class="nav" aria-label="Principal">
      <a href="${base}/instituicoes/">Instituições</a>
      <a href="${base}/quem-esta-por-tras/">Quem está por trás</a>
      <a href="${base}/guias/">Guias</a>
      <a href="https://github.com/cafeinadesign/ispb.app">GitHub</a>
    </nav>
  </header>
  ${body}
  <footer class="footer">
    Dados de Pix/SPI via @thiagoprazeres/ispb-participants. Último snapshot: ${esc(metadata.snapshotDate)}.
  </footer>
</body>
</html>`;
}

async function write(relativePath: string, content: string) {
  const target = path.join(dist, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

function statusPills(inst: InstitutionEntry) {
  return `<div class="pill-row">
    <span class="pill${inst.inPixActive ? '' : ' off'}">Pix ativo</span>
    <span class="pill${inst.inSpi ? '' : ' off'}">SPI</span>
    <span class="pill${inst.inPixAdhesion ? '' : ' off'}">Em adesão</span>
  </div>`;
}

const guideDocs = guides.map(guide => ({
  title: guide.title,
  subtitle: guide.summary,
  href: `${base}/guias/${guide.slug}/`,
  terms: `${guide.title} ${guide.summary} ${guide.body.join(' ')}`,
  kind: 'guide' as const,
}));

const institutionDocs = institutions.map(inst => ({
  title: inst.shortName || inst.name,
  subtitle: `${inst.name} · ISPB ${inst.ispb}${inst.cnpj ? ` · CNPJ ${inst.cnpj}` : ''}`,
  href: `${base}/instituicoes/${inst.ispb}/`,
  terms: `${inst.name} ${inst.shortName} ${inst.ispb} ${inst.cnpj ?? ''}`,
  kind: 'institution' as const,
}));

const brandDocs = confirmedOwnership.map(item => ({
  title: item.brand,
  subtitle: `${item.operator} · ${item.relatedInstitutionName}`,
  href: `${base}/quem-esta-por-tras/#${slug(item.brand)}`,
  terms: `${item.brand} ${item.operator} ${item.parentCompany ?? ''} ${item.relatedInstitutionName} ${item.ispb ?? ''} ${item.cnpj ?? ''}`,
  kind: 'brand' as const,
}));

const searchDocs = [...institutionDocs, ...brandDocs, ...guideDocs];

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

const featured = searchInstitutionsByName('pagamento').slice(0, 6);
await write('index.html', page('Descubra quem opera no Pix/SPI', `
<section class="hero">
  <div class="hero-inner">
    <div>
      <p class="eyebrow">Dinheiro muda de mão em segundos. Entenda quem está no caminho.</p>
      <h1>Descubra quem opera no Pix/SPI e onde pode existir oportunidade.</h1>
      <p class="lead">Um catálogo pé no chão para investigar bancos, fintechs, carteiras e marcas financeiras sem precisar falar juridiquês.</p>
    </div>
    <aside class="hero-card">
      <strong>${institutions.length}</strong>
      <span>instituições e participantes mapeados a partir de fontes públicas do Banco Central.</span>
    </aside>
  </div>
</section>
<main class="main">
  <section class="section search-panel">
    <h2>Comece procurando uma marca, banco, CNPJ ou ISPB</h2>
    <p class="section-copy">Exemplo: banco, pagamento, cooperativa, 60746948 ou uma marca confirmada na curadoria.</p>
    <input class="search-input" data-search-input placeholder="Digite aqui..." autocomplete="off">
    <div class="results" data-search-results></div>
  </section>
  <section class="section">
    <h2>Primeiros caminhos</h2>
    <div class="grid">
      ${guides.slice(0, 3).map(guide => `<a class="card" href="${base}/guias/${guide.slug}/"><h3>${esc(guide.title)}</h3><p>${esc(guide.summary)}</p></a>`).join('')}
    </div>
  </section>
  <section class="section">
    <h2>Instituições para explorar</h2>
    <div class="institution-list">
      ${featured.map(inst => `<a class="institution-row" href="${base}/instituicoes/${inst.ispb}/"><span><strong>${esc(inst.shortName || inst.name)}</strong><small>${esc(inst.name)} · ISPB ${inst.ispb}</small></span>${statusPills(inst)}</a>`).join('')}
    </div>
  </section>
</main>`, searchDocs));

await write('instituicoes/index.html', page('Instituições', `
<main class="main">
  <section class="section">
    <h1>Instituições Pix/SPI</h1>
    <p class="section-copy">Use esta lista como ponto de partida. Cada página mostra dados oficiais e explica o que olhar.</p>
    <div class="institution-list">
      ${institutions.slice(0, 250).map(inst => `<a class="institution-row" href="${base}/instituicoes/${inst.ispb}/"><span><strong>${esc(inst.shortName || inst.name)}</strong><small>${esc(inst.name)} · ISPB ${inst.ispb}${inst.cnpj ? ` · CNPJ ${inst.cnpj}` : ''}</small></span>${statusPills(inst)}</a>`).join('')}
    </div>
  </section>
</main>`, searchDocs));

for (const inst of institutions) {
  await write(`instituicoes/${inst.ispb}/index.html`, page(inst.shortName || inst.name, `
<main class="main">
  <article class="detail">
    <p class="eyebrow">Instituição</p>
    <h1>${esc(inst.shortName || inst.name)}</h1>
    <p class="lead">${esc(inst.name)}</p>
    ${statusPills(inst)}
    <dl class="facts">
      <dt>ISPB</dt><dd>${inst.ispb}</dd>
      <dt>CNPJ</dt><dd>${inst.cnpj ?? 'Não informado no índice'}</dd>
      <dt>Tipo</dt><dd>${esc(inst.institutionType ?? 'Não informado')}</dd>
      <dt>Participação Pix</dt><dd>${esc(inst.pixParticipationType ?? 'Não informado')}</dd>
      <dt>Modo Pix</dt><dd>${esc(inst.pixParticipationMode ?? 'Não informado')}</dd>
      <dt>Participação SPI</dt><dd>${esc(inst.spiParticipationType ?? 'Não informado')}</dd>
      <dt>Autorizada BCB</dt><dd>${inst.authorizedByBcb === true ? 'Sim' : inst.authorizedByBcb === false ? 'Não' : 'Não informado'}</dd>
    </dl>
  </article>
</main>`, searchDocs));
}

await write('guias/index.html', page('Guias', `
<main class="main">
  <section class="section">
    <h1>Guias rápidos</h1>
    <p class="section-copy">Explicações curtas para entender o básico e investigar oportunidades com mais segurança.</p>
    <div class="grid">${guides.map(guide => `<a class="card" href="${base}/guias/${guide.slug}/"><h3>${esc(guide.title)}</h3><p>${esc(guide.summary)}</p></a>`).join('')}</div>
  </section>
</main>`, searchDocs));

for (const guide of guides) {
  await write(`guias/${guide.slug}/index.html`, page(guide.title, `
<main class="main">
  <article class="detail">
    <p class="eyebrow">Guia rápido</p>
    <h1>${esc(guide.title)}</h1>
    <p class="lead">${esc(guide.summary)}</p>
    ${guide.body.map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}
  </article>
</main>`, searchDocs));
}

await write('quem-esta-por-tras/index.html', page('Quem está por trás', `
<main class="main">
  <section class="section">
    <h1>Quem está por trás</h1>
    <p class="section-copy">Só publicamos vínculos confirmados por revisão humana. Rascunhos ficam no repositório, mas não aparecem aqui.</p>
    ${confirmedOwnership.length ? `<div class="grid">${confirmedOwnership.map(item => `<article class="card" id="${slug(item.brand)}"><h3>${esc(item.brand)}</h3><p>${esc(item.operator)}${item.parentCompany ? ` · ${esc(item.parentCompany)}` : ''}</p><p>${esc(item.notes)}</p><div class="pill-row"><span class="pill">${esc(item.confidence)}</span><span class="pill">${esc(item.relationshipType)}</span></div><p>${item.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a>`).join(' · ')}</p></article>`).join('')}</div>` : '<div class="card"><h3>Nenhum vínculo confirmado ainda</h3><p>A curadoria existe, mas os exemplos atuais estão como rascunho. Assim evitamos publicar associação fraca ou sem revisão.</p></div>'}
  </section>
</main>`, searchDocs));

await write('404.html', page('Página não encontrada', `
<main class="main">
  <section class="section">
    <h1>Essa página não apareceu no extrato.</h1>
    <p class="section-copy">Volte para a busca e tente por nome, CNPJ ou ISPB.</p>
    <p><a href="${base}/">Ir para a home</a></p>
  </section>
</main>`, searchDocs));

console.log(`Generated ${institutions.length} institution pages and ${guides.length} guides.`);
