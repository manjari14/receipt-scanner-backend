import { Module } from '@nestjs/common';
import { ReceiptModule } from './receipt/receipt.module';

@Module({
  imports: [ReceiptModule],
})
export class AppModule {}
