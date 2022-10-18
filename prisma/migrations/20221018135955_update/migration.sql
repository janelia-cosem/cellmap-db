/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `View` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ImageToView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_dataset_name_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_dataset_name_fkey";

-- DropForeignKey
ALTER TABLE "_ImageToView" DROP CONSTRAINT "_ImageToView_A_fkey";

-- DropForeignKey
ALTER TABLE "_ImageToView" DROP CONSTRAINT "_ImageToView_B_fkey";

-- DropTable
DROP TABLE "Image";

-- DropTable
DROP TABLE "View";

-- DropTable
DROP TABLE "_ImageToView";

-- CreateTable
CREATE TABLE "ViewToImage" (
    "image_name" TEXT NOT NULL,
    "dataset_name" TEXT NOT NULL,
    "view_id" INTEGER NOT NULL,

    CONSTRAINT "ViewToImage_pkey" PRIMARY KEY ("dataset_name","image_name","view_id")
);

-- CreateTable
CREATE TABLE "Views" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" DOUBLE PRECISION[],
    "orientation" DOUBLE PRECISION[],
    "tags" TEXT[],
    "image_names" TEXT[],
    "dataset_name" TEXT NOT NULL,

    CONSTRAINT "Views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Images" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sample_type" "SampleType" NOT NULL,
    "dataset_name" TEXT NOT NULL,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Views_name_dataset_name_key" ON "Views"("name", "dataset_name");

-- CreateIndex
CREATE UNIQUE INDEX "Images_name_dataset_name_key" ON "Images"("name", "dataset_name");

-- AddForeignKey
ALTER TABLE "ViewToImage" ADD CONSTRAINT "ViewToImage_image_name_dataset_name_fkey" FOREIGN KEY ("image_name", "dataset_name") REFERENCES "Images"("name", "dataset_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewToImage" ADD CONSTRAINT "ViewToImage_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "Views"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Views" ADD CONSTRAINT "Views_dataset_name_fkey" FOREIGN KEY ("dataset_name") REFERENCES "Dataset"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_dataset_name_fkey" FOREIGN KEY ("dataset_name") REFERENCES "Dataset"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
