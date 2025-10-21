-- DropForeignKey
ALTER TABLE "role_subscriptions" DROP CONSTRAINT "role_subscriptions_product_id_fkey";

-- DropForeignKey
ALTER TABLE "role_subscriptions" DROP CONSTRAINT "role_subscriptions_server_id_fkey";

-- DropForeignKey
ALTER TABLE "role_subscriptions" DROP CONSTRAINT "role_subscriptions_user_id_fkey";

-- AlterTable
ALTER TABLE "role_subscriptions" ADD COLUMN     "last_retry_at" TIMESTAMP(3),
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "stripe_subscription_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "role_subscriptions" ADD CONSTRAINT "role_subscriptions_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_subscriptions" ADD CONSTRAINT "role_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_subscriptions" ADD CONSTRAINT "role_subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
