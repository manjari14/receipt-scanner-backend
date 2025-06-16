import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { ReceiptService } from './receipt.service';
  
  @Controller()
  export class ReceiptController {
    constructor(private readonly receiptService: ReceiptService) {}
  
    @Post('extract-receipt-details')
    @UseInterceptors(FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png'];
        if (!allowedTypes.includes(extname(file.originalname).toLowerCase())) {
          return cb(new BadRequestException('Only .jpg, .jpeg, .png files are allowed'), false);
        }
        cb(null, true);
      },
    }))
    async uploadReceipt(@UploadedFile() file: Express.Multer.File) {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
      return this.receiptService.extractReceiptDetails(file.path);
    }
  }
  