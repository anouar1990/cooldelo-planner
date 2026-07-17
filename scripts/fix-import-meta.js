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
