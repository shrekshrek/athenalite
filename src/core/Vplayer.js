import JSMpeg from 'exports-loader?JSMpeg!libs/vplayer/jsmpeg.min';
import enableInlineVideo from 'exports-loader?enableInlineVideo!libs/vplayer/iphone-inline-video.min';
import {model} from 'core/model';

var Vplayer = function (url, options) {
    options = options || {};

    var empty = function () {
    };

    this.onStart = options.onStart || empty;
    this.onEnd = options.onEnd || empty;
    this.onPlaying = options.onPlaying || empty;
    this.lastTime = 0;

    if (model.ua.ios || model.ua.wechat) {
        this.type = 'video';
        this.el = document.createElement('video');
        this.el.preload = 'auto';
        this.el.loop = options.loop || false;
        this.el.setAttribute('webkit-playsinline', 'true');
        this.el.setAttribute('playsinline', 'true');
        if (model.ua.android) {
            this.el.setAttribute('x-webkit-airplay', 'true');
            this.el.setAttribute('x5-video-player-type', 'h5');
            this.el.setAttribute('x5-video-player-fullscreen', 'true');
            this.el.setAttribute('x5-video-orientation', 'portrait');

            this.el.addEventListener('x5videoenterfullscreen', () => {
                this.el.play();
            });
        }
        this.el.style.objectFit = 'fill';
        this.el.src = url + '.mp4';
        this.player = this.el;

        var driver;
        if (model.ua.weibo) {
            enableInlineVideo(this.el);
            driver = this.el['bfred-it:iphone-inline-video'].driver;
        } else {
            driver = this.player;
        }

        driver.addEventListener('timeupdate', () => {
            if (this.lastTime === 0 && driver.currentTime > 0) this.onStart();
            else if (this.lastTime !== driver.currentTime) this.onPlaying();
            this.lastTime = driver.currentTime;
        });
        driver.addEventListener('ended', () => {
            this.onEnd();
        });
    } else {
        this.type = 'canvas';
        this.el = document.createElement('canvas');
        this.player = new JSMpeg.Player(url + '.ts', {
            canvas: this.el,
            loop: (options.loop || false),
            onPlaying: () => {
                if (this.lastTime === 0 && this.player.currentTime > 0) this.onStart();
                else if (this.lastTime !== this.player.currentTime) this.onPlaying();
                this.lastTime = this.player.currentTime;
            },
            onEnd: () => {
                this.onEnd();
            }
        });
    }

    if (options.width && options.height) this.resize(options.width, options.height);
    this.el.style.position = 'absolute';
};

Object.assign(Vplayer.prototype, {
    currentTime: function () {
        return this.player.currentTime;
    },

    load: function () {
        if (this.type === 'video')
            this.player.load();
        else
            this.player.stop();
    },

    play: function (time) {
        if (time !== undefined) this.seek(time);
        this.player.play();
    },

    seek: function (time) {
        this.player.currentTime = time;
    },

    pause: function () {
        this.player.pause();
    },

    destroy: function () {
        if (this.type === 'video') this.player.src = '';
        else this.player.destroy();
    },

    resize: function (width, height) {
        this.el.style.width = width + 'px';
        this.el.style.height = height + 'px';
    },

    muted: function (bool) {
        if (this.type === 'video') this.player.muted = bool;
        else this.player.volume = bool ? 0 : 1;
    }

});

export {Vplayer};