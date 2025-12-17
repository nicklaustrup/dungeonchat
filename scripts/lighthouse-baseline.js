#!/usr/bin/env node
/**
 * Lighthouse baseline script (Phase 5 prep)
 * Usage: node scripts/lighthouse-baseline.js http://localhost:3000
 * Requires: npm i --save-dev lighthouse chrome-launcher
 */
const { launch } = require("chrome-launcher");
const lighthouse = require("lighthouse");

async function run(url) {
  if (!url) {
    console.error("Usage: node scripts/lighthouse-baseline.js <url>");
    process.exit(1);
  }
  const chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const opts = { port: chrome.port, output: "json", logLevel: "info" };
  const config = null; // default
  const { lhr } = await lighthouse(url, opts, config);
  const summary = {
    requestedUrl: lhr.requestedUrl,
    finalUrl: lhr.finalUrl,
    performance: lhr.categories.performance.score,
    accessibility: lhr.categories.accessibility.score,
    bestPractices: lhr.categories["best-practices"].score,
    seo: lhr.categories.seo.score,
    pwa: lhr.categories.pwa && lhr.categories.pwa.score,
  };
  console.log("Lighthouse summary:", summary);
  await chrome.kill();
}

run(process.argv[2]);
