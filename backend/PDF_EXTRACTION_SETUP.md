# PDF Extraction Setup Guide

## Problem
PDF text extraction is failing because the required libraries are not installed.

## Solution

### 1. Install Required Libraries

Run this command in your backend directory:

```bash
pip install PyPDF2 pdfplumber
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### 2. Restart Backend Server

After installing the libraries, restart your Flask server:

```bash
python app.py
```

## How It Works Now

The improved PDF extraction:

1. **Tries pdfplumber first** - Better for complex PDFs with tables and formatting
2. **Falls back to PyPDF2** - If pdfplumber fails
3. **Detailed logging** - Shows exactly what's happening during extraction
4. **Page-by-page extraction** - Extracts each page separately with page markers
5. **Error detection** - Detects when extraction fails and provides helpful feedback

## Troubleshooting

### If extraction still fails:

**The PDF might be:**
- **Image-based/Scanned** - Contains only images, not selectable text (needs OCR)
- **Encrypted** - Password-protected or has security restrictions
- **Corrupted** - File structure is damaged

**Solutions:**
1. Open the PDF in a reader and try to select/copy text
   - If you can't select text → It's an image-based PDF (needs OCR)
   - If you can select text → The PDF should work

2. For image-based PDFs, you'll need OCR:
   ```bash
   pip install pytesseract pdf2image
   ```
   (Requires Tesseract OCR installed on system)

3. Try converting the PDF to text using online tools first

## Testing

After setup, upload a PDF and check the backend console. You should see:

```
============================================================
FILE UPLOAD: your_file.pdf
============================================================
Saved to: backend/data/your_file.pdf
File size: 123456 bytes
File type: PDF - Starting extraction...
Attempting PDF extraction with pdfplumber: backend/data/your_file.pdf
Extracted 1234 chars from page 1
Extracted 2345 chars from page 2
✓ Successfully extracted 3579 characters
============================================================
```

If you see warnings about extraction failing, check the troubleshooting section above.
