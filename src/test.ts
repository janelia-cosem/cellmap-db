import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    return await prisma.dataset.findFirst({
        where: {name: "jrc_hela-2"}, 
        include: {
            publications: {include: {publications: true}}}});
}

main().then((v) => console.log(JSON.stringify(v,null, 4)))