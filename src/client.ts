import './styles.css';

type SearchItem = {
  title: string;
  subtitle: string;
  href: string;
  terms: string;
  kind: 'institution' | 'brand' | 'guide';
};

declare global {
  interface Window {
    ISPB_SEARCH?: SearchItem[];
  }
}

const input = document.querySelector<HTMLInputElement>('[data-search-input]');
const results = document.querySelector<HTMLElement>('[data-search-results]');
const items = window.ISPB_SEARCH ?? [];

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function render(query: string) {
  if (!results) return;
  const q = normalize(query.trim());
  if (!q) {
    results.innerHTML = '';
    return;
  }

  const matches = items
    .filter(item => normalize(item.terms).includes(q))
    .slice(0, 12);

  results.innerHTML = matches.length
    ? matches.map(item => `
        <a class="result" href="${item.href}">
          <span class="result-kind">${item.kind === 'institution' ? 'Instituição' : item.kind === 'brand' ? 'Marca' : 'Guia'}</span>
          <strong>${item.title}</strong>
          <small>${item.subtitle}</small>
        </a>
      `).join('')
    : '<p class="empty">Nada encontrado. Tente nome da marca, banco, CNPJ ou ISPB.</p>';
}

input?.addEventListener('input', event => {
  render((event.target as HTMLInputElement).value);
});
