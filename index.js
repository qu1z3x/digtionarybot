import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";
import fs from "fs";

import {
	sendDataAboutText,
	sendDataAboutButton,
	sendDataAboutError,
	sendDataAboutDataBase,
} from "./tgterminal.js";

import { config } from "./config.js";

const TOKEN = config.TOKENs[1];
const bot = new TelegramBot(TOKEN, { polling: true });

const qu1z3xId = "923690530";

let BotName = "digtionarybot";

let usersData = [];
let systemData = {
	feedbacksAllTime: 0,
	activityAllTime: 0,
};

bot.setMyCommands([
	{
		command: "/settings",
		description: "настройки ⚙️",
	},
	{
		command: "/menu",
		description: "мое меню ✍️",
	},
]);

let match, rndNum, textToSayHello;

async function firstMeeting(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	dataAboutUser.action = "firstMeeting";

	try {
		bot.sendChatAction(chatId, "typing");

		await bot.sendMessage(chatId, `привет-привет, <b>${dataAboutUser.login}!</b>`, {
			parse_mode: "HTML",
			disable_web_page_preview: true,
		});

		bot.sendChatAction(chatId, "typing");

		setTimeout(() => {
			bot.sendMessage(
				chatId,
				`<b>проверч́ик на связи! </b>\n\nэта <b>«ч́»</b> цепляет, согласись? 🤗`,
				{
					parse_mode: "HTML",
					disable_web_page_preview: true,
				}
			);
		}, 2000);

		bot.sendChatAction(chatId, "typing");

		setTimeout(async () => {
			await bot.sendMessage(chatId, "ㅤ", {}).then((message) => {
				dataAboutUser.messageId = message.message_id;
			});

			menu(chatId);
		}, 4500);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function menu(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	const dateNowHHNN = new Date().getHours() * 100 + new Date().getMinutes();

	if (dateNowHHNN < 1200 && dateNowHHNN >= 600) textToSayHello = "доброе утро";
	else if (dateNowHHNN < 1700 && dateNowHHNN >= 1200) textToSayHello = "добрый день";
	else if (dateNowHHNN < 2200 && dateNowHHNN >= 1700) textToSayHello = "добрый вечер";
	else if (dateNowHHNN >= 2200 || dateNowHHNN < 600) textToSayHello = "доброй ночи";

	dataAboutUser.action = "menu";

	try {
		await bot.editMessageMedia(
			{
				type: "photo",
				media: "AgACAgIAAxkBAAIC62hVL3h8BbSC3PAakQNFvwh8ayRPAAKv-jEb_aKxShkwkJpyG6dzAQADAgADcwADNgQ",
				caption: `<b>${dataAboutUser.login}, я готов!</b>\n\n<blockquote><i>сделаю грамотным тебя..\nи любое твоё сообщение!)</i></blockquote>\n\n<b>жду твой текст ниже 👇</b>`,
				parse_mode: "HTML",
			},
			{
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId).messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[
							{ text: `поддержка 💭`, callback_data: `supportMenu0` },
							{ text: `настройки ⚙️`, callback_data: `settings` },
						],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function explanation(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		dataAboutUser.action = "explanation";

		const currentSession = dataAboutUser.currentSession;
		const response = dataAboutUser.currentSession.response;

		await bot.editMessageText(
			`${
				response.isCorrect
					? `<b>✅ все написано верно!</b>`
					: `<b>❌ написано неверно(\n\n👌правильно так:</b>\n<blockquote><i>${
							response.corrected ? response.corrected : `что-то неясное.. 😮`
					  }</i></blockquote>${
							currentSession.explanationLevel >= 1
								? `\n\n<b>👀 пояснение:</b>\n<i>${response.explanation}</i>${
										currentSession.explanationLevel >= 2
											? `\n\n<b>💡пример:</b>\n<blockquote><i>• «${response.example}»</i></blockquote>\n\n<a href="https://t.me/${BotName}/?start=supportMenu1">проблема?</a>`
											: ``
								  }`
								: ``
					  }`
			}`,
			{
				parse_mode: "html",
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId).messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: !response.isCorrect
									? currentSession.explanationLevel == 0
										? `показать объяснение 👀`
										: currentSession.explanationLevel == 1
										? `привести пример💡`
										: `проверч́ик все пояснит)`
									: `проверч́ик все пояснит)`,
								callback_data: `setExplanationLevel`,
							},
						],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function supportMenu(chatId, stageNum = 1) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		await bot.editMessageMedia(
			{
				type: "photo",
				media: "AgACAgIAAxkBAAIC6mhVLz9QFnAnJ1hF-ak3ooPXQYJuAAJN7zEbSs6wSk8BIe5qqZ6gAQADAgADcwADNgQ",
				caption: `${
					stageNum == 0
						? `ты всегда можешь <b>обратиться к нам</b>`
						: stageNum == 1
						? `да.. <b>я не совершенен(.. извини.. 😣</b>\n\nили это <i>МАСШТАБНАЯ</i> проблема? 😮`
						: ``
				}\n\n<b>пиши по любому вопросу 😉</b>`,
				parse_mode: "HTML",
			},
			{
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId).messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[{ text: `связаться (всегда ответим) 💭`, url: `https://t.me/qu1z3x` }],
						[
							{
								text: dataAboutUser.action != "explanation" ? `👈 назад` : "",
								callback_data: dataAboutUser.action,
							},
						],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function settings(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	if (dataAboutUser.action != "editLogin") dataAboutUser.action = "settings";

	try {
		await bot.editMessageMedia(
			{
				type: "photo",
				media: "AgACAgIAAxkBAAIDgmhaNhyAgNiYaSFGR3HTLxGOc06KAAKu-TEb7JXRSugtR_CaN_8AAQEAAwIAA3kAAzYE",
				caption: `<b>👤 Профиль:</b>\n<blockquote><b>•</b> твое имя: ${
					dataAboutUser.action == "editLogin"
						? `... <a href="https://t.me/${BotName}/?start=stopEditLogin">❌</a>`
						: `<b>${dataAboutUser.login} <a href="https://t.me/${BotName}/?start=editLogin">✏️</a></b>`
				}\n<b>•</b> ты со мной <b>c ${
					dataAboutUser.registrationDate
				}</b></blockquote>\n\n<b>🛠️ Модификации:</b>\n<blockquote><b>•</b> уровень проверки: ${
					dataAboutUser.explanationLevel == 0
						? `<b>«ответ и все»</b>\n(просто - верно или неверно)`
						: dataAboutUser.explanationLevel == 1
						? `<b>«объясняя»</b>\n(еще скажу по какому правилу)`
						: dataAboutUser.explanationLevel == 2
						? `<b>«душнила»</b>\n(и еще приведу пример)`
						: ``
				}</blockquote>\n\n<b>нажимай для изменения 👇</b>`,
				parse_mode: "HTML",
			},
			{
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId).messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: `уровень: «${
									dataAboutUser.explanationLevel == 0
										? `ответ и все`
										: dataAboutUser.explanationLevel == 1
										? `объясняя`
										: dataAboutUser.explanationLevel == 2
										? `душнила`
										: ``
								}» 🔃`,
								callback_data: `setExplanationLevel`,
							},
						],
						[
							{ text: `👈 назад`, callback_data: `exit` },
							{ text: `от digfusion`, url: `https://t.me/digfusion` },
						],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function getResponse(chatId, request = null, thinkingMessage = true) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		if (thinkingMessage) {
			const thinkingMessageVariations = [
				"перелистываю грамматические справочники.. 📚",
				"выискиваю правило в толковых словарях.. 🧐",
				"сравниваю с нормами русского языка.. ✍️",
				"перепроверяю на сложных примерах.. 🧐",
				"перечитываю академические примеры.. 🔍",
				"проверяю с экспертами ЕГЭ.. 🧠",
				"ищу здесь подвох.. 🌀",
				"внимательно перечитываю сообщение.. 👀",
				"шарю по архивам грамматической базы.. 🗂️",
				"достаю из глубин памяти все правила.. 🕵️",
			];

			rndNum = Math.floor(Math.random() * thinkingMessageVariations.length);

			await bot
				.sendMessage(chatId, `<b>${thinkingMessageVariations[rndNum]}</b>`, {
					parse_mode: "HTML",
					disable_web_page_preview: true,
					reply_to_message_id: dataAboutUser.currentSession.replyingMessageId,
				})
				.then((message) => {
					dataAboutUser.messageIdOther = message.message_id;
				});
		}

		bot.sendChatAction(chatId, "typing");

		const url = "https://openrouter.ai/api/v1/chat/completions";
		const headers = {
			Authorization: `Bearer ${config.metaKey}`, // API ключ с сайта
			"Content-Type": "application/json",
		};

		const payload = {
			model: "meta-llama/llama-4-maverick",
			messages: [
				{
					role: "system", // системный промпт
					content: "❗НИЧЕГО КРОМЕ ОТВЕТА JSON РАЗМЕТКОЙ!!!",
				},
				{
					role: "user", // запрос пользователя
					content: `Проанализируй текст по нормам современного русского языка:

"${request.replaceAll(/<\/?[a-z]+>/gi, "")}"

🔍 Что нужно:
Проверь только реальные ошибки — орфография, пунктуация, грамматика, синтаксис.  
❗️Не трогай стилистику, оформление, разговорный стиль, отсутствие точки, строчные буквы, "е" вместо "ё" — это всё норм.

✍️ В объяснении:
— Если ошибок несколько — нумеруй правила (1, 2, 3...)  
— Пиши в том же вайбе, что и юзер: на *"ты"*, без загонов, по-человечески, но точно  
— Будь кратким, пиши строго по делу  
— Ссылайся на конкретные места текста

🧱 В исправленном тексте:
— Полностью сохрани структуру оригинала (абзацы, пробелы, переносы)

📌 Если тема интимная, странная или дикая — плевать, просто проверь грамотность. Смысл не важен, только форма.

📎 В "example":
— Один короткий пример (до 12 слов), который показывает ВСЕ ошибки из "explanation"

‼️ Ответ строго в этом формате (JSON, без лишнего текста):

{
  "isCorrect": true или false,
  "corrected": "", // исправленный текст, если есть ошибки
  "explanation": "", // нумерованный разбор ошибок по правилам
  "example": "" // пример, иллюстрирующий все ошибки
}

📌 Правила:
- Если isCorrect = true — остальные поля пустые, но JSON-структура сохраняется
- Если isCorrect = false — все поля обязательны
- Никакого лишнего текста. Только чистый JSON. Всё.`,
				},
			],
		};

		let response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});

		const data = await response.json();

		response = data.choices[0].message.content
			.replaceAll("```", "")
			.replaceAll("json", "")
			.replaceAll("JSON", "")
			.replaceAll(/\【.*?】/g, "")
			.replaceAll(/<\/?[a-z]+>/gi, "")
			.replaceAll("<", "")
			.replaceAll(">", "")
			.replaceAll("/", "");

		if (JSON.parse(response)) {
			response = JSON.parse(response);

			if (thinkingMessage)
				try {
					await bot.deleteMessage(chatId, dataAboutUser.messageIdOther);
				} catch (error) {}

			return response;
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}\n\n❗GPT_ERROR`);

		if (thinkingMessage)
			try {
				await bot.deleteMessage(chatId, dataAboutUser.messageIdOther);
			} catch (error) {}

		await bot.sendMessage(
			chatId,
			`видимо я потерял <b>толковый словарь С.И. Ожегова,</b> извини(.. 😣\n\n<b>ты можешь связаться с нами 👇</b>`,
			{
				parse_mode: "HTML",
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[{ text: `связаться (всегда ответим) 💭`, url: `https://t.me/qu1z3x` }],
					],
				},
			}
		);

		return null;
	}
}

async function digfusionInfo(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		await bot.editMessageText(
			`<i><b>это приложение разработано digfusion</b> 🤍</i>\n\n<b>Привет!👋\nЭто digfusion — создаем мощнейших Telegram-ботов под ключ</b>\n\n<blockquote>Быстро, надежно и с умом. Нам доверяют <b>известные личности,</b> и мы делаем продукт, который <b>цепляет и приносит результат 🚀</b></blockquote>\n\n<b><a href="https://t.me/digfusionbot">Услуги</a> • <a href="https://t.me/digfeedbacks">Отзывы</a> • <a href="https://t.me/qu1z3x">Связь</a></b>`,
			{
				parse_mode: "html",
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId).messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: "telegram канал 📣",
								url: "https://t.me/digfusion",
							},
						],
						[
							{ text: "👈 назад", callback_data: "settings" },
							{
								text: "связаться 💭",
								url: "https://t.me/qu1z3x",
							},
						],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function StartAll() {
	if (TOKEN == config.TOKENs[1]) BotName = "digtionarybot";
	if (TOKEN == config.TOKENs[0]) BotName = "digtestingbot";

	let dataFromDB = fs.readFileSync("DB.json");

	if (dataFromDB != "" && dataFromDB != "[]") {
		dataFromDB = JSON.parse(dataFromDB);

		usersData = dataFromDB.usersData || [];
		systemData = dataFromDB.systemData || [];
	}

	bot.on("photo", async (message) => {
		console.log(message);
	});

	bot.on("text", async (message) => {
		const chatId = message.chat.id;
		let text = message.text;

		let dataAboutUser = usersData?.find((obj) => obj.chatId == chatId);

		try {
			if (!dataAboutUser) {
				usersData.push({
					chatId: chatId,
					login: message.from.first_name,

					currentSession: {
						response: {},
						explanationLevel: 0,
						replyingMessageId: null,
					},

					explanationLevel: 0,

					messageId: null,
					action: null,

					messageIdOther: null,
					telegramFirstName: message.from.first_name,
					supportiveCount: 1,
					registrationDate: `${new Date().getDate().toString().padStart(2, "0")}.${(
						new Date().getMonth() + 1
					)
						.toString()
						.padStart(2, "0")}.${(new Date().getFullYear() % 100)
						.toString()
						.padStart(2, "0")}`,
					date: new Date(),
				});

				dataAboutUser = usersData.find((obj) => obj.chatId == chatId);
			}
			if (dataAboutUser) {
				if (Array.from(text)[0] != "/") {
					if (dataAboutUser.action == "editLogin") {
						dataAboutUser.login = text;

						dataAboutUser.action = "settings";

						bot.deleteMessage(chatId, message.message_id);

						settings(chatId, true, true);
					} else {
						const currentSession = dataAboutUser.currentSession;

						currentSession.explanationLevel = dataAboutUser.explanationLevel;

						currentSession.replyingMessageId = message.message_id;

						currentSession.response = await getResponse(chatId, text);

						if (currentSession.response) {
							await bot
								.sendMessage(chatId, "ㅤ", {
									reply_to_message_id: currentSession.replyingMessageId,
								})
								.then((message) => {
									dataAboutUser.messageId = message.message_id;
								});

							explanation(chatId);
						}
					}
				}

				if (Array.from(text)[0] == "/") {
					if (text.includes("/start supportMenu")) {
						match = text.match(/^\/start supportMenu(.*)$/);

						await bot.sendMessage(chatId, "ㅤ").then((message) => {
							dataAboutUser.messageId = message.message_id;
						});

						supportMenu(chatId, parseInt(match[1]));
					}

					switch (text) {
						case "/restart":
						case "/start":
							if (dataAboutUser.action != "explanation")
								try {
									bot.deleteMessage(chatId, dataAboutUser.messageId);
								} catch (error) {}

							firstMeeting(chatId, 1);
							break;
						case "/menu":
							if (dataAboutUser.action != "explanation")
								try {
									bot.deleteMessage(chatId, dataAboutUser.messageId);
								} catch (error) {}

							await bot.sendMessage(chatId, "ㅤ").then((message) => {
								dataAboutUser.messageId = message.message_id;
							});

							menu(chatId);
							break;
						case "":
							break;
						case "/settings":
							if (dataAboutUser.action != "explanation")
								try {
									bot.deleteMessage(chatId, dataAboutUser.messageId);
								} catch (error) {}

							await bot.sendMessage(chatId, "ㅤ").then((message) => {
								dataAboutUser.messageId = message.message_id;
							});

							settings(chatId);
							break;
						case "":
							break;

						case "/start editLogin":
							dataAboutUser.action = "editLogin";

							settings(chatId);
							break;
						case "/start stopEditLogin":
							dataAboutUser.action = "menu";

							settings(chatId);
							break;

						case "":
							break;
						case "":
							break;
						case "/data":
							if (chatId == qu1z3xId) {
								const dataToSend = {
									usersData,
									systemData,
								};
								sendDataAboutDataBase(dataToSend);
							}
							break;

						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
					}

					bot.deleteMessage(chatId, message.message_id);
				}
			}

			if (chatId != qu1z3xId) {
				sendDataAboutText(chatId, dataAboutUser.login, text);
			}
		} catch (error) {
			console.log(error);
			sendDataAboutError(chatId, dataAboutUser?.login, `${String(error)}`);
		}
	});

	bot.on("callback_query", async (query) => {
		const chatId = query.message.chat.id;
		const data = query.data;

		let dataAboutUser = usersData?.find((obj) => obj.chatId == chatId);

		if (!dataAboutUser) {
			usersData.push({
				chatId: chatId,
				login: query.from.first_name,

				currentSession: {
					response: {},
					explanationLevel: 0,
					replyingMessageId: null,
				},

				explanationLevel: 0,

				messageId: null,
				action: null,

				messageIdOther: null,
				telegramFirstName: query.from.first_name,
				supportiveCount: 1,
				registrationDate: `${new Date().getDate().toString().padStart(2, "0")}.${(
					new Date().getMonth() + 1
				)
					.toString()
					.padStart(2, "0")}.${(new Date().getFullYear() % 100)
					.toString()
					.padStart(2, "0")}`,
				date: new Date(),
			});

			dataAboutUser = usersData.find((obj) => obj.chatId == chatId);
		}

		if (dataAboutUser) {
			try {
				if (!dataAboutUser.inBlackList) {
					if (query.message.message_id == dataAboutUser.messageIdOther) {
						try {
							bot.deleteMessage(chatId, dataAboutUser.messageIdOther);
						} catch (error) {}

						dataAboutUser.messageIdOther = null;

						await bot.sendMessage(chatId, "ㅤ").then((message) => {
							dataAboutUser.messageId = message.message_id;
						});
					} else dataAboutUser.messageId = query.message.message_id;

					if (data.includes("supportMenu")) {
						match = data.match(/^supportMenu(.*)$/);

						supportMenu(chatId, parseInt(match[1]));
					}

					switch (data) {
						case "exit":
						case "menu":
							menu(chatId);
							break;
						case "setExplanationLevel":
							switch (dataAboutUser.action) {
								case "settings":
									if (dataAboutUser.explanationLevel < 2) {
										++dataAboutUser.explanationLevel;
									} else if (dataAboutUser.explanationLevel >= 2) {
										dataAboutUser.explanationLevel = 0;
									}
									settings(chatId);
									break;
								case "explanation":
									if (
										!dataAboutUser.currentSession.response.isCorrect &&
										dataAboutUser.currentSession.explanationLevel < 2
									) {
										++dataAboutUser.currentSession.explanationLevel;
										explanation(chatId);
									}

									break;
							}
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "settings":
							settings(chatId);
							break;
						case "":
							break;
						case "":
							break;
						case "digfusionInfo":
							digfusionInfo(chatId);
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "":
							break;
						case "deleteexcess":
							try {
								bot.deleteMessage(chatId, query.message.message_id);
							} catch (error) {}
							break;
					}
				}

				if (chatId != qu1z3xId) {
					sendDataAboutButton(chatId, dataAboutUser.login, data);
				}

				// fs.writeFileSync(
				// 	"DB.json",
				// 	JSON.stringify({ usersData: usersData,
				// systemData: systemData, }, null, 2)
				// );
			} catch (error) {
				console.log(error);
				sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
			}
		}
	});

	cron.schedule(`0 */1 * * *`, function () {
		// Запись данных в базу данных
		try {
			if (TOKEN == config.TOKENs[1]) {
				fs.writeFileSync(
					"DB.json",
					JSON.stringify(
						{
							usersData: usersData,
						},
						null,
						2
					)
				);

				if (new Date().getHours() % 12 == 0)
					sendDataAboutDataBase({
						usersData: usersData,
						systemData: systemData,
					});
			}
		} catch (error) {}
	});
}

StartAll();
