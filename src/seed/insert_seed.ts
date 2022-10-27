import { ArrayContainerFormat, Prisma, SampleType } from "@prisma/client";
import { readFileSync } from "fs"
import { DatasetManifest } from "../types/legacy"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generate_dataset(manifest: DatasetManifest) {
    const imagingIn = manifest.metadata.imaging
    const acquisition: Prisma.ImageAcquisitionCreateInput = {
        name: imagingIn.id,
        institution: imagingIn.institution,
        startDate: new Date(imagingIn.startDate),
        gridAxes: Object.keys(imagingIn.gridSpacing.values),
        gridSpacing: Object.values(imagingIn.gridSpacing.values),
        gridSpacingUnit: imagingIn.gridSpacing.unit,
        gridDimensions: Object.values(imagingIn.dimensions.values),
        gridDimensionsUnit: imagingIn.dimensions.unit
    }

    const pubs: Prisma.PublicationCreateInput[] = manifest.metadata.publications.map(pub =>
    ({
        name: pub.title,
        url: pub.href,
        type: "PAPER"
    }))

    manifest.metadata.DOI.forEach(pub => pubs.push(
        {
            name: pub.title,
            url: pub.href,
            type: "DOI"
        }))
    
    const pubsInDb = await prisma.$transaction(pubs.map(pub => prisma.publication.upsert({
        where: {url: pub.url},
        create: pub,
        update: {name: pub.name, type: pub.type}
    })))

    const datasetInDb = await prisma.dataset.upsert({
        where: { name: manifest.name },
        create: {
            name: manifest.name,
            description: manifest.metadata.title,
            thumbnailUrl: manifest.metadata.thumbnailURL!,
            isPublished: true,
            sample: (manifest.metadata.sample as any),
            acquisition: { create: acquisition }
        },
        update: {
            description: manifest.metadata.title,
            thumbnailUrl: manifest.metadata.thumbnailURL!,
            isPublished: true,
            sample: (manifest.metadata.sample as any),
            acquisition: { create: acquisition }
        }
    })


    for (const pub of pubsInDb) {
      await prisma.publicationToDataset.upsert({
        where: {
            datasetName_publicationId: {datasetName: datasetInDb.name, publicationId: pub.id}
        }, 
        create: {datasetName: datasetInDb.name, publicationId: pub.id},
        update: {}})  
    }

    const images: Prisma.ImageCreateInput[] = Object.entries(manifest.sources).map(([name, source]) => {
        let sampleType: SampleType = "SCALAR"
        if (source.sampleType == 'label') {
            sampleType = "LABEL"
        }
        let format: ArrayContainerFormat = "N5"
        if (source.format === "precomputed") {
            format = "NEUROGLANCER_PRECOMPUTED"
        }
        else if (source.format === 'zarr') {
            format = "ZARR"
        }
        return {
            name: source.name,
            description: source.description,
            url: source.url,
            transform: (source.transform as any),
            sampleType: sampleType,
            contentType: source.contentType,
            displaySettings: (source.displaySettings as any),
            format: format,
            institution: 'HHMI/Janelia',
            dataset: { connect: { name: manifest.name } },
        }
    })

    const imageUpserts = await Promise.all(images.map(async im => {
        return prisma.image.upsert({
            where: { name_datasetName: { name: im.name, datasetName: manifest.name } },
            create: im,
            update: im
        }
        )
    }
    ))

    const imagesWithMeshes = Object.values(manifest.sources).filter(source => (source.subsources.length > 0))

    const meshInput = await Promise.all(imagesWithMeshes.map(async image => {
        const imageDb = await prisma.image.findFirst({ where: { datasetName: manifest.name, name: image.name } })
        if (imageDb !== null) {
            return image.subsources.map(mesh => {
                const meshcreateinput = { 
                    name: mesh.name,
                    description: mesh.description,
                    url: mesh.url,
                    transform: (mesh.transform as any),
                    image: { connect: { id: imageDb.id } }
                }
                return prisma.mesh.upsert({where: {imageId: imageDb.id}, create: meshcreateinput, update: meshcreateinput})
            })
        }
    }))

    const viewsIn = manifest.views.map(view => {
        return {
            name: view.name,
            description: view.description,
            position: view.position ?? undefined,
            orientation: view.orientation ?? undefined,
            scale: view.scale ?? undefined,
            tags: [],
            dataset: { connect: { name: manifest.name } }
        }
    })

    const view_upserts = await prisma.$transaction(viewsIn.map(view => {
        return prisma.view.upsert({
            where: { name_datasetName: { name: view.name, datasetName: manifest.name } },
            create: view,
            update: view
        }
        )
    }))

    const viewToImageIn: Prisma.ViewToImageUpsertArgs[] = []

    for (const view of manifest.views) {
        const viewdb = await prisma.view.findFirst({ where: { name: view.name, datasetName: manifest.name } })
        if (viewdb) {
            for (const source of view.sources) {
                const imagedb = await prisma.image.findFirst({ where: { name: source, datasetName: manifest.name } })
                if (imagedb) {
                    viewToImageIn.push({
                        where: {
                            imageId_viewId: { imageId: imagedb.id, viewId: viewdb.id }
                        },
                        create: { imageId: imagedb.id, viewId: viewdb.id }, update: {}
                    })
                }
            }
        }
    }
    const viewToImageUpserts = Promise.all(viewToImageIn.map(async (args) => {
        return await prisma.viewToImage.upsert(args)
    }))

    return datasetInDb
}
async function main() {
    const manifests: { body: DatasetManifest[] } = JSON.parse(readFileSync('src/seed/legacy_metadata.json', { encoding: "utf8" }));
    await Promise.all(manifests.body.map(generate_dataset));
}

main().then(async () => {
    await prisma.$disconnect()}).catch(
        async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
  })
