import fs from 'fs';
import path from 'path';

interface StudentRecord {
  name: string;
  libraryId: string;
  rollNo: string | null;
  email: string | null;
  branch: string;
  year: number;
  section: string | null;
  leetcodeHandle: string | null;
  codeforcesHandle: string | null;
  gfgHandle: string | null;
  codechefHandle: string | null;
  githubHandle: string | null;
}

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'alldata.json');

const BRANCH_MAPPING: Record<string, string> = {
  "Electrical & Computer Engineering": "ECE",
  "Electronics and communication Engineering (VLSI Design and Technology)": "VLSI",
  "Advanced Mechatronics and Industrial Automation": "Adv. Mechatronic",
  "ece vlsi": "VLSI",
  "Computer Science and Engineering": "CSE",
  "Computer Science": "CS",
  "Computer Science and Information Technology": "CSIT",
  "Electronics and Communication Engineering": "ECE",
  "Electrical and Electronics Engineering": "EN",
  "Information Technology": "IT",
  "CSEAI - CSEAI": "CSE-AI",
  "B.Tech - CSEAIML - CSEAIML": "CSE-AIML"
};

function normalizeLibraryId(id: string | null | undefined): string {
  if (!id) return '';
  return id.toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/&/g, '')
    .replace(/^="/, '')
    .replace(/"$/, '')
    .trim();
}

function cleanHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;
  let cleaned = handle.trim().replace(/^="/, '').replace(/"$/, '');
  const placeholders = ['na', 'n/a', 'none', '.', '-', '..', 'null', 'nan', '', 'not applicable', 'available soon'];
  if (placeholders.includes(cleaned.toLowerCase())) return null;

  try {
    if (cleaned.toLowerCase().includes('leetcode.com/')) {
      const parts = cleaned.split('/');
      const index = parts.findIndex(p => p.toLowerCase() === 'u');
      if (index !== -1 && parts[index + 1]) return parts[index + 1].split('?')[0];
      return parts[parts.length - 1] || parts[parts.length - 2] || cleaned;
    }
    if (cleaned.toLowerCase().includes('geeksforgeeks.org/profile/')) {
      return cleaned.split('geeksforgeeks.org/profile/')[1].split('/')[0].split('?')[0];
    }
    if (cleaned.toLowerCase().includes('geeksforgeeks.org/user/')) {
      return cleaned.split('geeksforgeeks.org/user/')[1].split('/')[0].split('?')[0];
    }
    if (cleaned.toLowerCase().includes('codechef.com/users/')) {
      return cleaned.split('codechef.com/users/')[1].split('/')[0].split('?')[0];
    }
    if (cleaned.toLowerCase().includes('codeforces.com/profile/')) {
      return cleaned.split('codeforces.com/profile/')[1].split('/')[0].split('?')[0];
    }
    if (cleaned.toLowerCase().includes('github.com/')) {
      return cleaned.split('github.com/')[1].split('/')[0].split('?')[0];
    }
    if (cleaned.includes('http://') || cleaned.includes('https://')) {
      const parts = cleaned.split('/').filter(p => p.length > 0);
      return parts[parts.length - 1] || cleaned;
    }
  } catch (e) {
    // Ignore error
  }

  if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);
  return cleaned.trim() || null;
}

function parseYear(yearStr: string | null | undefined): number {
  if (!yearStr) return 0;
  const cleaned = yearStr.trim().replace(/^="/, '').replace(/"$/, '');
  const match = cleaned.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function normalizeBranch(branch: string | null | undefined): string {
  if (!branch) return 'Unknown';
  const cleaned = branch.trim().replace(/^="/, '').replace(/"$/, '');
  return BRANCH_MAPPING[cleaned] || cleaned;
}

function isScientificNotation(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[0-9\.]+E\+[0-9]+$/i.test(val.trim());
}

const studentsMap = new Map<string, StudentRecord>();

function addOrMergeStudent(rawStudent: Partial<StudentRecord>) {
  const libraryId = normalizeLibraryId(rawStudent.libraryId) || (rawStudent.rollNo ? `LIB-${rawStudent.rollNo.trim()}` : '');
  
  if (!libraryId) {
    return;
  }

  const cleanName = (rawStudent.name || '').trim().replace(/^="/, '').replace(/"$/, '').trim();
  const cleanRollNo = (rawStudent.rollNo || '').trim().replace(/^="/, '').replace(/"$/, '').trim() || null;
  const cleanEmail = (rawStudent.email || '').trim().replace(/^="/, '').replace(/"$/, '').trim() || null;
  const cleanSection = (rawStudent.section || '').trim().replace(/^="/, '').replace(/"$/, '').trim() || null;

  // Handle general and scientific notation duplicate checking using Email first
  if (cleanEmail) {
    const emailLower = cleanEmail.toLowerCase();
    for (const [existingLibId, existingStud] of studentsMap.entries()) {
      if (existingStud.email && existingStud.email.toLowerCase() === emailLower) {
        // Found duplicate by email!
        existingStud.leetcodeHandle = existingStud.leetcodeHandle || cleanHandle(rawStudent.leetcodeHandle);
        existingStud.codeforcesHandle = existingStud.codeforcesHandle || cleanHandle(rawStudent.codeforcesHandle);
        existingStud.gfgHandle = existingStud.gfgHandle || cleanHandle(rawStudent.gfgHandle);
        existingStud.codechefHandle = existingStud.codechefHandle || cleanHandle(rawStudent.codechefHandle);
        existingStud.githubHandle = existingStud.githubHandle || cleanHandle(rawStudent.githubHandle);
        
        if (cleanName && cleanName.length > existingStud.name.length && !cleanName.includes('Unknown')) {
          existingStud.name = cleanName;
        }
        
        existingStud.section = existingStud.section || cleanSection;
        
        if (rawStudent.branch && rawStudent.branch !== 'Unknown' && existingStud.branch === 'Unknown') {
          existingStud.branch = normalizeBranch(rawStudent.branch);
        }
        
        // Merge rollNo, preferring non-scientific
        const currentRoll = cleanRollNo === '48' ? null : cleanRollNo;
        if (currentRoll && !isScientificNotation(currentRoll)) {
          if (!existingStud.rollNo || isScientificNotation(existingStud.rollNo)) {
            existingStud.rollNo = currentRoll;
          }
        }
        
        // Keep the longer/more complete libraryId (avoiding scientific notation)
        const isCurrentScientific = /E\+/.test(libraryId);
        const isExistingScientific = /E\+/.test(existingLibId);
        
        if ((libraryId.length > existingLibId.length || isExistingScientific) && !isCurrentScientific) {
          studentsMap.delete(existingLibId);
          existingStud.libraryId = libraryId;
          studentsMap.set(libraryId, existingStud);
        }
        
        return; // Fully merged!
      }
    }
  }

  // Handle scientific notation duplicates by name fallback (if email is missing)
  const isScientific = /E\+/.test(libraryId);
  if (isScientific) {
    for (const [existingLibId, existingStud] of studentsMap.entries()) {
      if (!/E\+/.test(existingLibId)) {
        if (cleanName && existingStud.name && cleanName.toLowerCase() === existingStud.name.toLowerCase() && existingStud.branch === normalizeBranch(rawStudent.branch)) {
          existingStud.leetcodeHandle = existingStud.leetcodeHandle || cleanHandle(rawStudent.leetcodeHandle);
          existingStud.codeforcesHandle = existingStud.codeforcesHandle || cleanHandle(rawStudent.codeforcesHandle);
          existingStud.gfgHandle = existingStud.gfgHandle || cleanHandle(rawStudent.gfgHandle);
          existingStud.codechefHandle = existingStud.codechefHandle || cleanHandle(rawStudent.codechefHandle);
          existingStud.githubHandle = existingStud.githubHandle || cleanHandle(rawStudent.githubHandle);
          return;
        }
      }
    }
  } else {
    for (const [existingLibId, existingStud] of studentsMap.entries()) {
      if (/E\+/.test(existingLibId)) {
        if (cleanName && existingStud.name && cleanName.toLowerCase() === existingStud.name.toLowerCase() && existingStud.branch === normalizeBranch(rawStudent.branch)) {
          studentsMap.delete(existingLibId);
          rawStudent.leetcodeHandle = rawStudent.leetcodeHandle || existingStud.leetcodeHandle;
          rawStudent.codeforcesHandle = rawStudent.codeforcesHandle || existingStud.codeforcesHandle;
          rawStudent.gfgHandle = rawStudent.gfgHandle || existingStud.gfgHandle;
          rawStudent.codechefHandle = rawStudent.codechefHandle || existingStud.codechefHandle;
          rawStudent.githubHandle = rawStudent.githubHandle || existingStud.githubHandle;
          break;
        }
      }
    }
  }

  const existing = studentsMap.get(libraryId);

  let rollNo: string | null = null;
  if (cleanRollNo && !isScientificNotation(cleanRollNo) && cleanRollNo !== '48') {
    rollNo = cleanRollNo;
  } else if (existing && existing.rollNo && !isScientificNotation(existing.rollNo)) {
    rollNo = existing.rollNo;
  } else {
    rollNo = (cleanRollNo === '48' ? null : cleanRollNo) || (existing ? existing.rollNo : null);
  }

  const standardStudent: StudentRecord = {
    name: cleanName || (existing ? existing.name : 'Unknown'),
    libraryId: libraryId,
    rollNo: rollNo,
    email: cleanEmail || (existing ? existing.email : null),
    branch: normalizeBranch(rawStudent.branch) || (existing ? existing.branch : 'Unknown'),
    year: parseYear(String(rawStudent.year)) || (existing ? existing.year : 0),
    section: cleanSection || (existing ? existing.section : null),
    leetcodeHandle: cleanHandle(rawStudent.leetcodeHandle) || (existing ? existing.leetcodeHandle : null),
    codeforcesHandle: cleanHandle(rawStudent.codeforcesHandle) || (existing ? existing.codeforcesHandle : null),
    gfgHandle: cleanHandle(rawStudent.gfgHandle) || (existing ? existing.gfgHandle : null),
    codechefHandle: cleanHandle(rawStudent.codechefHandle) || (existing ? existing.codechefHandle : null),
    githubHandle: cleanHandle(rawStudent.githubHandle) || (existing ? existing.githubHandle : null),
  };

  // If duplicate, merge names by choosing the longer/more complete one
  if (existing) {
    if (standardStudent.name.length < existing.name.length && !existing.name.includes('Unknown')) {
      standardStudent.name = existing.name;
    }
  }

  studentsMap.set(libraryId, standardStudent);
}

function processTSV(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`TSV file ${filename} not found, skipping.`);
    return;
  }

  console.log(`Processing TSV file: ${filename}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  if (lines.length < 2) return;

  // Header keys index mapping
  const headers = lines[0].split('\t').map(h => h.trim().replace(/^="/, '').replace(/"$/, '').toLowerCase());

  // Expected indices based on inspect-files.js
  const libIdIdx = headers.indexOf('library id');
  const rollNoIdx = headers.indexOf('university roll no');
  const nameIdx = headers.indexOf('student name');
  const yearIdx = headers.indexOf('year');
  const branchIdx = headers.indexOf('branch');
  const secIdx = headers.indexOf('section');
  const emailIdx = headers.indexOf('kiet email id');
  
  const leetcodeIdx = headers.indexOf('leetcode username');
  const codechefIdx = headers.indexOf('codechef username');
  const codeforcesIdx = headers.indexOf('codeforces username');
  const gfgIdx = headers.indexOf('gfg username');
  const githubIdx = headers.indexOf('github username');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length < 2) continue;

    addOrMergeStudent({
      libraryId: libIdIdx !== -1 ? cols[libIdIdx] : undefined,
      rollNo: rollNoIdx !== -1 ? cols[rollNoIdx] : undefined,
      name: nameIdx !== -1 ? cols[nameIdx] : undefined,
      year: yearIdx !== -1 ? parseYear(cols[yearIdx]) : undefined,
      branch: branchIdx !== -1 ? cols[branchIdx] : undefined,
      section: secIdx !== -1 ? cols[secIdx] : undefined,
      email: emailIdx !== -1 ? cols[emailIdx] : undefined,
      leetcodeHandle: leetcodeIdx !== -1 ? cols[leetcodeIdx] : undefined,
      codeforcesHandle: codeforcesIdx !== -1 ? cols[codeforcesIdx] : undefined,
      gfgHandle: gfgIdx !== -1 ? cols[gfgIdx] : undefined,
      codechefHandle: codechefIdx !== -1 ? cols[codechefIdx] : undefined,
      githubHandle: githubIdx !== -1 ? cols[githubIdx] : undefined,
    });
  }
}

function processJSON(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`JSON file ${filename} not found, skipping.`);
    return;
  }

  console.log(`Processing JSON file: ${filename}...`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const item of content) {
    // In students.json, item.rollNo was mapped to Library ID by parse-students.ts
    // Let's handle it properly
    const libraryId = item.rollNo || item.libraryId;
    addOrMergeStudent({
      libraryId,
      name: item.name,
      branch: item.branch,
      year: item.year,
      leetcodeHandle: item.leetcodeHandle,
      codeforcesHandle: item.codeforcesHandle,
      gfgHandle: item.gfgHandle,
      codechefHandle: item.codechefHandle,
      githubHandle: item.githubHandle,
    });
  }
}

function isValidZip(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size < 22) return false;
    const fd = fs.openSync(filePath, 'r');
    
    const readLength = Math.min(stats.size, 65536);
    const buffer = Buffer.alloc(readLength);
    fs.readSync(fd, buffer, 0, readLength, stats.size - readLength);
    fs.closeSync(fd);
    
    let found = false;
    for (let i = buffer.length - 22; i >= 0; i--) {
      if (buffer.readUInt32LE(i) === 0x06054b50) {
        found = true;
        const cdSize = buffer.readUInt32LE(i + 12);
        const cdOffset = buffer.readUInt32LE(i + 16);
        if (cdOffset + cdSize > stats.size) {
          console.warn(`[WARNING] Zip Central Directory offset (${cdOffset} + ${cdSize} = ${cdOffset + cdSize}) exceeds file size (${stats.size}). File is truncated or corrupted.`);
          return false;
        }
        break;
      }
    }
    if (!found) {
      console.warn(`[WARNING] End of Central Directory (EOCD) signature not found. File is corrupted or not a zip.`);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn(`[WARNING] Error validating zip file structure: ${e.message}`);
    return false;
  }
}

function processXLSX(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return;
  }

  console.log(`Processing XLSX file: ${filename}...`);
  if (!isValidZip(filePath)) {
    console.warn(`[WARNING] Skipping XLSX file ${filename} due to zip validation failure.`);
    return;
  }

  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log(`Loaded ${jsonData.length} rows from Excel.`);
    for (const row of jsonData) {
      // Try to match headers in any case or style
      const keys = Object.keys(row);
      const getVal = (possibleKeys: string[]) => {
        const found = keys.find(k => possibleKeys.includes(k.toLowerCase().trim()));
        return found ? String(row[found]) : undefined;
      };

      const libraryId = getVal(['library id', 'libraryid', 'lib id']);
      const rollNo = getVal(['roll no', 'rollno', 'university roll no', 'roll number']);
      const name = getVal(['name', 'student name', 'fullname']);
      const email = getVal(['email', 'email id', 'kiet email id', 'emailid']);
      const branch = getVal(['branch', 'dept', 'department']);
      const year = getVal(['year', 'class year', 'course year']);
      const section = getVal(['section', 'sec']);
      
      const leetcodeHandle = getVal(['leetcode', 'leetcode username', 'leetcode handle']);
      const codeforcesHandle = getVal(['codeforces', 'codeforces username', 'codeforces handle']);
      const gfgHandle = getVal(['gfg', 'gfg username', 'gfg handle', 'gfg profile']);
      const codechefHandle = getVal(['codechef', 'codechef username', 'codechef handle']);
      const githubHandle = getVal(['github', 'github username', 'github handle']);

      addOrMergeStudent({
        libraryId,
        rollNo,
        name,
        email,
        branch,
        year: year ? parseYear(year) : undefined,
        section,
        leetcodeHandle,
        codeforcesHandle,
        gfgHandle,
        codechefHandle,
        githubHandle
      });
    }
  } catch (error: any) {
    console.warn(`[WARNING] Failed to parse Excel file ${filename}: ${error.message}. Skipping Excel import.`);
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function processCSV(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`CSV file ${filename} not found, skipping.`);
    return;
  }

  console.log(`Processing CSV file: ${filename}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return;

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  const rollNoIdx = headers.indexOf('roll no');
  const nameIdx = headers.indexOf('name');
  const emailIdx = headers.indexOf('email id');
  const courseIdx = headers.indexOf('course');
  const githubIdx = headers.indexOf('github username');
  const leetcodeIdx = headers.indexOf('leetcode username');
  const gfgIdx = headers.indexOf('gfg username');
  const cfIdx = headers.indexOf('codeforces username');
  const ccIdx = headers.indexOf('codechef username');

  let rowCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    if (cols.length < 5) continue;

    const email = emailIdx !== -1 ? cols[emailIdx] : '';
    let libraryId = '';
    
    if (email) {
      const emailMatch = email.match(/\.([a-z0-9&()\-]+)@kiet\.edu/i);
      if (emailMatch && emailMatch[1]) {
        libraryId = emailMatch[1];
      }
    }

    if (!libraryId && rollNoIdx !== -1 && cols[rollNoIdx]) {
      libraryId = cols[rollNoIdx];
    }

    addOrMergeStudent({
      libraryId,
      rollNo: rollNoIdx !== -1 ? cols[rollNoIdx] : undefined,
      name: nameIdx !== -1 ? cols[nameIdx] : undefined,
      email: email || undefined,
      branch: courseIdx !== -1 ? cols[courseIdx] : undefined,
      year: 3, // Batch 2027 is 3rd Year
      leetcodeHandle: leetcodeIdx !== -1 ? cols[leetcodeIdx] : undefined,
      codeforcesHandle: cfIdx !== -1 ? cols[cfIdx] : undefined,
      gfgHandle: gfgIdx !== -1 ? cols[gfgIdx] : undefined,
      codechefHandle: ccIdx !== -1 ? cols[ccIdx] : undefined,
      githubHandle: githubIdx !== -1 ? cols[githubIdx] : undefined,
    });
    rowCount++;
  }
  console.log(`Loaded ${rowCount} rows from CSV.`);
}

function main() {
  // 1. Process platform.tsv
  processTSV('platform.tsv');

  // 2. Process newdata.tsv
  processTSV('newdata.tsv');

  // 3. Process raw_data.tsv
  processTSV('raw_data.tsv');

  // 4. Process students.json
  processJSON('students.json');

  // 5. Process Batch 2027 Student Details.xlsx (optional if valid)
  processXLSX('Batch 2027 Student Details.xlsx');

  // 6. Process newly added Batch 2027 Student Details (1).csv
  processCSV('Batch 2027 Student Details (1).csv');

  const allRecords = Array.from(studentsMap.values());
  
  // Save unified dataset
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRecords, null, 2), 'utf-8');
  console.log(`\n=== Merging Completed ===`);
  console.log(`Total unique students compiled: ${allRecords.length}`);
  console.log(`Saved unified data to: ${OUTPUT_FILE}`);
}

main();
