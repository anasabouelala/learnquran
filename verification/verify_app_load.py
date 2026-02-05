from playwright.sync_api import Page, expect, sync_playwright

def test_app_load(page: Page):
    # 1. Go to the app
    page.goto("http://localhost:3000")

    # 2. Wait for the title
    # The title is in an h1 tag and says "رحلة الحفظ"
    expect(page.get_by_role("heading", name="رحلة الحفظ")).to_be_visible(timeout=10000)

    # 3. Verify the main buttons are visible
    expect(page.get_by_text("تعلم والعب")).to_be_visible()
    expect(page.get_by_text("تسميع")).to_be_visible()

    # 4. Take a screenshot
    page.screenshot(path="verification/app_loaded.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_app_load(page)
            print("Verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
            raise
        finally:
            browser.close()
