import axios from "axios"
import { DatasetManifest } from '../types/legacy';

interface repoRequestProps { apiURL: string}

const props = {apiURL: "https://raw.githubusercontent.com/janelia-cosem/fibsem-metadata/stable/"}

async function getContent({apiURL}: repoRequestProps ) {
    const postIndex: any = (await (await axios.get(apiURL + "api/index.json")).data)
    
    const manifests = Object.entries(postIndex["datasets"]).map(async ([key, value]) => {
        return (await axios.get(apiURL + value + '/manifest.json')).data
    }
        )
    return Promise.all(manifests)
}
function main(){
    return getContent(props) as Promise<DatasetManifest[]>
}

if (require.main === module) {
    main().then((v) => console.log(JSON.stringify({body: v}, null, 4)))
}
