const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Batch 2027 Student Details.xlsx');
const workbook = XLSX.readFile(filePath);
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows:', jsonData.length);

// Print first 10 rows with non-NA LinkedIn profile
let printed = 0;
for (const row of jsonData) {
  const linkedin = row['LinkedIn Profile'];
  if (linkedin && linkedin !== 'NA' && linkedin !== 'N/A' && linkedin !== '-') {
    console.log(`Name: ${row['Name']}, Email: ${row['Email Id']}, LinkedIn: ${linkedin}`);
    printed++;
    if (printed >= 10) break;
  }
}
