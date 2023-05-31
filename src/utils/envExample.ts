import fs from 'fs';

export default function envExample() {
  try {
    let envExample = fs.readFileSync('.env', 'utf8');
    envExample = envExample.replace(/=.*/g, '=env_value');
    fs.writeFileSync('.env.example', envExample);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('.env file does not exist.');
    } else {
      console.error('Error reading .env file:', error);
    }
  }
}
