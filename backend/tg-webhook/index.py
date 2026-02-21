import json
import os
import psycopg2
import requests
from datetime import datetime

SCHEMA = "t_p25536907_simple_website_bot"
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

STATES = {
    "idle": None,
    "wait_message": "Напишите текст напоминания:",
    "wait_date": "Введите дату в формате ДД.ММ.ГГГГ (например, 25.03.2026):",
    "wait_time": "Введите время в формате ЧЧ:ММ (например, 09:30):",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_message(chat_id, text, reply_markup=None):
    data = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup)
    requests.post(f"{TG_API}/sendMessage", json=data)


def get_state(conn, user_id):
    with conn.cursor() as cur:
        cur.execute(f"SELECT state, data FROM {SCHEMA}.user_states WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        if row:
            return row[0], row[1] or {}
        return "idle", {}


def set_state(conn, user_id, state, data=None):
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.user_states (user_id, state, data, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET state=%s, data=%s, updated_at=NOW()""",
            (user_id, state, json.dumps(data or {}), state, json.dumps(data or {}))
        )
    conn.commit()


def save_reminder(conn, user_id, message, remind_at):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.reminders (user_id, message, remind_at) VALUES (%s, %s, %s)",
            (user_id, message, remind_at)
        )
    conn.commit()


def ensure_user(conn, user_id, username, first_name):
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.users (id, username, first_name)
                VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING""",
            (user_id, username, first_name)
        )
    conn.commit()


def handler(event: dict, context) -> dict:
    """Webhook для приёма сообщений от Telegram и управления напоминаниями."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": "",
        }

    try:
        raw_body = event.get("body") or "{}"
        if isinstance(raw_body, dict):
            body = raw_body
        else:
            body = json.loads(str(raw_body))
        if not isinstance(body, dict):
            body = {}
    except Exception:
        body = {}
    message = body.get("message") or body.get("edited_message")

    if not message:
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": "ok"}

    chat_id = message["chat"]["id"]
    user_id = message["from"]["id"]
    username = message["from"].get("username", "")
    first_name = message["from"].get("first_name", "")
    text = message.get("text", "").strip()

    conn = get_conn()
    ensure_user(conn, user_id, username, first_name)
    state, data = get_state(conn, user_id)

    if text == "/start":
        set_state(conn, user_id, "idle", {})
        send_message(chat_id,
            f"Привет, {first_name}! 👋\n\nЯ бот-напоминалка. Я отправлю тебе сообщение в нужный день и время.\n\nНажми кнопку ниже, чтобы создать напоминание.",
            reply_markup={"keyboard": [[{"text": "➕ Создать напоминание"}]], "resize_keyboard": True}
        )

    elif text in ("➕ Создать напоминание", "/remind"):
        set_state(conn, user_id, "wait_message", {})
        send_message(chat_id, "📝 Напишите текст напоминания:")

    elif state == "wait_message":
        data["message"] = text
        set_state(conn, user_id, "wait_date", data)
        send_message(chat_id, "📅 Введите дату в формате ДД.ММ.ГГГГ\nНапример: 25.03.2026")

    elif state == "wait_date":
        try:
            datetime.strptime(text, "%d.%m.%Y")
            data["date"] = text
            set_state(conn, user_id, "wait_time", data)
            send_message(chat_id, "⏰ Введите время в формате ЧЧ:ММ\nНапример: 09:30")
        except ValueError:
            send_message(chat_id, "❌ Неверный формат даты. Попробуйте ещё раз.\nФормат: ДД.ММ.ГГГГ (например, 25.03.2026)")

    elif state == "wait_time":
        try:
            remind_at = datetime.strptime(f"{data['date']} {text}", "%d.%m.%Y %H:%M")
            if remind_at <= datetime.now():
                send_message(chat_id, "❌ Эта дата и время уже прошли. Введите другое время:")
            else:
                save_reminder(conn, user_id, data["message"], remind_at)
                set_state(conn, user_id, "idle", {})
                send_message(chat_id,
                    f"✅ Напоминание сохранено!\n\n📝 <b>{data['message']}</b>\n📅 {data['date']} в {text}\n\nЯ напомню тебе в нужное время!",
                    reply_markup={"keyboard": [[{"text": "➕ Создать напоминание"}]], "resize_keyboard": True}
                )
        except ValueError:
            send_message(chat_id, "❌ Неверный формат времени. Попробуйте ещё раз.\nФормат: ЧЧ:ММ (например, 09:30)")

    else:
        send_message(chat_id, "Нажми кнопку «➕ Создать напоминание» чтобы добавить напоминание.",
            reply_markup={"keyboard": [[{"text": "➕ Создать напоминание"}]], "resize_keyboard": True}
        )

    conn.close()
    return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": "ok"}