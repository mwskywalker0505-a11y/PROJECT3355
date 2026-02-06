export const ASSETS = {
    BGM_PROLOGUE: '/bgm_prologue.mp3',
    BGM_MOON_SEARCH: '/bgm_moon_search.mp3',
    SE_SPACESHIP_TAIKI: '/se_spaceship_taiki.mp3',
    SE_SPACESHIP_LAUNCH: '/se_spaceship_launch1.mp3',
    SE_SPACESHIP_LAUNCH2: '/se_spaceship_launch2.mp3',
    NASA_BG: '/space_background1.png', // Static Starfield
    SE_TOUCH: '/se_touch.mp3',
    SE_POPUP: '/se_popup.mp3',
    SE_KEIKOKU: '/se_keikoku.mp3',
    SE_MOON_SEARCH2: '/se_moon_search2.mp3',
    // User provided transparent PNG (Corrected filename)
    MOON: '/FullMoon.png',
    // Multi-Planet Assets
    MARS: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
    MERCURY: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
    SATURN: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
};

export const PHASES = {
    INTRO: 0,
    LAUNCH: 1,
    SEARCH: 2,
    CLIMAX: 3,
};

export const PLANET_INFO = {
    MOON: {
        name: "THE MOON",
        type: "SATELLITE",
        gravity: "1.62 m/s² (0.165g)",
        temp: "-173°C ~ 127°C",
        atmosphere: "VACUUM (Trace: He, Ne, Ar)",
        desc: "Earth's only natural satellite. Surface is cratered and barren."
    },
    MARS: {
        name: "MARS",
        type: "TERRESTRIAL PLANET",
        gravity: "3.72 m/s² (0.379g)",
        temp: "-140°C ~ 30°C",
        atmosphere: "CO2 (95%), N2 (3%), Ar (1.6%)",
        desc: "The Red Planet. Dusty, cold, desert world with polar ice caps."
    },
    MERCURY: {
        name: "MERCURY",
        type: "TERRESTRIAL PLANET",
        gravity: "3.70 m/s² (0.38g)",
        temp: "-173°C ~ 427°C",
        atmosphere: "EXOSPHERE (O2, Na, H2, He)",
        desc: "Smallest planet. Tidally locked. Extreme temperature fluctuations."
    },
    SATURN: {
        name: "SATURN",
        type: "GAS GIANT",
        gravity: "10.44 m/s² (1.065g)",
        temp: "-178°C (1 bar)",
        atmosphere: "H2 (96%), He (3%), CH4 (0.4%)",
        desc: "Massive ball of gas with a complex ring system and many moons."
    }
};
