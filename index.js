const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Welcome message for new users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const welcomeMessage = `
    Hello👋 ${firstName} 🥰babu

    WELCOME🙏TO VIVEKFY🎧AI BOT!🤖
    
    Please enter a 🎧song name or 
    enter a YouTube, Instagram, or Facebook 🔗URL to download or play audio/video
    `;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle song search queries
async function searchSongs(query) {
    try {
        const response = await axios.get(`https://svn-vivekfy.vercel.app/search/songs?query=${encodeURIComponent(query)}`);
        return response.data?.data?.results || [];
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
    const songs = await searchSongs(text);
    if (songs.length > 0) {
        bot.sendMessage(chatId, `Found ${songs.length} songs. Sending the list...`);
        
        for (const song of songs) {
            const songUrl = song.downloadUrl[1]?.link;

            if (songUrl) {
                const filePath = path.join(__dirname, `${song.name}.m4a`);
                await downloadAudio(songUrl, filePath);

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
            } else {
                bot.sendMessage(chatId, `Sorry, no downloadable URL found for the song: ${song.name}`);
            }
        }
    } else {
        bot.sendMessage(chatId, 'No songs found for your query.');
    }
});
