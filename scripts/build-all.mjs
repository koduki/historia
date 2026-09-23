import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const BOOKS_DIR = join(ROOT_DIR, 'books');
const OUTPUT_DIR = join(ROOT_DIR, '_book');

console.log('📚 Starting multi-book build process for Historia...\n');

// 1. Scan books directory
const entries = readdirSync(BOOKS_DIR);
const books = [];

for (const entry of entries) {
  if (entry.startsWith('_') || entry.startsWith('.')) continue;

  const bookPath = join(BOOKS_DIR, entry);
  if (!statSync(bookPath).isDirectory()) continue;

  const configPath = join(bookPath, 'book.json');
  try {
    const configRaw = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configRaw);
    books.push({
      slug: entry,
      path: bookPath,
      title: config.title || entry,
      author: config.author || 'koduki',
      description: config.description || ''
    });
  } catch (err) {
    console.warn(`⚠️  Skipping ${entry}: book.json not found or invalid.`);
  }
}

if (books.length === 0) {
  console.error('❌ No valid books found in books/ directory.');
  process.exit(1);
}

console.log(`Found ${books.length} book(s):`);
books.forEach(b => console.log(`  - [${b.slug}] ${b.title}`));
console.log('');

// Clean and ensure output dir exists
rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

// 2. Build each book
for (const book of books) {
  const targetDir = join(OUTPUT_DIR, book.slug);
  console.log(`🔨 Building [${book.slug}]: ${book.title}...`);
  try {
    const isWindows = process.platform === 'win32';
    const honkitCmd = isWindows ? 'npx.cmd honkit' : 'npx honkit';
    execSync(`${honkitCmd} build "${book.path}" "${targetDir}"`, {
      stdio: 'inherit',
      cwd: ROOT_DIR
    });
    console.log(`✅ [${book.slug}] built successfully.\n`);
  } catch (error) {
    console.error(`❌ Failed to build [${book.slug}]:`, error);
    process.exit(1);
  }
}

// 3. Generate portal index.html
console.log('🌐 Generating portal index.html...');
const portalHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Historia ―― 歴史論考・思想探究アーカイブ</title>
  <meta name="description" content="koduki による歴史論考・比較神話・人類史の著作アーカイブ。">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text-main: #f8fafc;
      --text-sub: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #7dd3fc;
      --badge-bg: #0369a1;
      --badge-text: #e0f2fe;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --card-border: #e2e8f0;
        --text-main: #0f172a;
        --text-sub: #475569;
        --accent: #0284c7;
        --accent-hover: #0369a1;
        --badge-bg: #e0f2fe;
        --badge-text: #0369a1;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.7;
      padding: 2.5rem 1.25rem;
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 3.5rem;
      text-align: center;
    }
    h1 {
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.lead {
      font-size: 1.15rem;
      color: var(--text-sub);
      max-width: 640px;
      margin: 0 auto;
    }
    .book-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .book-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 2rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
    }
    .book-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.3);
      border-color: var(--accent);
    }
    .book-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .book-title {
      font-size: 1.45rem;
      font-weight: 700;
      line-height: 1.4;
      color: var(--text-main);
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      background: var(--badge-bg);
      color: var(--badge-text);
      white-space: nowrap;
    }
    .book-desc {
      color: var(--text-sub);
      font-size: 0.98rem;
      line-height: 1.8;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .book-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      padding-top: 1rem;
      border-top: 1px solid var(--card-border);
    }
    .author {
      color: var(--text-sub);
    }
    .read-link {
      font-weight: 600;
      color: var(--accent);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    footer {
      margin-top: 5rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-sub);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Historia</h1>
      <p class="lead">歴史論考・比較神話・人類史の著作アーカイブ</p>
    </header>

    <main class="book-grid">
      ${books.map(b => `
      <a href="./${b.slug}/" class="book-card">
        <div class="book-header">
          <h2 class="book-title">${b.title}</h2>
          <span class="badge">Book</span>
        </div>
        <p class="book-desc">${b.description}</p>
        <div class="book-footer">
          <span class="author">著者: ${b.author}</span>
          <span class="read-link">作品を読む ➔</span>
        </div>
      </a>`).join('\n')}
    </main>

    <footer>
      <p>&copy; ${new Date().getFullYear()} koduki. Built with HonKit & GitHub Actions.</p>
    </footer>
  </div>
</body>
</html>`;

writeFileSync(join(OUTPUT_DIR, 'index.html'), portalHtml, 'utf8');
// GitHub Pages bypass Jekyll
writeFileSync(join(OUTPUT_DIR, '.nojekyll'), '', 'utf8');

console.log('✨ Portal index.html and .nojekyll created successfully!');
console.log('🎉 All books built successfully!\n');
