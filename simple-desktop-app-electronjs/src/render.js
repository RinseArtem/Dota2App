const { remote, ipcRenderer } = require('electron');
var fs = require('fs');


document.getElementById('minimize-button').addEventListener('click', () => {
    remote.getCurrentWindow().minimize()
});

document.getElementById('min-max-button').addEventListener('click', () => {
    const currentWindow = remote.getCurrentWindow();
    if(currentWindow.isMaximized()) {
        currentWindow.unmaximize()
    } else {
        currentWindow.maximize()
    }
});

document.getElementById('close-button').addEventListener('click', () => {
    remote.app.quit()
});

window.fetchTemplate = function (template) {

    // var $template = selectorOrElement;
    // if (typeof selectorOrElement === 'string') {
    //     $template = $(selectorOrElement);
    // }
    // $template = $template.filter('.js-template');
    // $template.removeClass('js-template');
    // $template.removeAttr('id');
    // var html = $template.prop('outerHTML');
    // $template.remove();

    return fs.readFileSync(__dirname + '/templates/' + template + '.html', 'utf8');
};

window.createFromTemplate = function (templateHtml, replacements) {
    var html = templateHtml;
    $.each(replacements, function (key, value) {
        html = replaceTemplateKey(html, key, value);
    });
    return $(html);
};

window.replaceTemplateKey = function (html, key, value) {
    var regex = new RegExp('%' + key + '%', 'g');
    return html.replace(regex, value);
};


var playerTemplate = fetchTemplate('player');

ipcRenderer.on('info', (event, data) => {

    console.log(data);
    if (data.type === 'playerInfo') {
        var kv = {
            avatar : data.avatar,
            name : data.name,
            rank_tier : data.rankTier,
            rank_star : data.rankStars,
        };
        var html = createFromTemplate(playerTemplate, kv);
        $('.pl.p' + data.pos).html(html);
        $('.pl.p' + data.pos).attr('id', 'id' + data.id);
        if (data.rankLeaderBoard !== null) {
            $('#id' + data.id + ' .rank').append('<b>' + data.rankLeaderBoard + '</b>')
        }
        if (data.plus) {
            $('#id' + data.id + ' .player').append('<img src="ico/dota_plus.png" class="dplus"/>')
        }
        if (data.isCurrentPlayer) {
            $('#id' + data.id + ' .player').append('<i class="cui-user" data-toggle="tooltip" data-placement="bottom" title="Это Вы"></i>')
        }
    }
});

ipcRenderer.on('wl', (event, data) => {
    console.log(data);
    if (data.isCurrentPlayer) {
        $('#id' + data.id + ' p.win-lose').html('—');
    } else {
        $('#id' + data.id + ' p.win-lose').html('<span class="win">' + data.win + '</span> / <span class="lose">' + data.lose + '</span>');
    }

});