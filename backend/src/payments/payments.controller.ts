import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @UseGuards(AuthGuard('jwt'))
  async createPaymentIntent(
    @Body() body: { productId: string },
    @Req() req,
  ) {
    return this.paymentsService.createPaymentIntent(body.productId, req.user.id);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    return this.paymentsService.handleWebhook(signature, rawBody);
  }
}