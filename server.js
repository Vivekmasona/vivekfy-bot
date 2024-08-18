const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';

// URL of your Glitch project
const glitchProjectUrl = 'https://chipped-tourmaline-mockingbird.glitch.me/';

// Function to keep Glitch project active
const keepGlitchActive = () => {
    axios.get(glitchProjectUrl)
        .then(response => {
            console.log('Pinged Glitch project to keep it active.');
        })
        .catch(error => {
            console.error('Error pinging Glitch project:', error);
        });
};

// Ping the Glitch project URL every 5 minutes (300,000 milliseconds)
setInterval(keepGlitchActive, 300000);

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Welcome message for new users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const welcomeMessage = `
    Hello👋 ${firstName} 🥰babu

    WELCOME🙏TO VIVEKFY🎧AI BOT!🤖
    
    Please enter a song name or URL to process
    `;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Function to search songs
async function searchSongs(query) {
    try {
        const response = await axios.get(`https://svn-vivekfy.vercel.app/search/songs?query=${encodeURIComponent(query)}`);
        return response.data?.data?.results || [];
    } catch (error) {
        console.error('Error fetching song data:', error);
        return [];
    }
}

// Function to get audio stream
async function getStream(url) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching audio stream:', error);
        throw error;
    }
}

// Handle regular messages (not commands)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const text = msg.text.trim();

    // Ignore messages that are commands (start with '/')
    if (text.startsWith('/')) return;

    // Check if the text is a URL
    const urlRegex = /https?:\/\/[^\s]+/;
    if (urlRegex.test(text)) {
        bot.sendMessage(chatId, 'Processing your URL...');

        try {
            // Combine API URL with the user-provided URL
            const apiUrl = `https://vivekfy.vercel.app/api?url=${encodeURIComponent(text)}`;

            // Create the download button with the API URL
            const downloadButton = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Download Now', url: apiUrl }]
                    ]
                }
            };

            // Send the button with the combined URL
            await bot.sendMessage(chatId, 'Click the button below to download:', downloadButton);

        } catch (error) {
            console.error('Error processing URL:', error);
            bot.sendMessage(chatId, 'Failed to process the URL.');
        }

        // Delete the user's query message
        await bot.deleteMessage(chatId, messageId);

        return;
    }

    // Treat text as a song search query
    const songs = await searchSongs(text);
    if (songs.length > 0) {
        const foundMessage = await bot.sendMessage(chatId, `Found ${songs.length} songs. Sending the list...`);

        for (const song of songs) {
            const songUrl = song.downloadUrl[1]?.link;

            if (songUrl) {
                const songMessage = `
*${song.name}*
_${song.primaryArtists || 'Unknown Artist'}_
`;

                try {
                    // Get audio stream
                    const audioStream = await getStream(songUrl);

                    // Send the poster with caption
                    await bot.sendPhoto(chatId, song.image[2]?.link, {
                        caption: songMessage,
                        parse_mode: 'Markdown'
                    });

                    // Send the audio stream
                    await bot.sendAudio(chatId, audioStream, {
                        title: song.name,
                        performer: song.primaryArtists || 'Unknown Artist'
                    });
                } catch (error) {
                    console.error('Error sending audio:', error);
                    bot.sendMessage(chatId, `Sorry, couldn't send the audio for the song: ${song.name}`);
                }
            } else {
                bot.sendMessage(chatId, `Sorry, no downloadable URL found for the song: ${song.name}`);
            }
        }

        // Delete the "Found X songs. Sending the list..." message
        await bot.deleteMessage(chatId, foundMessage.message_id);
    } else {
        bot.sendMessage(chatId, 'No songs found for your query.');
    }
});

// Handle /hack command
bot.onText(/\/hack/, async (msg) => {
    const chatId = msg.chat.id;
    const url = 'https://steady-cooperative-chiller.glitch.me/';
    bot.sendMessage(chatId, `Here is the URL you requested: ${url}`);
});

// Handle /hacking command
bot.onText(/\/hacking/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const response = await axios.get('https://steady-cooperative-chiller.glitch.me/images');
        const imageUrls = response.data.images;

        if (imageUrls.length > 0) {
            for (const imageUrl of imageUrls) {
                await bot.sendPhoto(chatId, imageUrl);
            }
        } else {
            bot.sendMessage(chatId, 'No images found.');
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        bot.sendMessage(chatId, 'Failed to fetch images.');
    }
});
