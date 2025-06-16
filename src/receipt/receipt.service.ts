// src/receipt/receipt.service.ts
import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as vision from '@google-cloud/vision';

@Injectable()
export class ReceiptService {
  private client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(process.cwd(), 'src', 'config', 'google-credentials.json'),
    // Place your service account JSON here
  });

  async extractReceiptDetails(filePath: string) {
    try {
      const [result] = await this.client.textDetection(filePath);
      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        throw new InternalServerErrorException('No text found on the receipt');
      }

      const rawText = detections[0].description ?? '';

      const extracted = this.parseReceipt(rawText);

      return {
        id: Date.now(),
        ...extracted,
        image_url: `http://localhost:3000/uploads/${path.basename(filePath)}`
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to extract receipt');
    }
  }

  private parseReceipt(rawText: string) {
    // Dummy parser: Replace this with regex or GPT call to extract structure.
    const lines = rawText.split('\n');
    const vendor_name = lines[0];
    const totalLine = lines.find(line => /total/i.test(line));
    const total = totalLine?.match(/[\d,.]+/)?.[0] ?? '0.00';

    return {
      date: new Date().toISOString().split('T')[0],
      currency: 'INR',
      vendor_name,
      receipt_items: [], // You can improve this by extracting item lines
      tax: '0.00',
      total
    };
  }
}
