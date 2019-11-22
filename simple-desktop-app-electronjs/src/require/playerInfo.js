import { net } from 'electron';
import { TextDecoder } from 'text-encoding';

const API_KEY = '606A3C009F5F01E4D3C611CBB6C4642E';


function collectMatchDetails(status, matchResult) {

}

function getMatchDetails(matchId) {

    var request = net.request('http://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1??key=' + API_KEY + '&match_id=' + matchId);

    var promise = new Promise( (resolve, reject) => {
        request.on('response', (response) => {
            response.on('data', (data) => {

                var matchData;
                try {
                    matchData = JSON.parse(data);
                } catch (e) {
                    reject(e);
                }

                resolve(matchData)
            });
        });
        request.end();
    });
    return promise;
}

module.exports.getMatchesStats = function (playerId) {
    var countMatches= 2;

    var request = net.request('http://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1?key=' + API_KEY + '&account_id=' + playerId + '&matches_requested=' + countMatches + '&game_mode=1,2,3');
    var promise = new Promise( (resolve, reject) => {
        request.on('response', (response) => {
            response.on('data', (data) => {
                // console.dir(new TextDecoder("utf-8").decode(data));

                var matchesData;
                try {
                    matchesData = JSON.parse(data);
                    // matchesData = JSON.parse(JSON.stringify(new TextDecoder("utf-8").decode(data)));
                } catch (e) {
                    reject(e);
                }

                getMatchDetails(matchesData).then(function () {
                    resolve(matchesData);
                });
            });
        });
        request.end();
    });
    return promise;
};



module.exports.getWinLoseWith = function (playerId, currentPlayerId) {
    var winLose = {
        id : playerId,
        isCurrentPlayer : false,
        win : 0,
        lose : 0
    };

    if (currentPlayerId === playerId) {
        winLose.isCurrentPlayer = true;
        return Promise.resolve(winLose);
    } else {
        var request = net.request('https://api.opendota.com/api/players/' + currentPlayerId + '/wl?included_account_id=' + playerId);

        var promise = new Promise( (resolve, reject) => {
            request.on('response', (response) => {
                response.on('data', (data) => {

                    // console.dir(new TextDecoder("utf-8").decode(data));

                    var playerData;
                    try {
                        playerData = JSON.parse(data);
                    } catch (e) {
                        reject(e);
                    }

                    winLose.win = playerData.win;
                    winLose.lose = playerData.lose;

                    resolve(winLose);
                });
            });
            request.end();
        });
        return promise;
    }

};

module.exports.getInfo = function (id, currentPlayerId) {
    var playerId = id;
    var player = {
        pos : null,
        isCurrentPlayer : false,
        isHidden : true,
        id : id,
        name : null,
        avatar : null,
        plus : false,
        rankTier : null,
        rankStars : null,
        rankLeaderBoard : null,
        type : 'playerInfo'
    };


    var request = net.request('https://api.opendota.com/api/players/' + playerId);

    var promise = new Promise((resolve, reject) => {
        request.on('response', (response) => {
            response.on('data', (data) => {

                // console.dir(new TextDecoder("utf-8").decode(data));

                var playerData;
                try {
                    playerData = JSON.parse(data);
                } catch (e) {
                    reject(e);
                }
                if (playerId === currentPlayerId) {
                    player.isCurrentPlayer = true;
                }
                player.id = playerId;

                if (playerData.profile !== undefined ) {
                    player.isHidden = false;

                    player.name = playerData.profile.personaname;
                    player.avatar = playerData.profile.avatar;
                    player.plus = playerData.profile.plus;
                    if (playerData.rank_tier !== null) {
                        player.rankTier = Math.floor(playerData.rank_tier / 10) ;
                        player.rankStars = playerData.rank_tier % 10;
                    } else {
                        player.rankTier = 0;
                        player.rankStars = 0;
                    }

                    player.rankLeaderBoard = playerData.leaderboard_rank;
                } else {
                    player.name = 'Аноним';
                    player.avatar = 'ico/no-avatar.png';
                    player.rankTier = 0;
                    player.rankStars = 0;
                }
                resolve(player);
            });
        });

        request.end();
    });
    return promise;

};
