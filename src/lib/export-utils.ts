import { GeneratedLandingPage, ColorPalette } from '@/types/landing-page';

export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function generateHTML(content: GeneratedLandingPage, palette: ColorPalette): string {
    const styles = `
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
    }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--background);
      color: var(--text);
      margin: 0;
      line-height: 1.5;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Playfair Display', serif;
      margin-top: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
      cursor: pointer;
      border: none;
      font-size: 1.125rem;
    }
    .btn:hover {
      transform: scale(1.05);
    }
    .btn-primary {
      background-color: var(--primary);
      color: var(--background);
    }
    section {
      padding: 5rem 0;
    }
    /* Add more basic CSS here for layout */
  `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.hero.headline}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  <!-- Hero -->
  <section style="text-align: center; min-height: 80vh; display: flex; align-items: center;">
    <div class="container">
      <div style="color: var(--primary); font-weight: 500; margin-bottom: 1rem;">${content.hero.eyebrow}</div>
      <h1 style="font-size: 3.5rem; margin-bottom: 1.5rem;">${content.hero.headline}</h1>
      <p style="font-size: 1.25rem; opacity: 0.8; max-width: 600px; margin: 0 auto 2rem;">${content.hero.subheadline}</p>
      <a href="#" class="btn btn-primary">${content.hero.ctaText}</a>
    </div>
  </section>

  <!-- Problem -->
  <section style="background-color: rgba(255,255,255,0.05);">
    <div class="container">
      <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem;">${content.problem.sectionHeader}</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
        ${content.problem.problems.map(p => `
          <div style="padding: 2rem; background: var(--background); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${p.statement}</h3>
            <p style="opacity: 0.8;">${p.agitation}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- More sections would go here (simplified for brevity) -->
  
  <footer style="padding: 3rem 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
    <div class="container">
      <div style="font-family: 'Playfair Display'; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">${content.footer.companyName}</div>
      <div style="opacity: 0.5;">&copy; ${new Date().getFullYear()} ${content.footer.companyName}</div>
    </div>
  </footer>
</body>
</html>`;
}

export function generateReactComponent(content: GeneratedLandingPage, palette: ColorPalette): string {
    return `import React from 'react';
import { ArrowRight, Check, Star, Quote } from 'lucide-react';

export default function LandingPage() {
  const colors = {
    primary: '${palette.primary}',
    secondary: '${palette.secondary}',
    accent: '${palette.accent}',
    background: '${palette.background}',
    text: '${palette.text}',
  };

  return (
    <div style={{ backgroundColor: colors.background, color: colors.text, fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span style={{ color: colors.primary }} className="font-medium">${content.hero.eyebrow}</span>
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-5xl md:text-7xl font-bold my-6">
            ${content.hero.headline}
          </h1>
          <p className="text-xl opacity-80 mb-8 max-w-2xl mx-auto">
            ${content.hero.subheadline}
          </p>
          <button 
            style={{ backgroundColor: colors.primary, color: colors.background }}
            className="px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center hover:scale-105 transition-transform"
          >
            ${content.hero.ctaText} <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-black/5">
        <div className="max-w-6xl mx-auto">
          <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl font-bold text-center mb-12">
            ${content.problem.sectionHeader}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            ${content.problem.problems.map(p => `
            <div style={{ backgroundColor: colors.background, borderColor: colors.text + '20' }} className="p-8 rounded-2xl border">
              <h3 className="text-xl font-bold mb-2">${p.statement}</h3>
              <p className="opacity-80">${p.agitation}</p>
            </div>`).join('')}
          </div>
        </div>
      </section>

      {/* Add other sections here... */}
      
      <footer className="py-12 border-t border-white/10 text-center">
        <div className="font-bold text-2xl mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          ${content.footer.companyName}
        </div>
        <div className="opacity-50">
          &copy; {new Date().getFullYear()} ${content.footer.companyName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
`;
}
