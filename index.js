const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // To generate unique file names

// Replace with your actual bot token
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Welcome message for new users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const welcomeMessage = `
    Hello👋 ${firstName} 🥰babu

    WELCOME🙏TO VIVEKFY🎧AI BOT!🤖

    Please enter a 🎧song name to play
    `;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle song search queries
async function searchSong(query) {
    try {
        const response = await axios.get(`https://svn-vivekfy.vercel.app/search/songs?query=${encodeURIComponent(query)}`);
        const songs = response.data?.data?.results || [];
        return songs.length > 0 ? songs[0] : null;
    } catch (error) {
        console.error('Error fetching song data:', error);
        return null;
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
    const song = await searchSong(text);
    if (song) {
        bot.sendMessage(chatId, `Found song: ${song.name} by ${song.primaryArtists}`);

        const songUrl = song.downloadUrl[1]?.link; // Assuming the second link is audio
        if (songUrl) {
            const fileName = `${uuidv4()}.m4a`; // Unique file name to avoid conflicts
            const filePath = path.join(__dirname, fileName);

            try {
                await downloadAudio(songUrl, filePath);

                // Send the audio file to the user
                bot.sendAudio(chatId, filePath, {
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
                bot.sendMessage(chatId, `Sorry, there was an error downloading the audio for: ${song.name}`);
            }
        } else {
            bot.sendMessage(chatId, `Sorry, no downloadable URL found for the song: ${song.name}`);
        }
    } else {
        bot.sendMessage(chatId, 'No songs found for your query.');
    }
});
