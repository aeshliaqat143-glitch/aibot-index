PAKISTAN AI - NETLIFY SETUP

1. Keep index.html at the project root.
2. Keep netlify/functions/gemini.js exactly at that path.
3. Keep netlify.toml at the project root.
4. In Netlify, open Site configuration -> Environment variables.
5. Add: GEMINI_API_KEY = your Gemini API key.
6. Do NOT put the API key inside index.html or upload it to GitHub.
7. Deploy/redeploy the site.
8. Test:
   - Lahore Fort kahan hai?
   - kab bana?
   - kis ne banaya?
   - Lahore Fort ki history batao.
   - Lahore Fort ke bare mein complete information do.

The frontend sends the current question, recent conversation, and the most relevant local Pakistan database entries to the Netlify function. The function calls Gemini securely using the Netlify environment variable. If Gemini is temporarily unavailable, the website falls back to its existing local answer system.
