const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k] = v.join('=').replace('\r','');
  return acc;
}, {});

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY);

async function testModel(name) {
  try {
    const model = genAI.getGenerativeModel({ model: name });
    const result = await model.generateContent('Say exactly: "OK"');
    console.log(name, '-> Success:', result.response.text().trim());
  } catch (e) {
    console.log(name, '-> Error:', e.message.split('\n')[0].substring(0, 100));
  }
}

async function run() {
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-1.5-pro');
  await testModel('gemini-pro');
  await testModel('gemini-2.0-pro-exp-02-05');
  await testModel('gemini-2.5-pro');
}
run();
