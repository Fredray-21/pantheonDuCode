# botDiscord

This is a bot for Discord that can play the minigame.

## Mini-game: 
- **/shifoumi** 
- **/guessflags**
- **/hangman**
- **/puissance4**
- **/rouletterusse**
- **/tictactoe**

## other commands:
- **/ping**
- **/eval** (only for the owner of the bot)

## Join the bot to your server:

Link of the bot [link here](https://discord.com/oauth2/authorize?client_id=1297584486393057331&permissions=8&integration_type=0&scope=bot) or follow the instructions below to run it locally.

### How to run the bot locally:
Create a .env file in the root directory of the project and add the following content:
```
BOT_TOKEN=REPLACE_WITH_BOT_TOKEN
STATUSBOT="BOT IS ONLIIIINE!!!!"
```
#### Sample .env file in .env.template

### How to get the bot token:
- Go to the [Discord Developer Portal](https://discord.com/developers/applications)
- Create a new application
- Go to the Bot tab
- Click on the "Add Bot" button
- Copy the token and paste it in the .env file
- !! Check the "Presence Intent" in the "Server Members Intent" section
- Go to the OAuth2 tab
- In the "OAuth2 URL Generator" section, select the "bot" scope
- Copy the generated URL and paste it in your browser
- Select the server where you want to add the bot
- Click on the "Authorize" button
- The bot should now be in your server
- Run the bot with the command `npm run all`



# RELEASES
- **_[26/10/2024]_**
    - Implement the bot logic for the minigame.