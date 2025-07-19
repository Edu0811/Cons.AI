# Welcome to your Cons.AI project


## How can I edit this code?

## Configuração da API Key OpenAI

Para usar os módulos de IA, você precisa configurar sua chave da OpenAI:

1. **Crie um arquivo `.env` na raiz do projeto**
2. **Adicione sua chave da OpenAI:**
   ```
   VITE_OPENAI_API_KEY=sua_chave_aqui
   ```
3. **Reinicie o servidor de desenvolvimento**

**Importante:** 
- O arquivo `.env` já está no `.gitignore` para proteger sua chave
- Use o arquivo `.env.example` como modelo
- Nunca compartilhe sua chave da OpenAI publicamente

There are several ways of editing your application.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


New Folder Structure:

src/modules/
├── shared/
│   ├── types.ts                    # Common types and interfaces
│   ├── hooks/
│   │   └── useModuleSettings.ts    # Shared settings management hook
│   └── components/
│       └── SettingsDialog.tsx      # Reusable settings dialog
├── simplebot/
│   ├── index.ts                    # Module exports
│   ├── config.ts                   # Module configuration
│   └── simplebotModule.tsx          # Main component
└── index.ts                       # Central module registry

Adding New Modules:
To add a new module, simply:

Create a new folder in src/modules/
Add the module component, config, and index files
Register it in src/modules/index.ts
The modular structure makes your codebase much more maintainable and easier to understand!