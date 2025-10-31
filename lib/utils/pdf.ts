import pdf from 'pdf-parse';

export async function getPdfContentFromUrl(url: string): Promise<string> {
  console.log('🚀 ~ getPdfContentFromUrl ~ url:', url);
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdf(buffer);
  console.log('🚀 ~ getPdfContentFromUrl ~ data:', data);
  return data.text;
}
