/**
 * File Conversion Utilities for Chat
 * Handles fetching, base64 conversion, and text extraction from various file formats
 */

/**
 * Fetch file from URL and convert to base64
 */
export async function fetchFileAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Fetch text file from URL
 */
export async function fetchFileAsText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Extract text from DOCX file
 * Note: Requires mammoth package (npm install mammoth)
 */
export async function extractTextFromDocx(base64Data: string): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('[File Conversion] Error extracting DOCX text:', error);
    return '[Error: Could not extract text from DOCX file]';
  }
}

/**
 * Extract text from XLSX file
 * Note: Requires xlsx package (npm install xlsx)
 */
export async function extractTextFromXlsx(base64Data: string): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    let allText = '';
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      allText += `\n--- Sheet: ${sheetName} ---\n${csvText}\n`;
    });

    return allText;
  } catch (error) {
    console.error('[File Conversion] Error extracting XLSX text:', error);
    return '[Error: Could not extract text from XLSX file]';
  }
}
