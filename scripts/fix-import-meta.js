const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../web-build/_expo/static/js/web');

if (fs.existsSync(jsDir)) {
    const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const filePath = path.join(jsDir, file);
        let code = fs.readFileSync(filePath, 'utf8');
        
        // Replace import.meta with a safe dummy object to prevent SyntaxError in non-module scripts
        const newCode = code.replace(/import\.meta/g, '({url: ""})');
        
        if (code !== newCode) {
            fs.writeFileSync(filePath, newCode);
            console.log(`Fixed import.meta in ${file}`);
        }
    }
} else {
    console.log('No web-build JS directory found.');
}

// Ensure auth/callback route exists in web-build for OAuth redirects
const callbackSource = path.join(__dirname, '../public/auth/callback.html');
if (fs.existsSync(callbackSource)) {
    const webBuildAuthDir = path.join(__dirname, '../web-build/auth');
    const webBuildAuthCallbackDir = path.join(__dirname, '../web-build/auth/callback');
    
    if (!fs.existsSync(webBuildAuthDir)) fs.mkdirSync(webBuildAuthDir, { recursive: true });
    if (!fs.existsSync(webBuildAuthCallbackDir)) fs.mkdirSync(webBuildAuthCallbackDir, { recursive: true });
    
    fs.copyFileSync(callbackSource, path.join(webBuildAuthDir, 'callback.html'));
    fs.copyFileSync(callbackSource, path.join(webBuildAuthCallbackDir, 'index.html'));
    console.log('Successfully generated auth/callback/index.html and auth/callback.html');
}

