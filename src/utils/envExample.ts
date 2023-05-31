import fs from 'fs';

export default function envExample() {
  let envExample = fs.readFileSync('.env', 'utf8');
  // handle case where .env file not exist
  if (!envExample) return;
  envExample = envExample.replace(/=.*/g, '=env_value');
  fs.writeFileSync('.env.example', envExample);
}
