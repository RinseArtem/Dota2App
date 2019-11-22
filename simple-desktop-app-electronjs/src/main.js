import { app, BrowserWindow, dialog, ipcMain  } from 'electron';
var d2gsi  = require('dota2-gsi');
const fs = require('fs');
const storage = require('electron-json-storage');
var regedit = require('regedit');

// My
var gameInfo = require('./require/gameInfo');
var player = require('./require/playerInfo');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        minWidth: 1000,
        height: 750,
        minHeight: 600,
        titleBarStyle: 'customButtonsOnHover',
        frame: false
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/main.html`);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
};




var userFolderPath = app.getPath('home');
storage.setDataPath(userFolderPath + '\\AppData\\Roaming\\Dota2App'); // Устанавливаем директорию для хранения данных


function start(isError = false) {
    storage.get('settings', function (error, data) {
        if (error || !data.dotaPath) {
            var options = {
                type: 'info',
                buttons: ['Выбрать'],
                title: 'Путь к Dota 2',
                message: 'Не найден путь к игре',
                detail: 'Чтобы продлжить, установите путь к папке Dota 2',
            };
            if (isError) {
                options = {
                    type : 'error',
                    title: 'Ошибка',
                    message: 'Выбран не верный путь к игре!',
                    detail: 'Чтобы продлжить, установите путь к папке Dota 2',
                }
            }

            dialog.showMessageBox(null, options, () => {
                var json = {};

                json.dotaPath = dialog.showOpenDialog(mainWindow, {
                    properties: ['openDirectory']
                });
                if (fs.existsSync(json.dotaPath + '\\game' && json.dotaPath + '\\game\\dota')) {
                    storage.set('settings', json, function (error) {
                        if (error) throw error;
                        start();
                    });
                } else {
                    start(true)
                }

            });
        } else {
            var dotaPath = data.dotaPath;

            if (!fs.existsSync(dotaPath + '\\game' && dotaPath + '\\game\\dota')) {
                storage.clear(function(error) {
                    if (error) throw error;
                });
                start(true);

            } else {
                fs.copyFile('./src/cfg/gamestate_integration_dotaapp.cfg', data.dotaPath + '\\game\\dota\\cfg\\gamestate_integration\\gamestate_integration_dotaapp.cfg', (err) => {
                    if (err) throw err;
                });

                var server = new d2gsi();

                fs.writeFileSync(dotaPath + '\\game\\dota\\server_log.txt', '');

                server.events.on('newclient', function (client) {
                    console.log("New client connection, IP address: " + client.ip);


                    client.on('player:activity', function (activity) {
                        if (activity == 'playing') console.log("Game started!");

                        fs.readFile(dotaPath + '\\game\\dota\\server_log.txt', 'utf8', function (error, data) {
                            if (error) throw error; // если возникла ошибка

                            var game = data.split('\r')[0];
                            regedit.list('HKCU\\Software\\Valve\\Steam\\ActiveProcess\\', function (error, result) {
                                if (error) throw error;
                                var currentUser = result['HKCU\\Software\\Valve\\Steam\\ActiveProcess\\']['values']['ActiveUser']['value'];

                                // var parsedData = gameInfo.parseThatShit(game);

                                var parsedData = gameInfo.parseThatShit('11/07/2019 - 15:35:26: loopback:1 (Lobby 26392199046082426 DOTA_GAMEMODE_TURBO 0:[U:1:143697406] 1:[U:1:154212144] 2:[U:1:1034418817] 3:[U:1:875868609] 4:[U:1:68627766] 5:[U:1:904732354] 6:[U:1:184272417] 7:[U:1:123656341] 8:[U:1:121362049] 9:[U:1:376201872]) (Party 26392199030494279 0:[U:1:123656341] 1:[U:1:121362049])');
                                var players = parsedData.lobbyPlayers;
                                // TODO request apis
                            });
                            fs.writeFileSync(dotaPath + '\\game\\dota\\server_log.txt', '');
                        });
                    });
                    client.on('hero:level', function (level) {
                        console.log("Now level " + level);
                    });
                    client.on('abilities:ability0:can_cast', function (can_cast) {
                        if (can_cast) console.log("Ability0 off cooldown!");
                    });
                    client.on('player:team0:player0:steamid', function (id) {
                        console.log("SteamId:" + id);
                    });

                });
            }
        }
    });
}



function sendData(title, data) {
    var sendData = {};
    sendData[title] = data;
    mainWindow.webContents.send('info', sendData);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow();

    mainWindow.webContents.once('dom-ready', () => {
        var parsedData = gameInfo.parseThatShit('11/07/2019 - 15:35:26: loopback:1 (Lobby 26392199046082426 DOTA_GAMEMODE_TURBO 0:[U:1:143697406] 1:[U:1:154212144] 2:[U:1:1034418817] 3:[U:1:875868609] 4:[U:1:68627766] 5:[U:1:904732354] 6:[U:1:184272417] 7:[U:1:123656341] 8:[U:1:121362049] 9:[U:1:376201872]) (Party 26392199030494279 0:[U:1:123656341] 1:[U:1:121362049])');
        var playerIds = parsedData.lobbyPlayers;

        sendData('playersList', playerIds);

        mainWindow.webContents.on('did-finish-load', () => {
            var playerPromises = playerIds.map(function (id, i) {
                var promises = Promise.all([
                    player.getInfo(id, 123656341),
                    player.getWinLoseWith(id, 123656341),
                    player.getMatchesStats(id)
                ]);
                promises.then(function (results) {
                    var playerInfo = results[0];
                    var winLose = results[1];
                    // console.log(results[2]);

                    console.log('PI:' + playerInfo);
                    console.log('WL:' + winLose);

                    playerInfo.pos = i + 1;
                    mainWindow.webContents.send('info', playerInfo);
                    mainWindow.webContents.send('wl', winLose)
                });
                return promises;
            });

            Promise.all(playerPromises).then(function (playerInfos) {

            });

        });


        start();
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
