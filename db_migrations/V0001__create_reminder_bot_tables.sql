CREATE TABLE t_p25536907_simple_website_bot.users (
    id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p25536907_simple_website_bot.reminders (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES t_p25536907_simple_website_bot.users(id),
    message TEXT NOT NULL,
    remind_at TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p25536907_simple_website_bot.user_states (
    user_id BIGINT PRIMARY KEY REFERENCES t_p25536907_simple_website_bot.users(id),
    state TEXT NOT NULL DEFAULT 'idle',
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);