import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    return await prisma.dataset.findMany({include: {images: true, views: true}});
}

main().then((v) => console.log(JSON.stringify(v)))