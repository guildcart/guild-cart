-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PDF', 'ACCOUNT', 'ROLE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "discord_id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "discord_server_id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" TEXT NOT NULL,
    "stripe_account_id" TEXT,
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "stripe_subscription_id" TEXT,
    "subscription_expires_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "type" "ProductType" NOT NULL,
    "file_url" TEXT,
    "discord_role_id" TEXT,
    "stock" INTEGER DEFAULT 0,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION NOT NULL,
    "delivery_data" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION NOT NULL,
    "stripe_transfer_id" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "servers_discord_server_id_key" ON "servers"("discord_server_id");

-- CreateIndex
CREATE UNIQUE INDEX "servers_stripe_account_id_key" ON "servers"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "servers_stripe_subscription_id_key" ON "servers"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "products_server_id_idx" ON "products"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_payment_intent_id_key" ON "orders"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "orders_server_id_idx" ON "orders"("server_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_idx" ON "orders"("buyer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripe_transfer_id_key" ON "transactions"("stripe_transfer_id");

-- CreateIndex
CREATE INDEX "transactions_server_id_idx" ON "transactions"("server_id");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
