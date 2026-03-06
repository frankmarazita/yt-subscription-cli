import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const workspaceRoot = path.resolve(__dirname, '../..')

// Resolve .js extension imports that point to .ts files in workspace packages
const workspaceTsResolve: Plugin = {
  name: 'workspace-ts-resolve',
  resolveId(id, importer) {
    if (id.endsWith('.js') && importer?.startsWith(workspaceRoot + '/packages')) {
      return this.resolve(id.slice(0, -3), importer, { skipSelf: true })
    }
  },
}

export default defineConfig({
  plugins: [react(), workspaceTsResolve],
})
