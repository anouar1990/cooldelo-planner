const HUNDRED_MB_BYTES = 100 * 1024 * 1024; // 100 MB threshold (104,857,600 bytes)

/**
 * Extracts the Google Drive File ID from various link formats.
 */
export function extractGoogleDriveFileId(urlOrId: string): string | null {
  if (!urlOrId) return null;

  // Standard share link: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = urlOrId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Direct export link: https://drive.google.com/uc?export=download&id=FILE_ID
  const ucIdMatch = urlOrId.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucIdMatch && ucIdMatch[1]) return ucIdMatch[1];

  // Raw file ID string (25-50 chars alphanumeric)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(urlOrId)) {
    return urlOrId;
  }

  return null;
}

/**
 * Automatically generates the correct Google Drive download URL depending on file size.
 *
 * Rules:
 * - fileSize < 100 MB: Direct download URL (https://drive.google.com/uc?export=download&id=FILE_ID)
 * - fileSize >= 100 MB or missing/null: Normal view URL (https://drive.google.com/file/d/FILE_ID/view)
 */
export function getDownloadUrl(fileIdOrUrl: string, fileSize?: number | null): string {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl);

  if (!fileId) {
    console.warn(`[GOOGLE DRIVE DOWNLOAD WARNING] Unparseable Google Drive reference: "${fileIdOrUrl}". Falling back to original URL.`);
    return fileIdOrUrl;
  }

  const isUnderThreshold = typeof fileSize === 'number' && fileSize > 0 && fileSize < HUNDRED_MB_BYTES;

  const sizeFormatted = typeof fileSize === 'number' && fileSize > 0
    ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
    : 'Unknown (Missing)';

  const generatedType = isUnderThreshold ? 'Direct' : 'Normal';

  console.log(`[GOOGLE DRIVE DOWNLOAD] File ID: ${fileId} | Detected Size: ${sizeFormatted} | Generated URL Type: ${generatedType}`);

  if (isUnderThreshold) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return `https://drive.google.com/file/d/${fileId}/view`;
}
