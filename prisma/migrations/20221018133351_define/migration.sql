-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('SCALAR', 'LABEL');

-- CreateTable
CREATE TABLE "View" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" DOUBLE PRECISION[],
    "orientation" DOUBLE PRECISION[],
    "tags" TEXT[],
    "dataset_name" TEXT NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sample_type" "SampleType" NOT NULL,
    "dataset_name" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ImageToView" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "View_name_dataset_name_key" ON "View"("name", "dataset_name");

-- CreateIndex
CREATE UNIQUE INDEX "Image_name_dataset_name_key" ON "Image"("name", "dataset_name");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_name_key" ON "Dataset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToView_AB_unique" ON "_ImageToView"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToView_B_index" ON "_ImageToView"("B");

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_dataset_name_fkey" FOREIGN KEY ("dataset_name") REFERENCES "Dataset"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_dataset_name_fkey" FOREIGN KEY ("dataset_name") REFERENCES "Dataset"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToView" ADD CONSTRAINT "_ImageToView_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToView" ADD CONSTRAINT "_ImageToView_B_fkey" FOREIGN KEY ("B") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;
