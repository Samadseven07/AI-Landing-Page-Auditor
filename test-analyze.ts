import { analyzeLandingPage } from './src/lib/aiAnalyzer';
async function run() {
  try {
    const scrapedData = {
      url: "https://rankysol.com",
      title: "Test",
      metaDescription: "Test Desc",
      h1: ["Test H1"], 
      h2: [],
      buttons: [],
      visibleText: "Test visible text"
    };
    const data = await analyzeLandingPage(scrapedData);
    console.log("Success:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
