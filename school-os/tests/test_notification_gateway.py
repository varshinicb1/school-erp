import sys
import os
import json

sys.path.insert(0, os.path.abspath("product/school_india"))

from school_india.communication.gateway_adapter import NotificationGatewayAdapter

def test_notification_enqueued_as_queue_ready():
    adapter = NotificationGatewayAdapter(provider="FAST2SMS_STAGED")
    entry = adapter.enqueue_notification(
        recipient_phone="+91 98490 12345",
        channel="SMS",
        message="Dear Parent, Aarav was marked Absent today.",
        student_id="VIS-2026-0048"
    )
    
    assert entry["status"] == "QUEUE_READY_BUT_PROVIDER_NOT_CONFIGURED"
    assert entry["channel"] == "SMS"
    assert entry["student_id"] == "VIS-2026-0048"

def test_invalid_phone_rejected():
    adapter = NotificationGatewayAdapter()
    entry = adapter.enqueue_notification(
        recipient_phone="12345",
        channel="WHATSAPP",
        message="Test alert",
        student_id="VIS-2026-0062"
    )
    assert entry["status"] == "FAILED_INVALID_PHONE"

def test_outbox_file_persisted():
    outbox = os.path.abspath("backups/communication_outbox/notifications_log.json")
    assert os.path.exists(outbox)
    with open(outbox, "r") as f:
        data = json.load(f)
    assert len(data) >= 2

if __name__ == "__main__":
    test_notification_enqueued_as_queue_ready()
    test_invalid_phone_rejected()
    test_outbox_file_persisted()
    print("Notification Gateway and Outbox persistence tests PASSED successfully!")
