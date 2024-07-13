const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // To generate unique file names

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Store search results in memory
let searchResults = {};

// Welcome message for new users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const welcomeMessage = `
   kon saðŸŽ§gana sunoge  ${firstName} babu
 
    `;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle song search queries
async function searchSong(query) {
    try {
        const response = await axios.get(`https://svn-vivekfy.vercel.app/search/songs?query=${encodeURIComponent(query)}`);
        const songs = response.data?.data?.results || [];
        return songs;
    } catch (error) {
        console.error('Error fetching song data:', error);
        return [];
    }
}

// Download the audio file
async function downloadAudio(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Handle regular messages (not commands)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // Ignore messages that are commands (start with '/')
    if (text.startsWith('/')) return;

    // Check if the text is a URL
    const urlRegex = /https?:\/\/[^\s]+/;
    if (urlRegex.test(text)) {
        // Handle URL logic here (e.g., download or fetch details)
        bot.sendMessage(chatId, 'Processing your URL...');

        // Example: Send the URL as a response
        bot.sendMessage(chatId, `Here is your URL: ${text}`);
        return;
    }

    // Otherwise, treat it as a song search query
    const songs = await searchSong(text);
    if (songs.length > 0) {
        // Save search results in memory
        searchResults[chatId] = songs;

        // Create song list buttons
        const songButtons = songs.map((song, index) => {
            return [
                {
                    text: `${song.name}`, // Display only the song name
                    callback_data: `${chatId}_${index}`, // Unique callback data to identify the song
                }
            ];
        });

        const options = {
            reply_markup: {
                inline_keyboard: songButtons,
            },
        };

        bot.sendMessage(chatId, 'Select a song:', options);
    } else {
        bot.sendMessage(chatId, 'No songs found for your query.');
    }
});

// Handle song selection
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data.split('_');
    const chatId = data[0];
    const songIndex = data[1];

    // Fetch the song details from the saved search results
    const song = searchResults[chatId][songIndex];

    if (song) {
        const songUrl = song.downloadUrl[1]?.link; // Assuming the second link is audio
        if (songUrl) {
            const fileName = `${uuidv4()}.m4a`; // Unique file name to avoid conflicts
            const filePath = path.join(__dirname, fileName);

            try {
                await downloadAudio(songUrl, filePath);

                // Send the audio file to the user
                bot.sendAudio(message.chat.id, filePath, {
                    title: song.name,
                    performer: song.primaryArtists || 'Unknown Artist'
                });

                // Optionally, delete the file after sending it
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            } catch (error) {
                console.error('Error downloading or sending audio:', error);
                bot.sendMessage(message.chat.id, `Sorry, there was an error downloading the audio for: ${song.name}`);
            }
        } else {
            bot.sendMessage(message.chat.id, `Sorry, no downloadable URL found for the song: ${song.name}`);
        }
    } else {
        bot.sendMessage(message.chat.id, 'No song details found.');
    }
});
