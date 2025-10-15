-- AlterTable
ALTER TABLE "products" ADD COLUMN     "bonus_role_id" TEXT,
ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "primary_color" TEXT DEFAULT '#7C3AED';
