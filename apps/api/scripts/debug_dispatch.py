import sys

sys.path.insert(0, ".")

from app.worker.dispatcher import dispatch

print(dispatch({"id": "x", "target_type": "social_comment", "reply_text": '{"body": "hi"}'}, {"id": "a", "provider": "meta", "token": None, "company_id": "c"}))