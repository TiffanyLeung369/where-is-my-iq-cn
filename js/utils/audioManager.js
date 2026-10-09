/**
 * H5 音频管理器（替代微信小程序版 audioManager）
 * 使用 HTML5 Audio API
 */

const AUDIO_BASE = 'assets/audio/';

const AudioManager = {
  // BGM 相关
  _bgm: null,
  _bgmReady: false,
  _currentBgmSrc: '',

  // 欢呼声独立通道
  _celebrateAudio: null,

  // 音效池（用于重叠播放）
  _sfxPool: [],
  _maxPoolSize: 8,

  // 开关状态
  musicOn: true,
  soundOn: true,

  // H5 特有：是否已经有用户交互（解锁音频自动播放）
  _userInteracted: false,

  // 音频路径映射
  SFX: {
    click:         AUDIO_BASE + 'click.wav',
    correct:       AUDIO_BASE + 'happy_correct.wav',
    wrong:         AUDIO_BASE + 'wrong.wav',
    win:           AUDIO_BASE + 'win.wav',
    lose:          AUDIO_BASE + 'lose.wav',
    mark:          AUDIO_BASE + 'mark.wav',
    unmark:        AUDIO_BASE + 'unmark.wav',
    coin:          AUDIO_BASE + 'coin2.wav',
    ding:          AUDIO_BASE + 'coin2.wav',
    typewriter:    AUDIO_BASE + 'click.wav',
    countdown:     AUDIO_BASE + 'countdown.wav',
    cheer:         AUDIO_BASE + 'cheer.mp3',
  },

  BGM: {
    menu:          AUDIO_BASE + 'bgm_menu.mp3',
  },

  init() {
    // 从 localStorage 读取开关设置
    const musicSaved = localStorage.getItem('audioMusicOn');
    const soundSaved = localStorage.getItem('audioSoundOn');
    if (musicSaved !== null) this.musicOn = musicSaved !== 'false';
    if (soundSaved !== null) this.soundOn = soundSaved !== 'false';

    // 监听用户交互，解锁音频播放
    const unlock = () => {
      if (this._userInteracted) return;
      this._userInteracted = true;
      // 尝试播放 BGM
      if (this.musicOn && this._bgm) {
        this._bgm.play().then(() => {
          // 成功，移除监听
          document.removeEventListener('touchstart', unlock, true);
          document.removeEventListener('touchend', unlock, true);
          document.removeEventListener('click', unlock, true);
        }).catch(() => {
          // 失败，重置标记等下次交互再试
          this._userInteracted = false;
        });
      } else {
        // BGM 还没创建，标记已交互即可，playBGM 调用时会直接播放
        document.removeEventListener('touchstart', unlock, true);
        document.removeEventListener('touchend', unlock, true);
        document.removeEventListener('click', unlock, true);
      }
    };
    document.addEventListener('touchstart', unlock, true);
    document.addEventListener('touchend', unlock, true);
    document.addEventListener('click', unlock, true);
  },

  // ==================== BGM ====================

  playBGM(name) {
    const src = this.BGM[name];
    if (!src) return;

    if (this._bgm && this._currentBgmSrc === src) {
      // 同一首 BGM，只需恢复播放
      if (this.musicOn && this._userInteracted) {
        this._bgm.play().catch(() => {});
      }
      return;
    }

    // 停掉旧的
    this.stopBGM();

    this._bgm = new Audio(src);
    this._bgm.loop = true;
    this._bgm.volume = 0.5;
    this._currentBgmSrc = src;

    if (this.musicOn && this._userInteracted) {
      this._bgm.play().catch(() => {});
    }
  },

  stopBGM() {
    if (this._bgm) {
      this._bgm.pause();
      this._bgm.currentTime = 0;
      this._bgm = null;
      this._currentBgmSrc = '';
    }
  },

  pauseBGM() {
    if (this._bgm) {
      this._bgm.pause();
    }
  },

  resumeBGM() {
    if (this._bgm && this.musicOn && this._userInteracted) {
      this._bgm.play().catch(() => {});
    }
  },

  // ==================== SFX ====================

  playSFX(name) {
    if (!this.soundOn) return;
    const src = this.SFX[name];
    if (!src) return;

    // 新建音频实例支持重叠播放
    const audio = new Audio(src);
    audio.volume = 0.8;
    audio.play().catch(() => {});

    // 简单的池管理，防止内存泄漏
    this._sfxPool.push(audio);
    if (this._sfxPool.length > this._maxPoolSize) {
      const old = this._sfxPool.shift();
      old.pause();
      old.src = '';
    }

    // 播放完毕后从池中移除
    audio.addEventListener('ended', () => {
      const idx = this._sfxPool.indexOf(audio);
      if (idx > -1) this._sfxPool.splice(idx, 1);
    });
  },

  // ==================== 欢呼声 ====================

  playCelebrate() {
    if (!this.soundOn) return;
    this.stopCelebrate();
    this._celebrateAudio = new Audio(this.SFX.cheer);
    this._celebrateAudio.volume = 0.7;
    this._celebrateAudio.play().catch(() => {});
  },

  stopCelebrate() {
    if (this._celebrateAudio) {
      this._celebrateAudio.pause();
      this._celebrateAudio.currentTime = 0;
      this._celebrateAudio = null;
    }
  },

  // ==================== 开关 ====================

  setMusicOn(on) {
    this.musicOn = on;
    localStorage.setItem('audioMusicOn', String(on));
    if (on) {
      this.resumeBGM();
    } else {
      this.pauseBGM();
    }
  },

  setSoundOn(on) {
    this.soundOn = on;
    localStorage.setItem('audioSoundOn', String(on));
  },

  // ==================== 页面可见性 ====================

  onHide() {
    this.pauseBGM();
  },

  onShow() {
    this.resumeBGM();
  },
};
