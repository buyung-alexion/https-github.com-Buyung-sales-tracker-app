const fs = require('fs');

let cssFile = 'C:/Sales Tracker/src/index.css';
let css = fs.readFileSync(cssFile, 'utf8');

const newNavCss = `
/* Gojek Style Bottom Nav */
.gojek-nav {
  background: #ffffff !important;
  border-top: 1px solid #f1f5f9;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
}

.gojek-nav .nav-item {
  position: relative;
  flex: 1;
}

.gojek-nav .nav-icon-bubble, .gojek-nav .nav-item::after {
  display: none !important;
}

.gojek-nav .nav-icon-svg {
  color: #94A3B8;
  transition: all 0.2s;
}

.gojek-nav .nav-label {
  color: #94A3B8;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s;
}

.gojek-nav .nav-item.active .nav-icon-svg {
  color: #00AA13;
}

.gojek-nav .nav-item.active .nav-label {
  color: #00AA13;
  font-weight: 800;
}

.gojek-nav-fab {
  position: absolute;
  top: -24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #00AA13;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  box-shadow: 0 8px 16px rgba(0,170,19,0.3);
}

.gojek-nav-fab:active {
  transform: scale(0.9);
}

.gojek-nav-fab svg {
  color: #ffffff;
}
`;

if (!css.includes('.gojek-nav')) {
    fs.writeFileSync(cssFile, css + '\n' + newNavCss);
}

let shellFile = 'C:/Sales Tracker/src/pages/mobile/MobileShell.tsx';
let shell = fs.readFileSync(shellFile, 'utf8');
shell = shell.replace(/wallet-nav-dark/g, 'gojek-nav');
shell = shell.replace(/wallet-nav-fab/g, 'gojek-nav-fab');
shell = shell.replace(/<ShoppingCart size=\{24\} strokeWidth=\{2\.5\} color="#111827" \L>/g, '<ShoppingCart size={24} strokeWidth={2.5} color="#ffffff" />');
fs.writeFileSync(shellFile, shell);

console.log('Nav updated');
