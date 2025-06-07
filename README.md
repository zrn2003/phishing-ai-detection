
# PhishGuard - AI Phishing Detection Tool

PhishGuard is a web application designed to help users identify potentially malicious or phishing websites. Users can submit a URL, and PhishGuard will analyze it using a combination of heuristic checks (simulated in the current version) and an AI-powered explanation engine (using Genkit) to provide a safety classification and a detailed breakdown of why the URL is considered safe or potentially dangerous.

## Key Features

*   **URL Analysis**: Submit any URL for a quick safety assessment.
*   **AI-Powered Explanations**: Get clear, easy-to-understand explanations for why a URL is classified as safe or phishing, including potential risks and attack vectors.
*   **Real-time Feedback**: The UI updates dynamically with the analysis results.
*   **Modern Tech Stack**: Built with cutting-edge technologies for a smooth and responsive user experience.

## Tech Stack

*   **Frontend**:
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [React](https://reactjs.org/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [ShadCN UI](https://ui.shadcn.com/) (Component Library)
*   **AI/Backend Logic**:
    *   [Genkit (by Firebase)](https://firebase.google.com/docs/genkit): For defining AI flows and interacting with language models.
    *   [Google AI (Gemini)](https://ai.google.dev/): The underlying language model used by Genkit in this project.
*   **Development**:
    *   Node.js
    *   npm

## Components & Libraries Used

This project leverages several key libraries and UI components:

*   **Core Framework & UI**:
    *   **Next.js**: Provides the React framework for server-side rendering, routing, and more.
    *   **React**: Powers the user interface components.
    *   **TypeScript**: Adds static typing for improved code quality.
*   **Styling & UI Components**:
    *   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
    *   **ShadCN UI**: A collection of beautifully designed, accessible, and customizable React components built on top of Tailwind CSS and Radix UI. Specific components used include:
        *   `Input`
        *   `Button`
        *   `Alert`, `AlertDescription`, `AlertTitle`
        *   `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`
        *   `Badge`
        *   `Toaster` & `useToast` (for notifications)
    *   **Lucide React**: Provides a comprehensive set of beautiful and consistent icons.
*   **Form Handling & Validation**:
    *   **React Hook Form**: Manages form state and validation efficiently.
    *   **Zod**: A TypeScript-first schema declaration and validation library, used for validating form inputs.
*   **State Management**:
    *   **React Hooks**: `useState`, `useEffect`, `useActionState` for managing component state and side effects.
*   **Utilities**:
    *   `clsx` & `tailwind-merge`: For constructing conditional class names.

## Getting Started

Follow these instructions to set up and run PhishGuard on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 18.x or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   [Git](https://git-scm.com/)

### 1. Clone the Repository

Open your terminal and clone the repository:

```bash
git clone <repository-url>
cd <repository-folder-name>
```

Replace `<repository-url>` with the actual URL of your Git repository and `<repository-folder-name>` with the name of the directory created by the clone command.

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

This command will download and install all the necessary packages defined in `package.json`.

### 3. Environment Variables (Optional)

The project uses Genkit, which by default, might try to use application default credentials or specific environment variables for Google AI services if you were to deploy it or use non-default configurations.

Create a `.env` file in the root of the project:

```bash
touch .env
```

If you have specific API keys or configurations for Google AI (e.g., when moving beyond the free tier or using specific project settings), you might add them here. For basic local development with Genkit and a configured Google AI plugin (as in `src/ai/genkit.ts`), it often works out-of-the-box if you're authenticated with `gcloud` and have the necessary APIs enabled in a Google Cloud project.

A common variable you might need if you customize Genkit's Google AI plugin is:
```env
GOOGLE_API_KEY=your_google_ai_api_key_here
```
For the current setup, this might not be strictly necessary for local testing if Genkit's defaults work for you.

### 4. Running the Application

PhishGuard consists of two main parts that need to be run concurrently for full functionality: the Next.js frontend application and the Genkit development server (which handles the AI flows).

**a) Start the Next.js Development Server (Frontend)**

In your terminal, run:

```bash
npm run dev
```

This will typically start the Next.js application on `http://localhost:9002` (as per the `dev` script in `package.json`).

**b) Start the Genkit Development Server (AI Flows)**

Open a **new terminal window/tab** (keep the Next.js server running in the other one) and navigate to the project directory. Then run:

```bash
npm run genkit:dev
```
Or, for automatic reloading when AI flow files change:
```bash
npm run genkit:watch
```

This will start the Genkit development server, usually on `http://localhost:3400`. This server hosts your AI flows and makes them callable by the Next.js application. The Genkit CLI will also provide a UI to inspect flows, traces, etc.

### 5. Access PhishGuard

Once both servers are running:

*   Open your web browser and go to `http://localhost:9002` (or the port your Next.js app is running on) to use PhishGuard.
*   You can also explore the Genkit Developer UI at `http://localhost:3400` (or the port your Genkit server is running on) to see traces and inspect your AI flows.

You should now be able to enter URLs into the PhishGuard interface and receive AI-powered safety analyses!

## Project Structure (Key Directories)

*   `src/app/`: Contains the Next.js pages, layouts, and server actions.
    *   `src/app/page.tsx`: The main page component for the URL submission form and results.
    *   `src/app/actions.ts`: Server Actions handling the URL analysis logic and calling Genkit flows.
*   `src/ai/`: Houses all Genkit related code.
    *   `src/ai/genkit.ts`: Genkit global instance initialization and configuration.
    *   `src/ai/flows/`: Contains the Genkit flow definitions (e.g., `generate-explanation.ts`).
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/PhishGuardLogo.tsx`: The application's logo component.
    *   `src/components/UrlResultCard.tsx`: Component to display URL analysis results.
*   `src/hooks/`: Custom React hooks (e.g., `use-toast.ts`).
*   `src/lib/`: Utility functions.
*   `public/`: Static assets.

## Contributing

(Add guidelines for contributing to the project if applicable)

## License

(Specify the license for your project, e.g., MIT License)
```