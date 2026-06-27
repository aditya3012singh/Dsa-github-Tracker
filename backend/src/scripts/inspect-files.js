const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '../data');

function inspectTSV(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`TSV file ${filename} not found.`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  console.log(`\n=== Inspecting TSV: ${filename} ===`);
  console.log(`Total lines: ${lines.length}`);
  console.log('Headers:');
  console.log(lines[0].split('\t').map((h, i) => `${i}: "${h.trim()}"`).join(', '));
  console.log('Row 1 example:');
  if (lines[1]) {
    console.log(lines[1].split('\t').map((val, i) => `${i}: "${val.trim()}"`).join(', '));
  }
}

function inspectJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`JSON file ${filename} not found.`);
    return;
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`\n=== Inspecting JSON: ${filename} ===`);
  console.log(`Total items: ${content.length}`);
  console.log('Keys in first item:');
  if (content[0]) {
    console.log(Object.keys(content[0]));
    console.log('First item:', JSON.stringify(content[0], null, 2));
  }
}

function inspectXLSX(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`XLSX file ${filename} not found.`);
    return;
  }
  const workbook = XLSX.readFile(filePath);
  console.log(`\n=== Inspecting XLSX: ${filename} ===`);
  console.log('Sheet names:', workbook.SheetNames);
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Total rows in sheet "${firstSheetName}": ${jsonData.length}`);
  if (jsonData.length > 0) {
    console.log('Keys in first row:');
    console.log(Object.keys(jsonData[0]));
    console.log('First row example:', JSON.stringify(jsonData[0], null, 2));
  }
}

function main() {
  inspectTSV('raw_data.tsv');
  inspectTSV('newdata.tsv');
  inspectTSV('platform.tsv');
  inspectJSON('students.json');
  inspectXLSX('Batch 2027 Student Details.xlsx');
}

main();
