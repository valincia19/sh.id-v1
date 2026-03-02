const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                fileList = walk(path.join(dir, file), fileList);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

const files = walk('C:/docker/next-js/scripthub.id/src');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Pattern A: StudioSidebar/Header Setting User + Checking auth
    // if (authApi.isAuthenticated()) { setUser(authApi.getStoredUser()); }
    // else { setUser(null); }
    const pA = /if\s*\(\s*authApi\.isAuthenticated\(\)\s*\)\s*\{\s*\n*\s*setUser\(authApi\.getStoredUser\(\)\);\s*\n*\s*\}\s*else\s*\{\s*\n*\s*setUser\(null\);\s*\n*\s*\}/g;
    content = content.replace(pA, `authApi.getMe().then(({user}) => setUser(user)).catch(() => setUser(null));`);

    // Single checks
    content = content.replace(/setUser\(authApi\.getStoredUser\(\)\);/g, `authApi.getMe().then(({user}) => setUser(user)).catch(() => setUser(null));`);

    // Pattern B: Admin Layout route guard
    content = content.replace(/const\s+(?:user|userData|storedUser|stored|current)\s*=\s*authApi\.getStoredUser\(\);\s*\n*\s*if\s*\(!authApi\.isAuthenticated\(\)\s*\|\|\s*!(?:user|userData|storedUser|stored|current)\?\.roles\?\.includes\("admin"\)\)\s*\{\s*router\.(?:replace|push)\("\/home"\);\s*return;\s*\}/g,
        `authApi.getMe().then(({user}) => { if (!user?.roles?.includes("admin")) { router.replace("/home"); return; } }).catch(() => router.replace("/home"));`);

    // Pattern C: Studio page route guard
    content = content.replace(/if\s*\(!authApi\.isAuthenticated\(\)\)\s*\{\s*router\.(?:replace|push)\("\/home"\);\s*return;\s*\}/g,
        `authApi.getMe().catch(() => router.push("/home"));`);

    // Cleanup lingering variables
    content = content.replace(/const\s+(?:user|userData|storedUser|stored|current)\s*=\s*authApi\.getStoredUser\(\);\s*/g, ``);

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
    }
}
