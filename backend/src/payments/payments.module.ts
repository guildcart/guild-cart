// backend/src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { DeliveryModule } from '../delivery/delivery.module'; // 🆕

@Module({
  imports: [
    ProductsModule,
    OrdersModule,
    DeliveryModule, // 🆕 Importer pour avoir accès au DeliveryService
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}