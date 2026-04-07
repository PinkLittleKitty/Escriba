const fs = require('fs');
const path = require('path');

const WWW_DIR = path.join(__dirname, '..', 'www');
const SRC_DIR = path.join(__dirname, '..', 'src');

function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    if (fs.lstatSync(source).isDirectory()) {
        const files = fs.readdirSync(source);
        files.forEach((file) => {
            const curSource = path.join(source, file);
            const curTarget = path.join(target, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, curTarget);
            } else {
                fs.copyFileSync(curSource, curTarget);
            }
        });
    }
}

if (fs.existsSync(WWW_DIR)) {
    fs.rmSync(WWW_DIR, { recursive: true, force: true });
}
fs.mkdirSync(WWW_DIR);

console.log('Copying index.html...');
fs.copyFileSync(path.join(__dirname, '..', 'index.html'), path.join(WWW_DIR, 'index.html'));

console.log('Copying icon.png...');
fs.copyFileSync(path.join(__dirname, '..', 'icon.png'), path.join(WWW_DIR, 'icon.png'));

console.log('Copying src directory...');
copyFolderRecursiveSync(SRC_DIR, path.join(WWW_DIR, 'src'));

console.log('Creating manifest.json...');
const manifest = {
    name: "Escriba",
    short_name: "Escriba",
    start_url: "index.html",
    display: "standalone",
    background_color: "#1e293b",
    theme_color: "#3b82f6",
    icons: [
        {
            src: "icon.png",
            sizes: "512x512",
            type: "image/png"
        }
    ]
};
fs.writeFileSync(path.join(WWW_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('Mobile assets prepared in www/');
