import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ProductsModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}