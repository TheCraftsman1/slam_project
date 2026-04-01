import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

async function test() {
  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`;
  const payload = {
    location: { latitude: 17.604, longitude: 78.411 },
    extraComputations: ["LOCAL_AQI", "POLLUTANT_CONCENTRATION"]
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!resp.ok) {
     console.error("HTTP error", resp.status, await resp.text());
     return;
  }
  const json = await resp.json();
  console.log(JSON.stringify(json, null, 2));
}

test();
