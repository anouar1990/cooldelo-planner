const execSync = require('child_process').execSync;
const fs = require('fs');
try {
  console.log('Fetching types...');
  const result = execSync('npx -y supabase@2.78.1 gen types typescript --project-id hlyckksmgyfckfxtoscc', {encoding: 'utf-8', stdio: 'pipe'});
  fs.writeFileSync('src/lib/database.types.ts', result);
  console.log('Types generated natively');
} catch (e) {
  console.log('Error generating types:', e.message);
  console.log(e.stdout);
  console.log(e.stderr);
}
