import { scrapePage } from './src/lib/scraper';
async function run() {
  try {
    const data = await scrapePage('https://rankysol.com');
    console.log("Success:", data.title);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
