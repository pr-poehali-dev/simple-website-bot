import json
import os
import psycopg2
import requests
from datetime import datetime

SCHEMA = "t_p25536907_simple_website_bot"
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_message(chat_id, text):
    requests.post(f"{TG_API}/sendMessage", json={
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": json.dumps({
            "keyboard": [[{"text": "➕ Создать напоминание"}]],
            "resize_keyboard": True
        })
    })


def handler(event: dict, context) -> dict:
    """Планировщик: проверяет базу и отправляет просроченные напоминания."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"},
            "body": ""
        }

    conn = get_conn()
    sent_count = 0

    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT r.id, r.user_id, r.message, r.remind_at
                FROM {SCHEMA}.reminders r
                WHERE r.sent = FALSE AND r.remind_at <= NOW()
                ORDER BY r.remind_at ASC
                LIMIT 50"""
        )
        reminders = cur.fetchall()

    for reminder_id, user_id, message, remind_at in reminders:
        try:
            send_message(user_id, f"🔔 Напоминание!\n\n<b>{message}</b>")
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.reminders SET sent = TRUE WHERE id = %s",
                    (reminder_id,)
                )
            conn.commit()
            sent_count += 1
        except Exception as e:
            print(f"Error sending reminder {reminder_id}: {e}")

    conn.close()

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"sent": sent_count, "checked_at": datetime.now().isoformat()})
    }
