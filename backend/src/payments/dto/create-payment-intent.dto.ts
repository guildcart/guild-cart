import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'ID du produit à acheter',
    example: 'clxxx123456',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'ID du serveur Discord',
    example: 'clyyy789012',
  })
  @IsString()
  @IsNotEmpty()
  serverId: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'ID du produit avec abonnement',
    example: 'clxxx123456',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'ID du serveur Discord',
    example: 'clyyy789012',
  })
  @IsString()
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({
    description: 'Email du client (optionnel)',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;
}

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'ID de la subscription Stripe',
    example: 'sub_xxx',
  })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({
    description: 'ID du serveur Discord',
    example: 'clyyy789012',
  })
  @IsString()
  @IsNotEmpty()
  serverId: string;
}