const { getDownloadUrl, extractGoogleDriveFileId } = require('./driveUtils');

console.log('--- TESTING GOOGLE DRIVE DOWNLOAD URL HELPER ---');

const FILE_ID = '1K_CpjeVEpN1uTIg5GUuqWccsIhRgo1p3';
const TEST_URL = `https://drive.google.com/file/d/${FILE_ID}/view?usp=sharing`;

const testCases = [
  {
    name: '25 MB file',
    size: 25 * 1024 * 1024,
    expectedType: 'Direct',
    expectedUrl: `https://drive.google.com/uc?export=download&id=${FILE_ID}`
  },
  {
    name: '80 MB file',
    size: 80 * 1024 * 1024,
    expectedType: 'Direct',
    expectedUrl: `https://drive.google.com/uc?export=download&id=${FILE_ID}`
  },
  {
    name: '100 MB file',
    size: 100 * 1024 * 1024,
    expectedType: 'Normal',
    expectedUrl: `https://drive.google.com/file/d/${FILE_ID}/view`
  },
  {
    name: '1 GB file',
    size: 1024 * 1024 * 1024,
    expectedType: 'Normal',
    expectedUrl: `https://drive.google.com/file/d/${FILE_ID}/view`
  },
  {
    name: 'Missing file size (undefined)',
    size: undefined,
    expectedType: 'Normal',
    expectedUrl: `https://drive.google.com/file/d/${FILE_ID}/view`
  },
  {
    name: 'Missing file size (null)',
    size: null,
    expectedType: 'Normal',
    expectedUrl: `https://drive.google.com/file/d/${FILE_ID}/view`
  }
];

let passed = 0;

testCases.forEach((tc, idx) => {
  const result = getDownloadUrl(TEST_URL, tc.size);
  const isMatch = result === tc.expectedUrl;

  if (isMatch) {
    console.log(`[PASS] Case ${idx + 1}: ${tc.name} => ${result}`);
    passed++;
  } else {
    console.error(`[FAIL] Case ${idx + 1}: ${tc.name}`);
    console.error(`       Expected: ${tc.expectedUrl}`);
    console.error(`       Received: ${result}`);
  }
});

console.log(`\nTest Result: ${passed}/${testCases.length} Passed.`);
if (passed === testCases.length) {
  console.log('SUCCESS: All Google Drive download threshold test cases passed! ✨');
} else {
  process.exit(1);
}
