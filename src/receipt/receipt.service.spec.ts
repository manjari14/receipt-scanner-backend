import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptService } from './receipt.service';
import { InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import { OpenAI } from 'openai';

jest.mock('fs');

describe('ReceiptService', () => {
  let service: ReceiptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiptService],
    }).compile();

    service = module.get<ReceiptService>(ReceiptService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw error if AI returns invalid JSON', async () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(Buffer.from('mock image'));

    jest
      .spyOn(service['openai'].chat.completions, 'create')
      .mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }],
      } as any);

    await expect(service.extractReceiptDetails('path/to/image.jpg'))
      .rejects
      .toThrow(InternalServerErrorException);
  });

  it('should throw error if AI response content is null', async () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(Buffer.from('mock image'));

    jest
      .spyOn(service['openai'].chat.completions, 'create')
      .mockResolvedValue({
        choices: [{ message: { content: null } }],
      } as any);

    await expect(service.extractReceiptDetails('path/to/image.jpg'))
      .rejects
      .toThrow(InternalServerErrorException);
  });

  it('should return extracted receipt details on success', async () => {
    const mockJson = {
      date: '2024-05-15',
      currency: 'INR',
      vendor_name: 'Mock Store',
      receipt_items: [{ item_name: 'Book', item_cost: 200 }],
      tax: 10,
      total: 210,
    };

    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(Buffer.from('mock image'));

    jest
      .spyOn(service['openai'].chat.completions, 'create')
      .mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockJson) } }],
      } as any);

    const result = await service.extractReceiptDetails('uploads/sample.jpg');

    expect(result).toMatchObject({
      ...mockJson,
      image_url: expect.stringContaining('uploads/sample.jpg'),
    });
  });
});
