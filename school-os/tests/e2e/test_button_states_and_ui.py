"""
Playwright Automated Button States and UI Verification Suite
Captures all button states, micro-interactions, modal states, and responsive views.
"""

import os
import shutil
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5050"
REPO_DIR = r"C:\Users\varsh\school-erp\school-os"
SCREENSHOT_DIR = os.path.join(REPO_DIR, "screenshots", "button_states")
ARTIFACT_DIR = r"C:\Users\varsh\.gemini\antigravity-cli\brain\4cec545d-54f5-4ed0-adc6-912a46253f7b"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)
if os.path.exists(ARTIFACT_DIR):
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

def copy_to_artifact(filename):
    src = os.path.join(SCREENSHOT_DIR, filename)
    if os.path.exists(ARTIFACT_DIR) and os.path.exists(src):
        dst = os.path.join(ARTIFACT_DIR, filename)
        shutil.copy2(src, dst)

def run_suite():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        # 1. Desktop Initial Load & Topbar Actions with Lock Hover
        page.goto(BASE_URL)
        page.wait_for_selector("header.topbar")
        lock_btn = page.locator("#btn-lock-session")
        lock_btn.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_01_topbar_controls_and_lock_hover.png"))
        copy_to_artifact("btn_01_topbar_controls_and_lock_hover.png")
        print("[PASS] 01: Topbar controls & Lock Session button hover captured.")
        
        # 2. Lock Modal & Quick-Unlock Persona Chips
        lock_btn.click()
        page.wait_for_selector(".lock-modal-dialog")
        page.locator('.role-chip:has-text("Teacher")').hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_02_lock_modal_persona_unlock_states.png"))
        copy_to_artifact("btn_02_lock_modal_persona_unlock_states.png")
        page.locator(".lock-modal-dialog button.btn-cancel").click()
        time.sleep(0.3)
        print("[PASS] 02: Lock Modal & Persona unlock states captured.")

        # 3. Switch to Teacher Role & Actions Bar
        page.select_option("select.persona-selector", "Teacher")
        time.sleep(0.5)
        enter_marks_btn = page.locator('button:has-text("Enter Marks")')
        enter_marks_btn.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_03_teacher_workspace_action_buttons.png"))
        copy_to_artifact("btn_03_teacher_workspace_action_buttons.png")
        print("[PASS] 03: Teacher workspace & action buttons captured.")

        # 4. Rapid Attendance Modal & Student Status Cards
        fast_att_btn = page.locator('button:has-text("Fast Attendance (<20s)")')
        fast_att_btn.click()
        page.wait_for_selector(".attendance-modal")
        time.sleep(0.5)
        # Toggle card 1 to Absent (1 click)
        cards = page.locator(".student-card-attendance")
        cards.nth(0).click()
        # Toggle card 2 to Late (2 clicks)
        cards.nth(1).click()
        cards.nth(1).click()
        # Hover submit button
        submit_att = page.locator("button.btn-save-attendance")
        submit_att.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_04_attendance_modal_student_toggle_states.png"))
        copy_to_artifact("btn_04_attendance_modal_student_toggle_states.png")
        page.locator('button.btn-cancel:has-text("Cancel")').click()
        time.sleep(0.3)
        print("[PASS] 04: Attendance modal student status card states captured.")

        # 5. Teacher Rapid Marks Spreadsheet Grid & Reactivity
        enter_marks_btn.click()
        page.wait_for_selector(".marks-modal-dialog")
        time.sleep(0.5)
        # Edit first input to 95 (A1), second to 42 (C2)
        inputs = page.locator(".mark-input")
        if inputs.count() > 1:
            inputs.nth(0).fill("95")
            inputs.nth(1).fill("42")
        save_marks_btn = page.locator("#btn-save-marks-db")
        save_marks_btn.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_05_marks_spreadsheet_grade_calculation_reactivity.png"))
        copy_to_artifact("btn_05_marks_spreadsheet_grade_calculation_reactivity.png")
        save_marks_btn.click()
        time.sleep(0.6)
        print("[PASS] 05: Marks spreadsheet grid & dynamic grade calculation captured.")

        # 6. Switch to Accountant Persona & Actions
        page.select_option("select.persona-selector", "Accountant")
        time.sleep(0.5)
        new_payment_btn = page.locator('button:has-text("New Payment")').first
        new_payment_btn.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_06_accountant_fee_action_buttons.png"))
        copy_to_artifact("btn_06_accountant_fee_action_buttons.png")
        print("[PASS] 06: Accountant fee actions and receivables aging captured.")

        # 7. Fee Collection Modal & Payment Modes
        new_payment_btn.click()
        page.wait_for_selector(".receipt-modal-dialog")
        time.sleep(0.5)
        confirm_fee_btn = page.locator("#btn-confirm-fee-collect")
        confirm_fee_btn.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_07_fee_collection_modal_modes.png"))
        copy_to_artifact("btn_07_fee_collection_modal_modes.png")
        
        # 8. Generate Stamped Fee Receipt
        confirm_fee_btn.click()
        time.sleep(0.8)
        page.wait_for_selector(".receipt-stamp-paid")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_08_official_stamped_fee_receipt_modal.png"))
        copy_to_artifact("btn_08_official_stamped_fee_receipt_modal.png")
        page.locator(".receipt-modal-dialog button.btn-secondary:has-text('Close')").click()
        time.sleep(0.3)
        print("[PASS] 07 & 08: Fee collection modal & stamped receipt verified.")

        # 9. Cashier Day-Book Re-Print Button Hover
        reprint_btn = page.locator('button[id^="btn-reprint-"]').first
        reprint_btn.hover()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_09_cashier_daybook_reprint_button_hover.png"))
        copy_to_artifact("btn_09_cashier_daybook_reprint_button_hover.png")
        print("[PASS] 09: Cashier day-book re-print button state captured.")

        # 10 & 11. Transfer Certificate (TC) Guard: Disabled vs Cleared State
        page.select_option("select.persona-selector", "Principal")
        time.sleep(0.5)
        # Student with dues (first student in table)
        tc_btn = page.locator("button.tc-action-btn:has-text('Issue TC')").first
        tc_btn.click()
        page.wait_for_selector(".tc-modal")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_10_tc_modal_financial_block_state.png"))
        copy_to_artifact("btn_10_tc_modal_financial_block_state.png")
        page.locator(".tc-modal button.close-btn").click()
        time.sleep(0.3)

        # Student with ₹0 balance (cleared state)
        cleared_tc = page.locator(".compact-row:has-text('₹0') button.tc-action-btn:has-text('Issue TC')")
        if cleared_tc.count() > 0:
            cleared_tc.first.click()
        else:
            page.locator("button.tc-action-btn:has-text('Issue TC')").nth(2).click()
        page.wait_for_selector(".tc-modal")
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_11_tc_modal_cleared_student_state.png"))
        copy_to_artifact("btn_11_tc_modal_cleared_student_state.png")
        page.locator(".tc-modal button.close-btn").click()
        time.sleep(0.3)
        print("[PASS] 10 & 11: TC modal financial clearance guard (Disabled vs Active) captured.")

        # 12. Official CBSE Bilingual Report Card View
        page.select_option("select.persona-selector", "Parent")
        time.sleep(0.5)
        rc_btn = page.locator("#btn-parent-report-card")
        rc_btn.hover()
        time.sleep(0.3)
        rc_btn.click()
        page.wait_for_selector(".report-card-modal-dialog")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_12_cbse_official_bilingual_report_card.png"))
        copy_to_artifact("btn_12_cbse_official_bilingual_report_card.png")
        page.locator('button.btn-secondary:has-text("Close")').click()
        time.sleep(0.3)
        print("[PASS] 12: Official CBSE report card view captured.")

        # 13, 14, 15. Settings Tabs
        page.select_option("select.persona-selector", "Principal")
        time.sleep(0.3)
        page.locator("button.settings-button").click()
        page.wait_for_selector(".settings-modal-dialog")
        time.sleep(0.4)

        # Tab 2: Gateways
        page.locator('.settings-tab-btn:has-text("Payment & SMS Gateways")').click()
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_13_settings_tab_gateways_self_config.png"))
        copy_to_artifact("btn_13_settings_tab_gateways_self_config.png")

        # Tab 4: Bulk CSV
        page.locator('.settings-tab-btn:has-text("Bulk CSV Importer")').click()
        time.sleep(0.4)
        page.locator('button:has-text("Pre-flight Validate Roster")').click()
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_14_settings_tab_bulk_csv_importer.png"))
        copy_to_artifact("btn_14_settings_tab_bulk_csv_importer.png")

        # Tab 5: Disaster Recovery & Backup
        page.locator('.settings-tab-btn:has-text("Backup & Recovery")').click()
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_15_settings_tab_backup_and_disaster_recovery.png"))
        copy_to_artifact("btn_15_settings_tab_backup_and_disaster_recovery.png")
        page.locator(".settings-modal-dialog button.close-btn").click()
        time.sleep(0.3)
        print("[PASS] 13, 14, 15: Settings tabs (Gateways, Bulk CSV, Disaster Recovery) captured.")

        # 16. Command Palette Active Spotlight
        page.keyboard.press("Control+k")
        page.wait_for_selector(".palette-modal")
        time.sleep(0.2)
        page.locator(".palette-input").fill("Attendance")
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_16_command_palette_spotlight_ctrl_k.png"))
        copy_to_artifact("btn_16_command_palette_spotlight_ctrl_k.png")
        page.keyboard.press("Escape")
        time.sleep(0.3)
        print("[PASS] 16: Command palette search & active item captured.")

        # 17. Mobile Viewport (390 x 844)
        context_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page_m = context_mobile.new_page()
        page_m.goto(BASE_URL)
        page_m.wait_for_selector(".bottom-nav")
        time.sleep(0.5)
        page_m.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_17_mobile_bottom_nav_and_responsive_view.png"))
        copy_to_artifact("btn_17_mobile_bottom_nav_and_responsive_view.png")
        print("[PASS] 17: Mobile viewport & bottom nav captured.")

        # 18. Tablet Viewport (768 x 1024)
        context_tablet = browser.new_context(viewport={"width": 768, "height": 1024})
        page_t = context_tablet.new_page()
        page_t.goto(BASE_URL)
        page_t.wait_for_selector(".workspace")
        time.sleep(0.5)
        page_t.screenshot(path=os.path.join(SCREENSHOT_DIR, "btn_18_tablet_viewport_grid_view.png"))
        copy_to_artifact("btn_18_tablet_viewport_grid_view.png")
        print("[PASS] 18: Tablet viewport grid view captured.")

        browser.close()
        print("=== ALL 18 BUTTON AND UI STATE SCREENSHOTS CAPTURED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_suite()
