import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  process.env.PLAYWRIGHT ||
  process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();


export const allowedTypes = [
  // PDF Documents
  'application/pdf', // .pdf

  // Microsoft Office Documents
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-excel', // .xls (legacy support)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

  // Text Files
  'text/plain', // .txt
  'text/markdown', // .md

  // Images
  'image/jpeg', // .jpg, .jpeg
  'image/png', // .png
  'image/svg+xml', // .svg
];