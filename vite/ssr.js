import bodyParser from "body-parser";
import { JSDOM } from 'jsdom';
import express from 'express'
import { renderToString } from 'vue/server-renderer'

const port = process.env.PORT || 3001
const base = process.env.BASE || '/'

const app = express()
const { createServer } = await import('vite')

const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
})

app.use(bodyParser.json());
app.use(vite.middlewares);

// Serve HTML
app.use('*', async (req, res) => {
    try {
        const t1 = performance.now();
        const dom = new JSDOM(req.body.template);
        const components = dom.window.document.querySelectorAll('[data-component]');
        // const head = dom.window.document.querySelector('head');
        const body = dom.window.document.querySelector('body');
        for (let component of components) {
            const render = (await vite.ssrLoadModule(`./islands/${component.id}/${component.id}-server.js`)).render
            const rendered = await render()
            component.innerHTML = rendered.html
            // const island = await import(`./islands/${component.id}/${component.id}-server.js`);
            // const html = renderToString(island);
            // component.innerHTML = html;

            // add style
            // if (fs.existsSync(`/build/${component.id}.css`)) {
            //     const style = dom.window.document.createElement("style");
            //     style.href = `/build/${component.id}.css`;
            //     head.appendChild(style);
            // }

            // add script
            const script = dom.window.document.createElement("script");
            script.type = "module";
            script.src = `/build/${component.id}.js`;
            body.appendChild(script);
        }
        res.send(dom.window.document.documentElement.outerHTML);
        const diff = performance.now() - t1;
        console.log(diff);
    } catch (e) {
        vite?.ssrFixStacktrace(e)
        console.log(e.stack)
        res.status(500).end(e.stack)
    }
})

// Start http server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})


