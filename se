const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // To generate unique file names

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// URL of your Repl.it project
const replProjectUrl = 'https://replit.com/@vivekkumarmason/vfybot1?v=1';

// Function to keep Repl.it project active
const keepReplActive = () => {
    axios.get(replProjectUrl)
        .then(response => {
            console.log('Pinged Repl.it project to keep it active.');
        })
        .catch(error => {
            console.error('Error pinging Repl.it project:', error);
        });
};

// Ping the Repl.it project URL every 2 minutes (120,000 milliseconds)
setInterval(keepReplActive, 120000);

// Welcome message for new users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const welcomeMessage = `
    Hello ${firstName}! Welcome to the Music Bot.

    Please enter a song name or a YouTube URL to play.
    `;
    bot.sendMessage(chatId, welcomeMessage);
});

// Function to search for a song by name
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

// Function to fetch YouTube video info
async function fetchYouTubeInfo(url) {
    try {
        const apiUrl = `https://vivekplay.vercel.app/api/info?url=${url}`;
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching YouTube info:', error);
        return null;
    }
}

// Function to download audio from a URL and send it as an audio message
async function downloadAndSendAudio(chatId, url, title, artist) {
    const fileId = uuidv4();
    const filePath = path.resolve(__dirname, `${fileId}.m4a`);

    try {
        // Download audio
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);

        // Send audio message
        writer.on('finish', () => {
            bot.sendAudio(chatId, filePath, {
                title: title || 'Unknown Title',
                performer: artist || 'Unknown Artist'
            }).then(() => {
                // Delete the file after sending
                fs.unlinkSync(filePath);
            }).catch(err => {
                console.error('Error sending audio:', err);
            });
        });

        writer.on('error', (err) => {
            console.error('Error downloading audio:', err);
            bot.sendMessage(chatId, 'Failed to download audio.');
        });
    } catch (error) {
        console.error('Error downloading or sending audio:', error);
        bot.sendMessage(chatId, 'Failed to download audio.');
    }
}

// Handle incoming messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // Ignore messages that are commands (start with '/')
    if (text.startsWith('/')) return;

    // Check if the text is a YouTube URL
    const youtubeUrlRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (youtubeUrlRegex.test(text)) {
        bot.sendMessage(chatId, 'Processing your YouTube URL...');
        const youTubeInfo = await fetchYouTubeInfo(text);

        if (youTubeInfo) {
            const formats = youTubeInfo.formats;
            const title = youTubeInfo.title;
            const artist = youTubeInfo.artist || youTubeInfo.uploader;

            // Find the format_id 140 URL (assuming it's the audio format)
            const audioFormat = formats.find(format => format.format_id === '140');

            if (audioFormat && audioFormat.url) {
                // Download and send audio
                downloadAndSendAudio(chatId, audioFormat.url, title, artist);
            } else {
                bot.sendMessage(chatId, 'Failed to retrieve audio URL for format_id 140.');
            }
        } else {
            bot.sendMessage(chatId, 'An error occurred while fetching YouTube info.');
        }
        return;
    }

    // Otherwise, treat it as a song search query
    const song = await searchSong(text);
    if (song) {
        bot.sendMessage(chatId, `Found song: ${song.name} by ${song.primaryArtists}`);

        const songUrl = song.downloadUrl[1]?.link; // Assuming the second link is audio
        if (songUrl) {
            // Download and send audio
            downloadAndSendAudio(chatId, songUrl, song.name, song.primaryArtists);
        } else {
            bot.sendMessage(chatId, `Sorry, no downloadable URL found for the song: ${song.name}`);
        }
    } else {
        bot.sendMessage(chatId, 'No songs found for your query.');
    }
});
