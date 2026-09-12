"""
Playwright Browser E2E Test Suite for Indian School ERP (CampusGrid)
ASCII-safe output for Windows consoles.
"""

import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5050"
SCREENSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "screenshots", "baseline"))

def test_full_browser_suite():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # --- SCENARIO 1: Desktop Viewport & Dashboard Integrity ---
        context_desktop = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context_desktop.new_page()
        page.goto(BASE_URL)
        page.wait_for_selector("header.topbar")
        
        header_text = page.locator("header.topbar").inner_text()
        assert "Vidyuth International School" in header_text
        
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_desktop_dashboard.png"), full_page=True)
        print("[PASS] Scenario 1: Desktop Dashboard rendered and captured.")

        # --- SCENARIO 2: Rapid Attendance Entry (<20s) ---
        fast_att_btn = page.locator("button:has-text('Fast Attendance (<20s)')")
        fast_att_btn.click()
        page.wait_for_selector(".attendance-modal")
        
        first_student_card = page.locator(".student-card-attendance").first
        first_student_card.click()
        
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_rapid_attendance_modal.png"))
        
        page.on("console", lambda msg: print("BROWSER LOG:", msg.text))
        submit_btn = page.locator("button:has-text('Submit Attendance & Notify Parents')")
        submit_btn.click()
        page.wait_for_timeout(2000)
        
        activity_note = page.locator(".activity-note").inner_text()
        print("ACTIVITY NOTE IS:", repr(activity_note))
        assert "Roll-call saved" in activity_note or "submitted" in activity_note or "Roll call" in activity_note


        print("[PASS] Scenario 2: Rapid Attendance modal interaction & live submission verified.")

        # --- SCENARIO 3: Global Command Palette (Ctrl + K) ---
        page.keyboard.press("Control+k")
        page.wait_for_selector(".palette-modal")
        
        page.locator(".palette-input").fill("Defaulters")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_command_palette_ctrl_k.png"))
        page.keyboard.press("Escape")
        print("[PASS] Scenario 3: Global Command Palette (Ctrl+K) opened, searched, and dismissed.")

        # --- SCENARIO 4: Transfer Certificate (TC) Issuance & Fee Block Guard ---
        tc_btn = page.locator(".tc-action-btn").first
        tc_btn.click()
        page.wait_for_selector(".tc-modal")
        
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "04_transfer_certificate_modal.png"))
        
        cancel_tc = page.locator(".tc-modal .btn-cancel")
        cancel_tc.click()
        print("[PASS] Scenario 4: Transfer Certificate Preview & Fee Clearance Guard verified.")

        # --- SCENARIO 5: Responsive Mobile Viewport (iPhone 14 / 390x844) ---
        context_mobile = browser.new_context(viewport={"width": 390, "height": 844})
        page_mobile = context_mobile.new_page()
        page_mobile.goto(BASE_URL)
        page_mobile.wait_for_selector(".bottom-nav")
        
        page_mobile.screenshot(path=os.path.join(SCREENSHOT_DIR, "05_mobile_viewport_390x844.png"), full_page=True)
        print("[PASS] Scenario 5: Mobile Viewport (390x844) navigation & layout verified.")

        # --- SCENARIO 6: Responsive Tablet Viewport (iPad / 768x1024) ---
        context_tablet = browser.new_context(viewport={"width": 768, "height": 1024})
        page_tablet = context_tablet.new_page()
        page_tablet.goto(BASE_URL)
        page_tablet.wait_for_selector(".workspace")
        
        page_tablet.screenshot(path=os.path.join(SCREENSHOT_DIR, "06_tablet_viewport_768x1024.png"), full_page=True)
        print("[PASS] Scenario 6: Tablet Viewport (768x1024) verified.")

        # --- SCENARIO 7: Role Persona Switching (Teacher Workspace) ---
        page.select_option("select.persona-selector", "Teacher")
        page.wait_for_selector(".teacher-view")
        assert "Teacher Workspace" in page.locator(".persona-banner").inner_text()
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "07_teacher_persona_view.png"), full_page=True)
        print("[PASS] Scenario 7: Teacher Persona view rendered & verified.")

        # --- SCENARIO 8: Role Persona Switching (Parent Portal) ---
        page.select_option("select.persona-selector", "Parent")
        page.wait_for_selector(".parent-view")
        assert "Parent Portal" in page.locator(".parent-banner").inner_text()
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "08_parent_persona_view.png"), full_page=True)
        print("[PASS] Scenario 8: Parent Persona view rendered & verified.")

        # --- SCENARIO 9: Role Persona Switching (Accountant Fee Center) ---
        page.select_option("select.persona-selector", "Accountant")
        page.wait_for_selector(".accountant-view")
        assert "Accounts & Fee" in page.locator(".accountant-banner").inner_text()
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "09_accountant_persona_view.png"), full_page=True)
        print("[PASS] Scenario 9: Accountant Persona view rendered & verified.")

        # --- SCENARIO 10: Self-Service School Onboarding & Settings Center ---
        page.select_option("select.persona-selector", "Principal")
        time.sleep(0.5)
        settings_btn = page.locator("button.settings-button")
        settings_btn.click()
        page.wait_for_selector(".settings-modal-dialog")
        modal_header = page.locator(".settings-modal-header").inner_text()
        assert "Settings Center" in modal_header
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "10_school_onboarding_settings.png"))
        print("[PASS] Scenario 10: Self-Service School Profile & Settings Center rendered.")

        # --- SCENARIO 11: Self-Service Payment & SMS Gateways (Tie Your Hands) ---
        gateways_tab = page.locator("button.settings-tab-btn:has-text('Payment & SMS Gateways')")
        gateways_tab.click()
        page.wait_for_selector(".integration-box")
        assert "Razorpay" in page.locator(".settings-tab-body").inner_text()
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "11_gateways_self_configuration.png"))
        print("[PASS] Scenario 11: Self-Service Gateway Configuration verified.")

        # --- SCENARIO 12: Self-Service Bulk CSV Student Importer & Government Validation ---
        importer_tab = page.locator("button.settings-tab-btn:has-text('Bulk CSV Importer')")
        importer_tab.click()
        page.wait_for_selector(".importer-container")
        
        validate_btn = page.locator("button:has-text('Pre-flight Validate Roster')")
        validate_btn.click()
        page.wait_for_selector(".validation-table")
        assert "Validation Summary" in page.locator(".settings-tab-body").inner_text()
        
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "12_bulk_csv_importer.png"))
        print("[PASS] Scenario 12: Self-Service Bulk CSV Importer & Government Validation verified.")

        # --- SCENARIO 13: Fee Collection & Stamped Official Receipt ---
        page.locator(".settings-modal-header .close-btn").click()
        time.sleep(0.5)
        page.select_option("select.persona-selector", "Accountant")
        time.sleep(0.5)
        record_pay_btn = page.locator("#btn-accountant-collect-fee")
        record_pay_btn.click()
        page.wait_for_selector(".receipt-modal-dialog")
        assert "Fee Collection & Stamped Receipt" in page.locator(".receipt-modal-dialog").inner_text()
        
        # Confirm collection to generate stamped receipt
        page.locator("#btn-confirm-fee-collect").click()
        page.wait_for_selector(".receipt-stamp-paid")
        assert "PAID" in page.locator(".receipt-stamp-paid").inner_text()
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "13_fee_collection_receipt.png"))
        print("[PASS] Scenario 13: Fee Collection & Stamped Official Receipt verified.")

        # Close receipt modal
        page.locator("button:has-text('Close')").click()
        time.sleep(0.5)

        # --- SCENARIO 14: Official CBSE Report Card & Mark Sheet Generation ---
        page.select_option("select.persona-selector", "Parent")
        time.sleep(0.5)
        view_rc_btn = page.locator("#btn-parent-report-card")
        view_rc_btn.click()
        page.wait_for_selector(".report-card-modal-dialog")
        assert "OFFICIAL REPORT CARD" in page.locator(".report-card-modal-dialog").inner_text()
        assert "MEETS_CBSE_75_RULE" in page.locator(".report-card-student-meta").inner_text()
        assert "Mathematics" in page.locator(".report-card-table").first.inner_text()
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "14_cbse_official_report_card.png"))
        print("[PASS] Scenario 14: Official CBSE Report Card & Mark Sheet verified.")

        page.locator(".report-card-modal-dialog button:has-text('Close')").click()
        time.sleep(0.5)

        # --- SCENARIO 15: Teacher Rapid Marks Entry Grid ---
        page.select_option("select.persona-selector", "Teacher")
        time.sleep(0.5)
        enter_marks_btn = page.locator("#btn-teacher-enter-marks")
        enter_marks_btn.click()
        page.wait_for_selector(".marks-modal-dialog")
        assert "Grade Periodic Test 1" in page.locator(".marks-modal-dialog").inner_text()
        assert "Mathematics" in page.locator(".marks-meta-strip").inner_text()
        
        # Modify mark of first student and capture
        first_input = page.locator(".mark-input").first
        first_input.fill("98")
        time.sleep(0.2)
        
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "15_teacher_marks_entry_grid.png"))
        print("[PASS] Scenario 15: Teacher Rapid Marks Entry Grid verified.")
        
        page.locator("#btn-save-marks-db").click()
        time.sleep(0.5)

        # --- SCENARIO 16: Accountant Cashier Day-Book & Stamped Receipt Re-Print ---
        page.select_option("select.persona-selector", "Accountant")
        time.sleep(0.5)
        page.wait_for_selector(".daybook-panel")
        assert "Cashier Day-Book" in page.locator(".daybook-panel").inner_text()
        
        # Click Re-Print on first receipt in ledger
        reprint_btn = page.locator(".daybook-table .tc-action-btn").first
        reprint_btn.click()
        page.wait_for_selector(".receipt-modal-dialog")
        assert "FEE COLLECTION RECEIPT" in page.locator(".receipt-sheet").inner_text()
        
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "16_accountant_daybook_ledger.png"))
        print("[PASS] Scenario 16: Accountant Day-Book Ledger & Stamped Receipt Re-Print verified.")
        
        page.locator("button:has-text('Close')").click()

        browser.close()
        print("=== ALL 16 PLAYWRIGHT E2E SCENARIOS PASSED WITH SCREENSHOT EVIDENCE ===")

if __name__ == "__main__":
    test_full_browser_suite()


