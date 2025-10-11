import { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    createPaymentIntent(body: {
        productId: string;
    }, req: any): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    handleWebhook(signature: string, req: RawBodyRequest<Request>): Promise<{
        received: boolean;
    }>;
}
