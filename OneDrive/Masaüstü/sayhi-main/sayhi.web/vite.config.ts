import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) =>
{
    const env = loadEnv(mode, process.cwd(), "");

    // mode 							"development"
    // process.cwd()					"C:\Projects.SoftHub2\Sayhi\sayhi.web"
    // services__apiservice__https__0	"https://localhost:7325"
    // services__apiservice__http__0	"http://localhost:5406"

    //console.log(process.env);
    
    const apiUrl =
        process.env.services__apiservice__http__0 ||
        process.env.services__apiservice__https__0 ||
        process.env.VITE_API_URL ||
        "http://localhost:5000";

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src")
            }
        },
        server: {
            port: parseInt(env.PORT) || 5173,
            host: true,
            proxy: {
                "/chatHub": { 
                    target: apiUrl, 
                    secure: false, 
                    ws: true,
                    changeOrigin: true
                },
                "/api": { 
                    target: apiUrl, 
                    secure: false, 
                    changeOrigin: true,
                    rewrite: (path) => path
                }
            }
        },
        build: {
            outDir: "dist",
            rollupOptions: {
                input: "./index.html"
            }
        }
    }
})
