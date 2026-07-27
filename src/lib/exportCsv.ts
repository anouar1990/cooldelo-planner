import { Platform } from 'react-native';

/**
 * Downloads a string formatted as CSV on Web or Mobile.
 */
export async function downloadCsv(filename: string, csvContent: string): Promise<void> {
  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else if (typeof window !== 'undefined') {
    // Fallback data URI for mobile browsers / WebView
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Converts an array of objects into a properly formatted CSV string.
 */
export function objectsToCsv(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  
  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(h => `"${h}"`).join(',');
  const bodyRows = data.map(row => 
    headers.map(h => escapeCell(row[h])).join(',')
  );

  return [headerRow, ...bodyRows].join('\n');
}
