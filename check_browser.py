import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err.message}"))
        
        try:
            await page.goto("http://localhost:3000/map", timeout=10000)
            await page.wait_for_timeout(3000)
            print("Page loaded successfully.")
        except Exception as e:
            print(f"Navigation failed: {e}")
            
        await browser.close()

asyncio.run(main())
