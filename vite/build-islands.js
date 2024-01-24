import fs from 'fs-extra';
import path from 'path';

const islands = fs.readdirSync('./resources/js/islands');
for (let island of islands) {
    const islandName = path.parse(island).name;

    // Создаем общую часть для клиента и сервера
    const islandAppMain = `import { createSSRApp } from 'vue'
import ${islandName} from "../../resources/js/islands/${islandName}.vue";

export function createApp() {
  const app = createSSRApp(${islandName})
  return { app }
}
`;
    fs.outputFileSync(`islands/${islandName}/${islandName}-main.js`, islandAppMain);

    // Отдельно серверная часть
    const islandAppServer = `import { renderToString } from 'vue/server-renderer'
import { createApp } from './${islandName}-main.js'

export async function render() {
    const { app } = createApp()
    const ctx = {}
    const html = await renderToString(app, ctx)

    return { html }
}
`;
    fs.outputFileSync(`islands/${islandName}/${islandName}-server.js`, islandAppServer);

    // Отдельно клиент
    const islandAppClient = `import { createApp } from './${islandName}-main.js'
const { app } = createApp()

app.mount('#${islandName}')

`;
    fs.outputFileSync(`islands/${islandName}/${islandName}-client.js`, islandAppClient);
}
console.log('Islands successfully build! ', islands);
