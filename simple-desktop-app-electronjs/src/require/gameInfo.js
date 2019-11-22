const matchAll = require('string.prototype.matchall');
matchAll.shim();

module.exports.parseThatShit = function (s) {
    let matches = s.matchAll('(\\d+)/(\\d+)/(\\d+) - (\\d+):(\\d+):(\\d+): (?:=\\[\\w:\\d:\\d+:\\d+\\]|loopback:1) \\(Lobby (\\d+) (\\w+) ((?:\\s?\\d:\\[\\w:\\d:(?:\\d+)\\])+)\\) ?\\(Party (\\d+) ((?:\\s?\\d:\\[\\w:\\d:(?:\\d+)\\])+)\\)?');
    for (let match of matches) {
        matches = match;
    }
    return {
        d: matches[1],
        m: matches[2],
        y: matches[3],
        h: matches[4],
        i: matches[5],
        s: matches[6],
        lobbyId: matches[7],
        gameMode: matches[8],
        lobbyPlayers: parsePlayerList(matches[9]),
        partyId: matches[10],
        partyPlayers: parsePlayerList(matches[11]),
    };
};

function parsePlayerList(s) {
    if (!s) {
        return [];
    }
    let matches = s.matchAll('(?:\\s?\\d:\\[\\w:\\d:(\\d+)\\])');
    let playerIds = [];
    for (let match of matches) {
        playerIds.push(+match[1]);
    }
    return playerIds;
}