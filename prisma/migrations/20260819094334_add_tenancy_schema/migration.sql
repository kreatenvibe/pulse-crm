-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Seed the default organization that every pre-existing row will backfill onto below.
INSERT INTO "organizations" ("id", "name") VALUES ('org-001', 'Default Organization');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- AlterTable (nullable for now; flipped to NOT NULL in a later migration once backfilled)
ALTER TABLE "activities" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "organization_id" TEXT;

-- AlterTable (password_hash stays nullable until the signup milestone sets it for every user)
ALTER TABLE "users" ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "password_hash" TEXT;

-- Backfill: every pre-existing tenant-owned row belongs to the default organization.
UPDATE "users" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "leads" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "customers" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "appointments" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "tasks" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "services" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "invoices" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "activities" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;
UPDATE "notes" SET "organization_id" = 'org-001' WHERE "organization_id" IS NULL;

-- DropIndex (global invoice_number uniqueness is replaced by a per-organization one below)
DROP INDEX "invoices_invoice_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "invoices_organization_id_invoice_number_key" ON "invoices"("organization_id", "invoice_number");

-- CreateIndex
CREATE INDEX "activities_organization_id_idx" ON "activities"("organization_id");

-- CreateIndex
CREATE INDEX "appointments_organization_id_idx" ON "appointments"("organization_id");

-- CreateIndex
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");

-- CreateIndex
CREATE INDEX "leads_organization_id_status_idx" ON "leads"("organization_id", "status");

-- CreateIndex
CREATE INDEX "notes_organization_id_idx" ON "notes"("organization_id");

-- CreateIndex
CREATE INDEX "services_organization_id_idx" ON "services"("organization_id");

-- CreateIndex
CREATE INDEX "tasks_organization_id_idx" ON "tasks"("organization_id");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
