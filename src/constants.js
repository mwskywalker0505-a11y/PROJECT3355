export const ASSETS = {
    BGM_PROLOGUE: '/bgm_prologue.mp3',
    BGM_MOON_SEARCH: '/bgm_moon_search.mp3',
    SE_SPACESHIP_TAIKI: '/se_spaceship_taiki.mp3',
    SE_SPACESHIP_LAUNCH: '/se_spaceship_launch1.mp3',
    SE_SPACESHIP_LAUNCH2: '/se_spaceship_launch2.mp3',
    NASA_BG: '/space_background1.png', // Static Starfield
    SE_TOUCH: '/se_touch.mp3',
    SE_POPUP: '/se_popup.mp3',
    SE_KEIKOKU: '/se_keikoku.mp3', // Reverted to original
    SE_ALERT: '/se_keikoku2.mp3',   // New Alert Sound
    SE_MOON_SEARCH2: '/se_moon_search2.mp3',
    // User provided transparent PNG (Corrected filename)
    MOON: '/FullMoon.png',
    // Multi-Planet Assets (Transparent PNGs)
    MARS: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/3D_Mars.png',
    MERCURY: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/3D_Mercury.png',
    SATURN: '/saturn.png',
    IMG_ASTRONAUT: '/astronaut_me.png', // User's astronaut image
    BGM_ENDING: '/yellow.mp3',          // Coldplay - Yellow
};

export const PHASES = {
    INTRO: 0,
    LAUNCH: 1,
    SEARCH: 2,
    CLIMAX: 3,
};

export const PLANET_INFO = {
    MOON: {
        name: "MOON (月)",
        type: "衛星 (SATELLITE)",
        gravity: "1.62 m/s² (0.165g)",
        temp: "-173°C ~ 127°C",
        atmosphere: "真空 (微量のHe, Ne, Ar)",
        desc: "地球唯一の天然衛星。表面はクレーターに覆われ、荒涼としている。"
    },
    MARS: {
        name: "MARS (火星)",
        type: "岩石惑星 (TERRESTRIAL)",
        gravity: "3.72 m/s² (0.379g)",
        temp: "-140°C ~ 30°C",
        atmosphere: "CO2 (95%), N2 (3%), Ar",
        desc: "赤い惑星。極冠には氷が存在し、かつては水が流れていた痕跡がある。"
    },
    MERCURY: {
        name: "MERCURY (水星)",
        type: "岩石惑星 (TERRESTRIAL)",
        gravity: "3.70 m/s² (0.38g)",
        temp: "-173°C ~ 427°C",
        atmosphere: "希薄 (O2, Na, H2)",
        desc: "太陽系で最も内側の惑星。昼夜の寒暖差が激しく、表面は焼け焦げている。"
    },
    SATURN: {
        name: "SATURN (土星)",
        type: "巨大ガス惑星 (GAS GIANT)",
        gravity: "10.44 m/s² (1.065g)",
        temp: "-178°C (1気圧)",
        atmosphere: "H2 (96%), He (3%)",
        desc: "巨大なリングを持つ美しい惑星。多数の衛星を従えるガス巨人。"
    }
};
