import "dotenv/config";
import { Telegraf } from "telegraf";
import sqlite from "sqlite3";

const FROM_CHANNEL_ID = parseInt(process.env.FROM_CHANNEL_ID);
const TO_CHANNEL_ID = parseInt(process.env.TO_CHANNEL_ID);

const db = new sqlite.Database("./chats.db");
const bot = new Telegraf(process.env.BOT_TOKEN);

db.exec(`
    CREATE TABLE IF NOT EXISTS chats(
        forwarded_from INT,
        forwarded_to INT
    )
`);

bot.start(ctx => {
    ctx.reply("Hello! This bot isn't meant for DMs; please contact @DollarNoob for more information.");
});

bot.on("message", async ctx => {
    if (ctx.chat.id === FROM_CHANNEL_ID) {
        const replyTo = ctx.message.reply_to_message;
        const origin = ctx.message.forward_origin;
        if (replyTo) {
            db.get("SELECT * FROM chats WHERE forwarded_from = ? OR forwarded_to = ?", [ replyTo.message_id, replyTo.message_id ], async (err, row) => {
                if (err) throw err;
                if (row) {
                    const msgId = replyTo.message_id === row.forwarded_from ? row.forwarded_to : row.forwarded_from;
                    let copied;
                    if (ctx.message.text) { // Text Message
                        copied = await ctx.telegram.sendMessage(TO_CHANNEL_ID, `<a href="tg://user?id=${ctx.from.id}">${ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)}</a>: ${ctx.message.text.replace(/</g, "&lt;")}`, {
                            disable_notification: true,
                            reply_parameters: {
                                message_id: msgId
                            },
                            parse_mode: "HTML"
                        }).catch(() => null);
                    } else {
                        copied = await ctx.copyMessage(TO_CHANNEL_ID, {
                            disable_notification: true,
                            reply_parameters: {
                                message_id: msgId
                            },
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Replied by " + (ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)),
                                            callback_data: "replied"
                                        }
                                    ]
                                ]
                            }
                        }).catch(() => null);
                    }
                    if (copied) {
                        db.run("INSERT INTO chats VALUES(?, ?)", [ ctx.message.message_id, copied.message_id ]);
                        return;
                    }
                }

                const forward = await ctx.telegram.forwardMessage(
                    TO_CHANNEL_ID,
                    replyTo.chat.id,
                    replyTo.message_id,
                    {
                        disable_notification: true
                    }
                ).catch(() => null);
                if (!forward) return;

                db.run("INSERT INTO chats VALUES(?, ?)", [ replyTo.message_id, forward.message_id ]);

                const copied = await ctx.copyMessage(TO_CHANNEL_ID, {
                    disable_notification: true,
                    reply_parameters: {
                        message_id: forward.message_id,
                        chat_id: forward.chat.id
                    },
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Replied by " + (ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)),
                                    callback_data: "replied"
                                }
                            ]
                        ]
                    }
                }).catch(() => null);
                if (copied) {
                    db.run("INSERT INTO chats VALUES(?, ?)", [ ctx.message.message_id, copied.message_id ]);
                }
            });
            return;
        }

        const msg = await ctx.forwardMessage(TO_CHANNEL_ID, { disable_notification: true }).catch(() => null);
        if (!msg) return;

        db.run("INSERT INTO chats VALUES(?, ?)", [ ctx.message.message_id, msg.message_id ]);

        if (origin && !(origin.type === "user" && origin.sender_user.id === ctx.from.id)) {
            await ctx.telegram.sendMessage(
                TO_CHANNEL_ID,
                `Forwarded by <a href="tg://user?id=${ctx.from.id}">${ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)}</a>`,
                {
                    disable_notification: true,
                    reply_parameters: {
                        message_id: msg.message_id
                    },
                    parse_mode: "HTML"
                }
            );
        }
    } else if (ctx.chat.id === TO_CHANNEL_ID) {
        const replyTo = ctx.message.reply_to_message;
        const origin = ctx.message.forward_origin;
        if (replyTo) {
            db.get("SELECT * FROM chats WHERE forwarded_from = ? OR forwarded_to = ?", [ replyTo.message_id, replyTo.message_id ], async (err, row) => {
                if (err) throw err;
                if (row) {
                    const msgId = replyTo.message_id === row.forwarded_from ? row.forwarded_to : row.forwarded_from;
                    let copied;
                    if (ctx.message.text) { // Text Message
                        copied = await ctx.telegram.sendMessage(FROM_CHANNEL_ID, `<a href="tg://user?id=${ctx.from.id}">${ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)}</a>: ${ctx.message.text.replace(/</g, "&lt;")}`, {
                            disable_notification: true,
                            reply_parameters: {
                                message_id: msgId
                            },
                            parse_mode: "HTML"
                        }).catch(() => null);
                    } else {
                        copied = await ctx.copyMessage(FROM_CHANNEL_ID, {
                            disable_notification: true,
                            reply_parameters: {
                                message_id: msgId
                            },
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Replied by " + (ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)),
                                            callback_data: "replied"
                                        }
                                    ]
                                ]
                            }
                        }).catch(() => null);
                    }
                    if (copied) {
                        db.run("INSERT INTO chats VALUES(?, ?)", [ ctx.message.message_id, copied.message_id ]);
                        return;
                    }
                }

                const forward = await ctx.telegram.forwardMessage(
                    FROM_CHANNEL_ID,
                    replyTo.chat.id,
                    replyTo.message_id,
                    {
                        disable_notification: true
                    }
                ).catch(() => null);
                if (!forward) return;

                db.run("INSERT INTO chats VALUES(?, ?)", [ replyTo.message_id, forward.message_id ]);

                const copied = await ctx.copyMessage(FROM_CHANNEL_ID, {
                    disable_notification: true,
                    reply_parameters: {
                        message_id: forward.message_id,
                        chat_id: forward.chat.id
                    },
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Replied by " + (ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)),
                                    callback_data: "replied"
                                }
                            ]
                        ]
                    }
                }).catch(() => null);
                if (copied) {
                    db.run("INSERT INTO chats VALUES(?, ?)", [ ctx.message.message_id, copied.message_id ]);
                }
            });
            return;
        }

        const msg = await ctx.forwardMessage(FROM_CHANNEL_ID, { disable_notification: true }).catch(() => null);
        if (!msg) return;

        db.run("INSERT INTO chats VALUES(?, ?)", [ ctx.message.message_id, msg.message_id ]);

        if (origin && !(origin.type === "user" && origin.sender_user.id === ctx.from.id)) {
            await ctx.telegram.sendMessage(
                FROM_CHANNEL_ID,
                `Forwarded by <a href="tg://user?id=${ctx.from.id}">${ctx.from.username ? ("@" + ctx.from.username) : (ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name)}</a>`,
                {
                    disable_notification: true,
                    reply_parameters: {
                        message_id: msg.message_id
                    },
                    parse_mode: "HTML"
                }
            );
        }
    }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));