import fs from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const v2Files = walk('./frontend-v2/src');
const v1Files = walk('./frontend/src');

const apiCalls: any[] = [];
// Match fetch(${API_BASE_URL}/endpoint) or api.get('/endpoint')
const regexV2 = /api\.(get|post|put|delete|patch)\(['\"](.*?)['\"]/g;
const regexV1 = /fetch\(['\"]\$\{API_BASE_URL\}(.*?)['\"]/g;

function analyze(files: string[], version: string, isV2: boolean) {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    const regex = isV2 ? regexV2 : regexV1;
    while ((match = regex.exec(content)) !== null) {
      if (isV2) {
        apiCalls.push({ version, file: path.basename(file), method: match[1].toUpperCase(), endpoint: match[2] });
      } else {
        // v1 doesn't capture method easily from fetch regex, so let's check nearby method: 'POST' etc
        // For simplicity, we just mark it as FETCH
        apiCalls.push({ version, file: path.basename(file), method: 'FETCH', endpoint: match[1] });
      }
    }
  }
}

analyze(v2Files, 'V2', true);
analyze(v1Files, 'V1', false);

const uniqueCalls = Array.from(new Set(apiCalls.map(c => c.version + ' ' + c.method + ' ' + c.endpoint))).sort();
console.log('Unique API Calls:');
uniqueCalls.forEach(c => console.log(c));
