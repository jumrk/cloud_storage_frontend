#!/usr/bin/env node

/**
 * Security Scanner for Frontend
 * Scans for malicious code, especially cryptocurrency mining scripts
 */

const fs = require('fs');
const path = require('path');

const SUSPICIOUS_PATTERNS = [
  // Cryptocurrency mining
  /coinhive/i,
  /cryptonight/i,
  /webmine/i,
  /coin-hive/i,
  /jsecoin/i,
  /authedmine/i,
  /minerstat/i,
  /cryptocurrency.*mining/i,
  /monero.*mining/i,
  /bitcoin.*mining/i,
  
  // Obfuscated code patterns
  /eval\s*\(/,
  /Function\s*\(/,
  /new Function/,
  /atob\s*\([^)]*\)/,
  /btoa\s*\([^)]*\)/,
  /unescape\s*\(/,
  /String\.fromCharCode\s*\(/,
  
  // Suspicious external scripts
  /https?:\/\/[^/]+\.min\.js/,
  /cdn\.jsdelivr\.net\/npm\/[^/]+@[^/]+\/[^/]+\.js/,
  /unpkg\.com\/[^/]+@[^/]+\/[^/]+\.js/,
  
  // Suspicious domains
  /coinhive\.com/,
  /cryptonight\.com/,
  /webmine\.pool/,
  /miner\.pool/,
  
  // Suspicious WebSocket connections
  /ws:\/\/[^/]+miner/,
  /wss:\/\/[^/]+miner/,
  
  // Suspicious worker scripts
  /new Worker\s*\([^)]*miner/,
  /new SharedWorker\s*\([^)]*miner/,
];

const ALLOWED_PATTERNS = [
  // Allowed uses of potentially suspicious functions
  /atob\s*\([^)]*\.split\s*\([^)]*\)\s*\[1\]/, // JWT decoding
  /atob\s*\([^)]*payload/, // JWT payload decoding
  /atob\s*\([^)]*base64/, // Base64 decoding
  /btoa\s*\(JSON\.stringify/, // Safe encoding
  // Patterns in sanitizeHtml.js are for detection, not execution
  /sanitizeHtml|sanitizeAndFormat|ALLOWED_TAGS|ALLOWED_ATTRIBUTES/,
];

const IGNORE_PATHS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cache',
];

function shouldIgnore(filePath) {
  return IGNORE_PATHS.some(ignore => filePath.includes(ignore));
}

function isAllowedPattern(code, pattern) {
  // Check if file is sanitizeHtml.js - these patterns are for detection, not execution
  if (code.includes('sanitizeHtml') && code.includes('suspiciousPatterns')) {
    return true;
  }
  
  return ALLOWED_PATTERNS.some(allowed => {
    const match = code.match(pattern);
    if (!match) return false;
    const context = code.substring(
      Math.max(0, match.index - 50),
      Math.min(code.length, match.index + match[0].length + 50)
    );
    return allowed.test(context);
  });
}

function scanFile(filePath) {
  if (shouldIgnore(filePath)) return [];
  
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  
  SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
    const matches = content.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (!isAllowedPattern(content, pattern)) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNumber,
          pattern: pattern.toString(),
          match: match[0].substring(0, 100),
          severity: pattern.source.includes('mining|miner|coinhive') ? 'HIGH' : 'MEDIUM',
        });
      }
    }
  });
  
  return issues;
}

function scanDirectory(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (shouldIgnore(filePath)) return;
      
      if (file.isDirectory()) {
        scanDirectory(filePath, fileList);
      } else if (
        file.name.endsWith('.js') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.html')
      ) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
  }
  
  return fileList;
}

function main() {
  console.log('🔍 Scanning for security issues...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const publicDir = path.join(__dirname, 'public');
  
  const files = [
    ...scanDirectory(srcDir),
    ...scanDirectory(publicDir),
  ];
  
  console.log(`📁 Scanned ${files.length} files\n`);
  
  const allIssues = [];
  files.forEach(file => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });
  
  if (allIssues.length === 0) {
    console.log('✅ No security issues found!\n');
    process.exit(0);
  }
  
  console.log(`⚠️  Found ${allIssues.length} potential security issue(s):\n`);
  
  const highSeverity = allIssues.filter(i => i.severity === 'HIGH');
  const mediumSeverity = allIssues.filter(i => i.severity === 'MEDIUM');
  
  if (highSeverity.length > 0) {
    console.log('🔴 HIGH SEVERITY ISSUES:');
    highSeverity.forEach(issue => {
      console.log(`\n  File: ${issue.file}`);
      console.log(`  Line: ${issue.line}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log(`  Match: ${issue.match}`);
    });
  }
  
  if (mediumSeverity.length > 0) {
    console.log('\n🟡 MEDIUM SEVERITY ISSUES:');
    mediumSeverity.forEach(issue => {
      console.log(`\n  File: ${issue.file}`);
      console.log(`  Line: ${issue.line}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log(`  Match: ${issue.match}`);
    });
  }
  
  console.log('\n');
  
  if (highSeverity.length > 0) {
    console.log('❌ Security scan failed! Please review HIGH severity issues.');
    process.exit(1);
  } else {
    console.log('⚠️  Please review MEDIUM severity issues.');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory };

