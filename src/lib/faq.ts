import type { Faq } from "@/lib/structuredData";

/**
 * Shown on /about and mirrored in its FAQPage JSON-LD and in llms.txt, so the visible text, the structured data and
 * what answer engines read always match. Keep every answer true to how the app behaves.
 */
const generalFaqs: readonly Faq[] = [
  {
    question: "What is Likho?",
    answer:
      "Likho is a free online notepad. Open the page and start typing: there is no sign-up, notes save automatically, and Markdown formats as you type.",
  },
  {
    question: "Is Likho free?",
    answer:
      "Yes. Likho is completely free to use, and the source code is open under the MIT license on GitHub.",
  },
  {
    question: "Do I need an account to use Likho?",
    answer:
      "No. You can write as many notes as you like without an account; they are saved in your browser on that device. Create a free account with an email and password only if you want your notes to sync across devices.",
  },
  {
    question: "Where are my notes stored?",
    answer:
      "As you type, every note is stored in your browser's local storage on that device, so clearing your browser data removes unsaved notes. If you are signed in, press Save (or Ctrl+S, Cmd+S on Mac) to store the note in your account; saved notes load on any device where you sign in. Notes you wrote before signing in move into your account automatically.",
  },
  {
    question: "Does Likho support Markdown?",
    answer:
      "Yes, live. Typing Markdown formats it in place: bullets and numbered lists, checklists, headings, horizontal rules, quotes, bold, italic, strikethrough, links, inline code and fenced code blocks with syntax highlighting. Notes are saved as plain Markdown text.",
  },
  {
    question: "Can I paste from other apps?",
    answer:
      "Yes. Paste formatted text from web pages, documents and spreadsheets into the note body to convert it to Markdown. Text copied from Excalidraw becomes a bullet list. Pasting images is not supported yet. Use Ctrl+Shift+V (or Cmd+Shift+V on Mac) to paste text without conversion.",
  },
  {
    question: "How do I make a bullet list in Likho?",
    answer:
      "Type a dash and a space (- ) at the start of a line. Press Enter to start the next bullet, press Enter on an empty bullet to end the list, and use Tab or Shift+Tab to indent or outdent.",
  },
  {
    question: "How do I add a code block?",
    answer:
      "Type three backticks followed by the language, for example ```json, and press Enter. Likho adds the closing fence, highlights the code and shows a copy button.",
  },
  {
    question: "Can I download or export my notes?",
    answer:
      "Yes. Use the download button next to the word count to save the current note as a Markdown (.md) file or a plain text (.txt) file.",
  },
  {
    question: "How do I save my notes to my account?",
    answer:
      "Sign in, then press the Save button at the top right of the note, or Ctrl+S (Cmd+S on Mac). Until you press Save, your edits stay on your device; a dot next to a note in the list marks changes that are not saved to your account yet. If you are not signed in, Save asks you to sign in or create a free account.",
  },
  {
    question: "Can I change the font or use dark mode?",
    answer:
      "Yes. Choose Hand, Sans, Serif or Mono from the Writing font menu at the bottom of the sidebar, and switch between light and dark themes with the sun and moon button.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Choose Forgot password on the sign-in page and enter your email. You will get a link to set a new password. Signed-in users can also change their password from the account menu, using either their current password or an emailed link.",
  },
  {
    question: "Does Likho work on my phone?",
    answer:
      "Yes. Likho runs in any modern web browser on phones, tablets and computers, and the layout adapts to small screens.",
  },
];

export const mcpFaqs: readonly Faq[] = [
  {
    question: "Does Likho have an MCP server?",
    answer:
      "Yes. Likho has an MCP server at /api/mcp. Signed-in users connect with personal access tokens and can let an assistant read, search, create, update, append to, delete and restore their cloud notes. OAuth sign-in is planned; clients that require OAuth are not supported yet.",
  },
  {
    question: "How do I connect Claude to Likho?",
    answer:
      "Sign in to Likho, open the account menu and choose Connect AI. Create a personal access token, copy it when it is shown once, then add the Likho MCP server URL and token to Claude Code or configure Claude Desktop with the mcp-remote bridge.",
  },
  {
    question: "Can AI assistants read my guest notes?",
    answer:
      "No. Guest notes stay in browser storage and are not reachable through MCP. An assistant can access only cloud notes belonging to the account associated with its token.",
  },
  {
    question: "Is it safe to give an assistant access?",
    answer:
      "Tokens are revocable and can be limited to read access or given read and write access. They reach only notes in the associated Likho account. The full token is shown once and stored as a SHA-256 hash; an assistant with write access can create, change, delete and restore that account's notes.",
  },
  {
    question: "Which clients work?",
    answer:
      "Claude Code and Cursor connect directly over MCP Streamable HTTP with a bearer token; Claude Desktop can connect through mcp-remote. Other clients that support MCP Streamable HTTP and bearer tokens can also connect. OAuth sign-in is planned; ChatGPT-style connectors and other clients that require OAuth are not supported yet.",
  },
];

export const faqs: readonly Faq[] = [...generalFaqs, ...mcpFaqs];
