const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace .titan-card
css = css.replace(
  /\.titan-card \{[^}]+\}/,
  `.titan-card {
    @apply relative overflow-hidden rounded-2xl bg-[#0f0f12] border border-[#1a1a1f] p-6 transition-colors duration-300 ease-in-out hover:border-rose-500/30 hover:bg-[#15181e];
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }`
);

// Replace button padding
css = css.replace(
  /\.titan-button \{[^}]+\}/,
  `.titan-button {
    @apply flex items-center justify-center gap-2 px-[12px] py-[12px] rounded-xl transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-mono uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-lg relative overflow-hidden;
  }`
);

fs.writeFileSync('src/index.css', css);
