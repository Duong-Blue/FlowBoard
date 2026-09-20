import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..');

const localesDir = path.join(baseDir, 'src', 'locales');
const enLocaleDir = path.join(localesDir, 'en');
const viLocaleDir = path.join(localesDir, 'vi');

const interpolationRegex = /{{\s*(\w+)\s*}}/g;

function readJsonFiles(dir) {
  let data = {};
  if (!fs.existsSync(dir)) {
    return data;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dir, file);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        data[file] = JSON.parse(fileContent);
      } catch (error) {
        console.error(`Error parsing JSON file ${filePath}:`, error);
        process.exit(1);
      }
    }
  }
  return data;
}

function compareTranslations(enData, viData, filePath = '') {
  let errors = [];
  const enKeys = Object.keys(enData);
  const viKeys = Object.keys(viData);

  for (const key of enKeys) {
    if (!viData.hasOwnProperty(key)) {
      errors.push(`Missing key "${key}" in ${filePath || 'root'} (vi)`);
    } else if (typeof enData[key] === 'object' && typeof viData[key] === 'object') {
      const nestedErrors = compareTranslations(enData[key], viData[key], `${filePath}.${key}`);
      errors = errors.concat(nestedErrors);
    } else if (typeof enData[key] !== typeof viData[key]) {
      errors.push(`Type mismatch for key "${key}" in ${filePath || 'root'}: en is ${typeof enData[key]}, vi is ${typeof viData[key]}`);
    } else if (typeof enData[key] === 'string' && typeof viData[key] === 'string') {
      const enPlaceholders = Array.from(enData[key].matchAll(interpolationRegex)).map(m => m[1]);
      const viPlaceholders = Array.from(viData[key].matchAll(interpolationRegex)).map(m => m[1]);

      const missingPlaceholders = enPlaceholders.filter(p => !viPlaceholders.includes(p));
      const extraPlaceholders = viPlaceholders.filter(p => !enPlaceholders.includes(p));

      if (missingPlaceholders.length > 0) {
        errors.push(`Missing placeholders ${missingPlaceholders.join(', ')} in key "${key}" (vi) for ${filePath || 'root'}`);
      }
      if (extraPlaceholders.length > 0) {
        errors.push(`Extra placeholders ${extraPlaceholders.join(', ')} in key "${key}" (vi) for ${filePath || 'root'}`);
      }
    }
  }

  for (const key of viKeys) {
    if (!enData.hasOwnProperty(key)) {
      errors.push(`Extra key "${key}" in ${filePath || 'root'} (vi)`);
    }
  }

  return errors;
}

function validateLocales() {
  if (!fs.existsSync(enLocaleDir) || !fs.existsSync(viLocaleDir)) {
    console.log('Locale directories not created yet. Skipping validation.');
    process.exit(0);
  }

  const enData = readJsonFiles(enLocaleDir);
  const viData = readJsonFiles(viLocaleDir);

  if (Object.keys(enData).length === 0 && Object.keys(viData).length === 0) {
    console.log('No locale JSON files found. Skipping validation.');
    process.exit(0);
  }

  const validationErrors = compareTranslations(enData, viData);

  if (validationErrors.length > 0) {
    console.error('i18n validation failed:');
    validationErrors.forEach(err => console.error(`- ${err}`));
    process.exit(1);
  } else {
    console.log('i18n validation successful!');
    process.exit(0);
  }
}

validateLocales();
